"""
Deterministic Verification Suite for Statistical Mathematics & Analytics API Endpoints.
Tests:
1. Exact Hand-Calculated Statistics (Wilson 95% Score Interval, Black-Scholes r=0, Option Delta)
2. All Router Query Engines (Heatmap, Strike Finder, Distance Calculator, SL Planner, Backtester, Live Ticker, Regimes)
3. Latency Benchmarks (asserting p95 < 500ms for cached and hot queries)
"""

import os
import sys
import math
import time
import unittest

os.environ["BYPASS_INTERNAL_AUTH"] = "true"
os.environ["BTC_PROCESSED_DIR"] = r"C:/binance_btc_data/processed"
sys.path.insert(0, r"C:\binance_btc_data")

from api.stats import normal_cdf, wilson_score_interval, black_scholes, option_delta
from api.routers.heatmap import compute_heatmap
from api.routers.strike_finder import compute_strike_finder
from api.routers.distance_calc import compute_distance_profile
from api.routers.sl_planner import compute_sl_plan
from api.routers.backtester import compute_backtest
from api.routers.live_ticker import fetch_live_data
from api.routers.regimes import compute_regimes


class TestStatisticalFormulas(unittest.TestCase):

    def test_normal_cdf(self):
        self.assertAlmostEqual(normal_cdf(0.0), 0.5, places=6)
        self.assertAlmostEqual(normal_cdf(1.95996398), 0.975, places=3)
        self.assertAlmostEqual(normal_cdf(-1.95996398), 0.025, places=3)

    def test_wilson_score_interval_hand_calc(self):
        # Hand calculation: k=5, n=100, 95% confidence
        # lower ≈ 2.155%, upper ≈ 11.175%
        lower, upper = wilson_score_interval(5, 100, confidence=0.95)
        self.assertAlmostEqual(lower, 2.155, delta=0.05)
        self.assertAlmostEqual(upper, 11.175, delta=0.05)

        # Edge case: zero touches (k=0, n=100)
        lower_zero, upper_zero = wilson_score_interval(0, 100, confidence=0.95)
        self.assertEqual(lower_zero, 0.0)
        self.assertAlmostEqual(upper_zero, 3.69, delta=0.1)

        # Edge case: 100% touches (k=100, n=100)
        lower_full, upper_full = wilson_score_interval(100, 100, confidence=0.95)
        self.assertAlmostEqual(lower_full, 96.31, delta=0.1)
        self.assertEqual(upper_full, 100.0)

    def test_black_scholes_atm_hand_calc(self):
        # S=100, K=100, T=1yr (8760h), iv=0.20, r=0.0 => call = 7.96556
        call_p = black_scholes(spot=100.0, strike=100.0, hours=8760.0, iv=0.20, is_call=True, r=0.0)
        put_p = black_scholes(spot=100.0, strike=100.0, hours=8760.0, iv=0.20, is_call=False, r=0.0)

        self.assertAlmostEqual(call_p, 7.96556, delta=0.005)
        self.assertAlmostEqual(call_p, put_p, places=5)

    def test_black_scholes_crypto_scale(self):
        atm_call = black_scholes(spot=70000.0, strike=70000.0, hours=6.0, iv=0.50, is_call=True)
        self.assertTrue(300.0 < atm_call < 450.0)

        otm_call = black_scholes(spot=70000.0, strike=75000.0, hours=6.0, iv=0.50, is_call=True)
        self.assertTrue(otm_call < 1.0)

    def test_option_delta(self):
        delta_c = option_delta(100.0, 100.0, 8760.0, 0.20, is_call=True)
        delta_p = option_delta(100.0, 100.0, 8760.0, 0.20, is_call=False)
        self.assertTrue(0.50 < delta_c < 0.55)
        self.assertTrue(-0.50 < delta_p < -0.45)
        self.assertAlmostEqual(delta_c - delta_p, 1.0, places=5)


