"""
Heatmap Router: 7 days x 24 hours (with 15m resolution toggle).
Computes touch probabilities, percentile ranges, worst case, and Wilson confidence intervals.
"""

from fastapi import APIRouter, Depends
from api.models import HeatmapRequest, HeatmapResponse, HeatmapCell
from api.security import verify_internal_secret
from api.db import get_db, get_excursions_path, get_daily_path
from api.stats import wilson_score_interval
from api.cache import cached_query

router = APIRouter(prefix="/heatmap", tags=["Heatmap"])

DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


@router.post("", response_model=HeatmapResponse)
def get_safety_heatmap(
    req: HeatmapRequest,
    _auth: bool = Depends(verify_internal_secret)
):
    return compute_heatmap(
        req.hold_min,
        req.side,
        req.strike_distance_pct,
        req.from_year,
        req.to_year,
        req.metric,
        req.grid_resolution,
        req.tz_offset_min,
        req.max_7d_vol
    )


@cached_query(ttl_seconds=300)
def compute_heatmap(
    hold_min: int,
    side: str,
    strike_distance_pct: float,
    from_year: int,
    to_year: int,
    metric: str,
    grid_resolution: str,
    tz_offset_min: int,
    max_7d_vol: float = None
) -> dict:
    con = get_db()
    ex_path = get_excursions_path()
    daily_path = get_daily_path()

    # Timezone adjustment
    tz_expr = f"entry_ts_utc + INTERVAL {tz_offset_min} MINUTE"
    
    # Side expression for touch condition
    if side == "call":
        touch_expr = f"(max_up_pct >= {strike_distance_pct})"
        range_col = "max_up_pct"
    elif side == "put":
        touch_expr = f"(max_dn_pct >= {strike_distance_pct})"
        range_col = "max_dn_pct"
    else:  # both
        touch_expr = f"(max_up_pct >= {strike_distance_pct} OR max_dn_pct >= {strike_distance_pct})"
        range_col = "greatest(max_up_pct, max_dn_pct)"

    # Regime filter join if requested
    regime_join = ""
    regime_where = ""
    if max_7d_vol is not None and max_7d_vol > 0:
        regime_join = f"JOIN '{daily_path}' d ON CAST(e.entry_ts_utc AS DATE) = d.date"
        regime_where = f"AND d.vol_7d <= {max_7d_vol}"

    if grid_resolution == "15min":
        group_expr = f"dayofweek({tz_expr}), hour({tz_expr}), minute({tz_expr})"
        select_group = f"dayofweek({tz_expr}) AS dow, hour({tz_expr}) AS hr, minute({tz_expr}) AS mi"
    else:
        group_expr = f"dayofweek({tz_expr}), hour({tz_expr})"
        select_group = f"dayofweek({tz_expr}) AS dow, hour({tz_expr}) AS hr, 0 AS mi"

    sql = f"""
    SELECT
        {select_group},
        count(*) AS n,
        sum(CAST({touch_expr} AS INT)) AS touches,
        round(100.0 * sum(CAST({touch_expr} AS INT)) / nullif(count(*), 0), 2) AS touch_pct,
        round(median({range_col}), 2) AS median_val,
        round(quantile_cont({range_col}, 0.95), 2) AS p95_val,
        round(max({range_col}), 2) AS worst_val
    FROM '{ex_path}' e
    {regime_join}
    WHERE e.hold_min = {hold_min}
      AND year(e.entry_ts_utc) >= {from_year}
      AND year(e.entry_ts_utc) <= {to_year}
      {regime_where}
    GROUP BY {group_expr}
    ORDER BY dow, hr, mi;
    """

    df = con.execute(sql).df()

    cells = []
    total_n = 0
    total_touches = 0
    best_slot = ""
    worst_slot = ""
    min_touch = 999.0
    max_touch = -1.0

    for _, row in df.iterrows():
        dow = int(row['dow'])
        hr = int(row['hr'])
        mi = int(row['mi'])
        n = int(row['n'])
        touches = int(row['touches'])
        touch_pct = float(row['touch_pct']) if row['touch_pct'] is not None else 0.0

        ci_l, ci_u = wilson_score_interval(touches, n)
        
        if metric == "touch_prob":
            m_val = touch_pct
        elif metric == "median_range":
            m_val = float(row['median_val']) if row['median_val'] is not None else 0.0
        elif metric == "p95_range":
            m_val = float(row['p95_val']) if row['p95_val'] is not None else 0.0
        else:
            m_val = float(row['worst_val']) if row['worst_val'] is not None else 0.0

        slot_label = f"{DAY_NAMES[dow][:3]} {hr:02d}:{mi:02d}"
        low_sample = n < 100

        if touch_pct < min_touch and n >= 50:
            min_touch = touch_pct
            best_slot = slot_label
        if touch_pct > max_touch and n >= 50:
            max_touch = touch_pct
            worst_slot = slot_label

        total_n += n
        total_touches += touches

        cells.append(HeatmapCell(
            day_of_week=dow,
            day_name=DAY_NAMES[dow],
            hour=hr,
            minute=mi,
            slot_label=slot_label,
            metric_value=round(m_val, 2),
            touch_pct=touch_pct,
            sample_size_n=n,
            ci_lower=ci_l,
            ci_upper=ci_u,
            low_sample_warning=low_sample
        ))

    overall_touch_pct = round(100.0 * total_touches / max(1, total_n), 2)

    return {
        "data_as_of": "2026-10-31 UTC",
        "hold_min": hold_min,
        "side": side,
        "strike_distance_pct": strike_distance_pct,
        "metric": metric,
        "cells": [c.model_dump() for c in cells],
        "overall_n": total_n,
        "overall_touch_pct": overall_touch_pct,
        "safest_slot": best_slot or "N/A",
        "riskiest_slot": worst_slot or "N/A",
        "selection_bias_note": (
            "Caution on selection bias: scanning 168 hourly (or 672 15-min) slots creates a multiple testing effect. "
            "The best ranking window will naturally look better than its true expected future probability. "
            "Always verify against out-of-sample data."
        )
    }

