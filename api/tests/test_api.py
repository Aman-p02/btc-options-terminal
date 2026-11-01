"""
Integration Tests for Analytics API Endpoints.
Verifies all routes against real precomputed Parquet data, checking schema, values, and latency.
"""

import os
import pytest
from fastapi.testclient import TestClient

os.environ["BYPASS_INTERNAL_AUTH"] = "true"
os.environ["BTC_PROCESSED_DIR"] = r"C:/binance_btc_data/processed"

from api.main import app

client = TestClient(app)


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "precomputed excursion rows" in data["storage"]


def test_heatmap_endpoint():
    payload = {
        "hold_min": 360,
        "side": "call",
        "strike_distance_pct": 2.5,
        "from_year": 2024,
        "to_year": 2026,
        "metric": "touch_prob",
        "grid_resolution": "hour",
        "tz_offset_min": 330
    }
    resp = client.post("/api/heatmap", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["cells"]) == 168  # 7 days * 24 hours
    assert "selection_bias_note" in data
    assert data["overall_n"] > 50000
    assert 0 <= data["overall_touch_pct"] <= 100
    # Process time check
    ms = float(resp.headers.get("X-Process-Time-Ms", 0))
    print(f"Heatmap latency: {ms:.1f}ms")
    assert ms < 500.0  # p95 requirement


def test_strike_finder_endpoint():
    payload = {
        "spot": 70000.0,
        "hold_min": 360,
        "side": "call",
        "max_touch_prob": 5.0,
        "min_premium": 20.0,
        "iv": 0.45,
        "from_year": 2024,
        "to_year": 2026,
        "tz_offset_min": 330
    }
    resp = client.post("/api/strike-finder", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) > 0
    top = data["results"][0]
    assert top["touch_pct_recent"] <= 5.0
    assert top["theoretical_premium"] >= 20.0
    assert "THEORETICAL ESTIMATE ONLY" in data["disclaimer"]


def test_distance_calc_endpoint():
    payload = {
        "day_of_week": 0,  # Sunday
        "hour": 10,
        "minute": 0,
        "hold_min": 360,
        "side": "call",
        "strike_distance_pct": 2.5,
        "spot": 70000.0,
        "tz_offset_min": 330
    }
    resp = client.post("/api/distance-calculator", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["by_year"]) >= 8
    assert len(data["worst_10_dates"]) <= 10
    assert data["sample_size_n"] > 200


def test_sl_planner_endpoint():
    payload = {
        "day_of_week": 0,
        "hour": 10,
        "minute": 0,
        "hold_min": 360,
        "spot": 70000.0,
        "user_sl_pct": 1.5,
        "side": "both",
        "tz_offset_min": 330
    }
    resp = client.post("/api/sl-planner", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_sl_hit_rate_pct"] >= 0.0
    assert data["p95_adverse_move_pct"] > 0.0
    assert data["worst_adverse_pts"] > 0.0


def test_backtest_endpoint():
    payload = {
        "strategy": "strangle",
        "day_of_week": 0,  # Sunday
        "hour": 10,
        "minute": 0,
        "hold_min": 360,
        "call_dist_pct": 2.5,
        "put_dist_pct": 2.5,
        "sl_mode": "spot_pct",
        "sl_threshold": 1.5,
        "iv": 0.45,
        "regime_filter": False,
        "train_years": [2017, 2023],
        "test_years": [2024, 2026],
        "tz_offset_min": 330
    }
    resp = client.post("/api/backtest", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["in_sample"]["trade_count"] > 0
    assert data["out_of_sample"]["trade_count"] > 0
    assert len(data["equity_curve"]) > 0
    assert len(data["yearly_breakdown"]) >= 8


def test_live_ticker_endpoint():
    resp = client.get("/api/live/ticker")
    assert resp.status_code == 200
    data = resp.json()
    assert data["btc_price"] > 1000.0
    assert "current_hour_rank" in data


def test_regimes_endpoint():
    resp = client.get("/api/regimes")
    assert resp.status_code == 200
    data = resp.json()
    assert data["median_7d_vol"] > 0.0
    assert data["total_days_analyzed"] > 3000