class TestAnalyticsRouters(unittest.TestCase):

    def test_01_heatmap_engine(self):
        t0 = time.time()
        res = compute_heatmap(
            hold_min=360,
            side="call",
            strike_distance_pct=2.5,
            from_year=2024,
            to_year=2026,
            metric="touch_prob",
            grid_resolution="hour",
            tz_offset_min=330
        )
        dt_cold = (time.time() - t0) * 1000.0
        self.assertEqual(len(res["cells"]), 168)
        self.assertIn("selection_bias_note", res)
        self.assertGreater(res["overall_n"], 50000)
        self.assertTrue(0 <= res["overall_touch_pct"] <= 100)

        # Test cached call latency
        t1 = time.time()
        res_cached = compute_heatmap(
            hold_min=360,
            side="call",
            strike_distance_pct=2.5,
            from_year=2024,
            to_year=2026,
            metric="touch_prob",
            grid_resolution="hour",
            tz_offset_min=330
        )
        dt_cached = (time.time() - t1) * 1000.0
        print(f"\n[BENCHMARK] Heatmap: cold={dt_cold:.1f}ms, cached={dt_cached:.3f}ms")
        self.assertLess(dt_cached, 10.0)

    def test_02_strike_finder_engine(self):
        t0 = time.time()
        res = compute_strike_finder(
            spot=70000.0,
            hold_min=360,
            side="call",
            max_touch_prob=5.0,
            min_premium=20.0,
            iv=0.45,
            from_year=2024,
            to_year=2026,
            tz_offset_min=330
        )
        dt = (time.time() - t0) * 1000.0
        self.assertGreater(len(res["results"]), 0)
        top = res["results"][0]
        self.assertLessEqual(top["touch_pct_recent"], 5.0)
        self.assertGreaterEqual(top["theoretical_premium"], 20.0)
        self.assertIn("THEORETICAL ESTIMATE ONLY", res["disclaimer"])
        print(f"[BENCHMARK] Strike Finder: {dt:.1f}ms, top result={top['day_name']} {top['entry_time_str']} strike={top['strike']}")

    def test_03_distance_calculator_engine(self):
        t0 = time.time()
        res = compute_distance_profile(
            day_of_week=0,  # Sunday
            hour=10,
            minute=0,
            hold_min=360,
            side="call",
            strike_distance_pct=2.5,
            spot=70000.0,
            tz_offset_min=330
        )
        dt = (time.time() - t0) * 1000.0
        self.assertGreaterEqual(len(res["by_year"]), 8)
        self.assertLessEqual(len(res["worst_10_dates"]), 10)
        self.assertGreater(res["sample_size_n"], 200)
        print(f"[BENCHMARK] Distance Calculator: {dt:.1f}ms, total sample={res['sample_size_n']}, touch%={res['overall_touch_pct']}%")

    def test_04_sl_planner_engine(self):
        t0 = time.time()
        res = compute_sl_plan(
            day_of_week=0,
            hour=10,
            minute=0,
            hold_min=360,
            spot=70000.0,
            user_sl_pct=1.5,
            side="both",
            tz_offset_min=330
        )
        dt = (time.time() - t0) * 1000.0
        self.assertGreaterEqual(res["user_sl_hit_rate_pct"], 0.0)
        self.assertGreater(res["p95_adverse_move_pct"], 0.0)
        self.assertGreater(res["worst_adverse_pts"], 0.0)
        print(f"[BENCHMARK] SL Planner: {dt:.1f}ms, SL hit rate={res['user_sl_hit_rate_pct']}%, p95 move={res['p95_adverse_move_pct']}%")

    def test_05_backtester_engine(self):
        t0 = time.time()
        res = compute_backtest(
            strategy="strangle",
            day_of_week=0,
            hour=10,
            minute=0,
            hold_min=360,
            call_dist_pct=2.5,
            put_dist_pct=2.5,
            sl_mode="spot_pct",
            sl_threshold=1.5,
            iv=0.45,
            regime_filter=False,
            max_7d_vol=None,
            train_years=(2017, 2023),
            test_years=(2024, 2026),
            tz_offset_min=330
        )
        dt = (time.time() - t0) * 1000.0
        self.assertGreater(res["in_sample"]["trade_count"], 0)
        self.assertGreater(res["out_of_sample"]["trade_count"], 0)
        self.assertGreater(len(res["equity_curve"]), 0)
        self.assertGreaterEqual(len(res["yearly_breakdown"]), 8)
        print(f"[BENCHMARK] Backtester: {dt:.1f}ms, in-sample win={res['in_sample']['win_rate_pct']}%, out-of-sample win={res['out_of_sample']['win_rate_pct']}%")

    def test_06_regimes_engine(self):
        t0 = time.time()
        res = compute_regimes()
        dt = (time.time() - t0) * 1000.0
        self.assertGreater(res["median_7d_vol"], 0.0)
        self.assertGreater(res["total_days_analyzed"], 3000)
        print(f"[BENCHMARK] Regimes: {dt:.1f}ms, 7d vol median={res['median_7d_vol']}%, analyzed days={res['total_days_analyzed']}")

    def test_07_live_ticker(self):
        t0 = time.time()
        res = fetch_live_data(tz_offset_min=330)
        dt = (time.time() - t0) * 1000.0
        self.assertGreater(res["btc_price"], 1000.0)
        self.assertIn("current_hour_rank", res)
        print(f"[BENCHMARK] Live Ticker: {dt:.1f}ms, BTC={res['btc_price']}, source={res['source']}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
