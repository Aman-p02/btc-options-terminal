"""
Comprehensive Strategy Backtester with In-Sample/Out-of-Sample Split and Regime Filtering.
Simulates Short Call, Short Put, or Short Strangle strategies using Black-Scholes theoretical pricing (r=0)
and exact historical adverse excursions from 2017 to 2026.
"""

from fastapi import APIRouter, Depends
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

from api.models import (
    BacktestRequest,
    BacktestResponse,
    BacktestTrade,
    BacktestSummaryMetrics
)
from api.security import verify_internal_secret
from api.db import get_db, get_excursions_path, get_daily_path
from api.stats import black_scholes
from api.cache import cached_query

router = APIRouter(prefix="/backtest", tags=["Backtester"])

DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


@router.post("", response_model=BacktestResponse)
def run_backtest(
    req: BacktestRequest,
    _auth: bool = Depends(verify_internal_secret)
):
    return compute_backtest(
        req.strategy,
        req.day_of_week,
        req.hour,
        req.minute,
        req.hold_min,
        req.call_dist_pct,
        req.put_dist_pct,
        req.sl_mode,
        req.sl_threshold,
        req.iv,
        req.regime_filter,
        req.max_7d_vol,
        tuple(req.train_years),
        tuple(req.test_years),
        req.tz_offset_min
    )


@cached_query(ttl_seconds=300)
def compute_backtest(
    strategy: str,
    day_of_week: Optional[int],
    hour: Optional[int],
    minute: Optional[int],
    hold_min: int,
    call_dist_pct: float,
    put_dist_pct: float,
    sl_mode: str,
    sl_threshold: float,
    iv: float,
    regime_filter: bool,
    max_7d_vol: Optional[float],
    train_years: tuple,
    test_years: tuple,
    tz_offset_min: int = 330
) -> dict:
    con = get_db()
    ex_path = get_excursions_path()
    daily_path = get_daily_path()

    tz_expr = f"entry_ts_utc + INTERVAL {tz_offset_min} MINUTE"
    hours = hold_min / 60.0

    # Build filtering clauses
    where_clauses = [f"e.hold_min = {hold_min}"]
    if day_of_week is not None:
        where_clauses.append(f"dayofweek({tz_expr}) = {day_of_week}")
    if hour is not None:
        where_clauses.append(f"hour({tz_expr}) = {hour}")
    if minute is not None:
        where_clauses.append(f"minute({tz_expr}) = {minute}")

    regime_join = ""
    if regime_filter and max_7d_vol is not None and max_7d_vol > 0:
        regime_join = f"JOIN '{daily_path}' d ON CAST(e.entry_ts_utc AS DATE) = d.date"
        where_clauses.append(f"d.vol_7d <= {max_7d_vol}")

    where_sql = " AND ".join(where_clauses)

    sql = f"""
    SELECT
        e.entry_ts_utc,
        e.entry_price,
        year(e.entry_ts_utc) AS yr,
        round(e.max_up_pct, 4) AS up,
        round(e.max_dn_pct, 4) AS dn,
        round(e.net_pct, 4) AS net_pct
    FROM '{ex_path}' e
    {regime_join}
    WHERE {where_sql}
    ORDER BY e.entry_ts_utc;
    """

    df = con.execute(sql).df()

    trades: List[BacktestTrade] = []
    
    for _, r in df.iterrows():
        s0 = float(r['entry_price'])
        yr = int(r['yr'])
        up = float(r['up'])
        dn = float(r['dn'])
        net = float(r['net_pct'])
        ts_utc_str = str(r['entry_ts_utc'])
        date_str = ts_utc_str[:10]

        is_in_sample = (train_years[0] <= yr <= train_years[1])

        # Strikes
        kc = round(s0 * (1.0 + call_dist_pct / 100.0), 1) if strategy in ["sell_call", "strangle"] else None
        kp = round(s0 * (1.0 - put_dist_pct / 100.0), 1) if strategy in ["sell_put", "strangle"] else None

        # Entry Theoretical Premium (r=0)
        p_call = black_scholes(s0, kc, hours, iv, is_call=True) if kc else 0.0
        p_put = black_scholes(s0, kp, hours, iv, is_call=False) if kp else 0.0
        total_entry_prem = round(p_call + p_put, 2)

        # Check Stop-Loss Trigger
        outcome = "FULL_WIN"
        pnl = total_entry_prem

        if sl_mode == "spot_pct":
            # SL triggers if spot moves adverse by sl_threshold %
            call_sl_hit = (strategy in ["sell_call", "strangle"]) and (up >= sl_threshold)
            put_sl_hit = (strategy in ["sell_put", "strangle"]) and (dn >= sl_threshold)

            if call_sl_hit or put_sl_hit:
                # Option closed at adverse move repricing
                # Approximate SL close cost: 2x the entry premium or proportional spot loss
                loss = total_entry_prem * 2.0  # standard 2x risk loss on hit
                pnl = -loss
                outcome = "CALL_SL" if call_sl_hit else "PUT_SL"
            else:
                # Expired without SL. Did it finish ITM?
                exit_spot = s0 * (1.0 + net / 100.0)
                call_payoff = max(0.0, exit_spot - kc) if kc else 0.0
                put_payoff = max(0.0, kp - exit_spot) if kp else 0.0
                total_payoff = call_payoff + put_payoff
                pnl = total_entry_prem - total_payoff
                if total_payoff > 0:
                    outcome = "EXPIRED_ITM"
        else:  # premium_multiple
            # Peak option reprice at peak excursion
            # For call: peak spot = s0 * (1 + up/100)
            peak_spot_c = s0 * (1.0 + up / 100.0)
            peak_call_prem = black_scholes(peak_spot_c, kc, hours * 0.5, iv, is_call=True) if kc else 0.0
            peak_spot_p = s0 * (1.0 - dn / 100.0)
            peak_put_prem = black_scholes(peak_spot_p, kp, hours * 0.5, iv, is_call=False) if kp else 0.0
            
            call_sl_hit = kc and (peak_call_prem >= p_call * sl_threshold)
            put_sl_hit = kp and (peak_put_prem >= p_put * sl_threshold)

            if call_sl_hit or put_sl_hit:
                loss = total_entry_prem * (sl_threshold - 1.0)
                pnl = -loss
                outcome = "CALL_SL" if call_sl_hit else "PUT_SL"
            else:
                exit_spot = s0 * (1.0 + net / 100.0)
                call_payoff = max(0.0, exit_spot - kc) if kc else 0.0
                put_payoff = max(0.0, kp - exit_spot) if kp else 0.0
                total_payoff = call_payoff + put_payoff
                pnl = total_entry_prem - total_payoff
                if total_payoff > 0:
                    outcome = "EXPIRED_ITM"

        pnl_pct = round((pnl / s0) * 100.0, 3)

        trades.append(BacktestTrade(
            date_str=date_str,
            entry_ts_utc=ts_utc_str,
            entry_price=s0,
            call_strike=kc,
            put_strike=kp,
            theoretical_entry_premium=total_entry_prem,
            exit_pnl_usd=round(pnl, 2),
            exit_pnl_pct=pnl_pct,
            outcome=outcome,
            max_up_pct=up,
            max_dn_pct=dn,
            net_pct=net,
            is_in_sample=is_in_sample
        ))

    # Calculate summary metrics helper
    def calc_metrics(trade_list: List[BacktestTrade]) -> BacktestSummaryMetrics:
        n = len(trade_list)
        if n == 0:
            return BacktestSummaryMetrics(
                trade_count=0, win_count=0, sl_count=0, win_rate_pct=0.0,
                sl_hit_rate_pct=0.0, avg_win_usd=0.0, avg_loss_usd=0.0,
                expectancy_usd=0.0, profit_factor=0.0, max_drawdown_pct=0.0,
                total_pnl_usd=0.0
            )

        wins = [t for t in trade_list if t.exit_pnl_usd > 0]
        losses = [t for t in trade_list if t.exit_pnl_usd <= 0]
        sls = [t for t in trade_list if "SL" in t.outcome]

        win_count = len(wins)
        sl_count = len(sls)
        win_rate = round(100.0 * win_count / n, 2)
        sl_rate = round(100.0 * sl_count / n, 2)

        avg_win = round(float(np.mean([w.exit_pnl_usd for w in wins])), 2) if wins else 0.0
        avg_loss = round(float(np.mean([abs(l.exit_pnl_usd) for l in losses])), 2) if losses else 0.0

        total_pnl = round(sum(t.exit_pnl_usd for t in trade_list), 2)
        expectancy = round(total_pnl / n, 2)

        gross_profit = sum(w.exit_pnl_usd for w in wins)
        gross_loss = sum(abs(l.exit_pnl_usd) for l in losses)
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else 99.0

        # Drawdown calculation
        cumulative = 0.0
        peak = 0.0
        max_dd = 0.0
        for t in trade_list:
            cumulative += t.exit_pnl_usd
            if cumulative > peak:
                peak = cumulative
            dd = peak - cumulative
            if dd > max_dd:
                max_dd = dd

        # Approximate drawdown as percentage of $10,000 starting account
        dd_pct = round((max_dd / 10000.0) * 100.0, 2)

        return BacktestSummaryMetrics(
            trade_count=n,
            win_count=win_count,
            sl_count=sl_count,
            win_rate_pct=win_rate,
            sl_hit_rate_pct=sl_rate,
            avg_win_usd=avg_win,
            avg_loss_usd=avg_loss,
            expectancy_usd=expectancy,
            profit_factor=profit_factor,
            max_drawdown_pct=dd_pct,
            total_pnl_usd=total_pnl
        )

    in_sample_trades = [t for t in trades if t.is_in_sample]
    out_of_sample_trades = [t for t in trades if not t.is_in_sample]

    in_sample_metrics = calc_metrics(in_sample_trades)
    out_sample_metrics = calc_metrics(out_of_sample_trades)
    full_metrics = calc_metrics(trades)

    # Equity curve building
    equity = 10000.0  # $10,000 base
    peak_equity = 10000.0
    equity_curve = []
    for t in trades:
        equity += t.exit_pnl_usd
        if equity > peak_equity:
            peak_equity = equity
        dd_pct = round(((peak_equity - equity) / peak_equity) * 100.0, 2)
        equity_curve.append({
            "date": t.date_str,
            "equity": round(equity, 2),
            "drawdown_pct": dd_pct,
            "is_in_sample": t.is_in_sample
        })

    # Yearly breakdown
    yearly_dict: Dict[int, List[BacktestTrade]] = {}
    for t in trades:
        yr = int(t.date_str[:4])
        yearly_dict.setdefault(yr, []).append(t)

    yearly_breakdown = []
    for yr in sorted(yearly_dict.keys()):
        yr_trades = yearly_dict[yr]
        m = calc_metrics(yr_trades)
        yearly_breakdown.append({
            "year": yr,
            "trades": m.trade_count,
            "win_rate_pct": m.win_rate_pct,
            "sl_rate_pct": m.sl_hit_rate_pct,
            "pnl_usd": m.total_pnl_usd,
            "expectancy": m.expectancy_usd,
            "profit_factor": m.profit_factor
        })

    return {
        "strategy": strategy,
        "hold_min": hold_min,
        "in_sample": in_sample_metrics.model_dump(),
        "out_of_sample": out_sample_metrics.model_dump(),
        "full_period": full_metrics.model_dump(),
        "equity_curve": equity_curve,
        "yearly_breakdown": yearly_breakdown,
        "trades": [t.model_dump() for t in trades],
        "disclaimer": (
            "THEORETICAL ESTIMATE ONLY. Option premiums and repricing are generated via the Black-Scholes model with r=0. "
            "Crypto options trading involves significant risk of capital loss exceeding collected premiums."
        ),
        "selection_bias_warning": (
            "Selection Bias Warning: Rules fitted to historical periods often fail on out-of-sample data. "
            f"Compare the In-Sample ({train_years[0]}-{train_years[1]}) win rate ({in_sample_metrics.win_rate_pct}%) against "
            f"the Out-of-Sample ({test_years[0]}-{test_years[1]}) win rate ({out_sample_metrics.win_rate_pct}%)."
        )
    }

