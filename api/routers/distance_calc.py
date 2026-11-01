"""
Distance Calculator Router.
Analyzes a chosen day/time/hold/strike setup against full 9-year historical excursions:
- Wilson 95% confidence interval
- Year-by-year breakdown
- Worst 10 dates with excursion magnitudes
- Histogram distribution of max moves
"""

from fastapi import APIRouter, Depends
import numpy as np
from api.models import DistanceCalcRequest, DistanceCalcResponse, YearBreakdown, WorstExcursionDate
from api.security import verify_internal_secret
from api.db import get_db, get_excursions_path
from api.stats import wilson_score_interval
from api.cache import cached_query

router = APIRouter(prefix="/distance-calculator", tags=["Distance Calculator"])

DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


@router.post("", response_model=DistanceCalcResponse)
def calculate_distance_profile(
    req: DistanceCalcRequest,
    _auth: bool = Depends(verify_internal_secret)
):
    return compute_distance_profile(
        req.day_of_week,
        req.hour,
        req.minute,
        req.hold_min,
        req.side,
        req.strike_distance_pct,
        req.spot,
        req.tz_offset_min
    )


@cached_query(ttl_seconds=300)
def compute_distance_profile(
    day_of_week: int,
    hour: int,
    minute: int,
    hold_min: int,
    side: str,
    strike_distance_pct: float,
    spot: float = None,
    tz_offset_min: int = 330
) -> dict:
    con = get_db()
    ex_path = get_excursions_path()

    tz_expr = f"entry_ts_utc + INTERVAL {tz_offset_min} MINUTE"

    if side == "call":
        touch_expr = f"(max_up_pct >= {strike_distance_pct})"
        move_expr = "max_up_pct"
    elif side == "put":
        touch_expr = f"(max_dn_pct >= {strike_distance_pct})"
        move_expr = "max_dn_pct"
    else:  # both
        touch_expr = f"(max_up_pct >= {strike_distance_pct} OR max_dn_pct >= {strike_distance_pct})"
        move_expr = "greatest(max_up_pct, max_dn_pct)"

    sql = f"""
    SELECT
        entry_ts_utc,
        entry_price,
        year(entry_ts_utc) AS yr,
        round(max_up_pct, 4) AS up,
        round(max_dn_pct, 4) AS dn,
        round({move_expr}, 4) AS adverse_move,
        round(net_pct, 4) AS net_pct,
        CAST({touch_expr} AS INT) AS is_touch
    FROM '{ex_path}'
    WHERE hold_min = {hold_min}
      AND dayofweek({tz_expr}) = {day_of_week}
      AND hour({tz_expr}) = {hour}
      AND minute({tz_expr}) = {minute}
    ORDER BY entry_ts_utc;
    """

    df = con.execute(sql).df()

    total_samples = len(df)
    if total_samples == 0:
        return {
            "day_name": DAY_NAMES[day_of_week],
            "time_str": f"{hour:02d}:{minute:02d}",
            "hold_min": hold_min,
            "strike_distance_pct": strike_distance_pct,
            "strike_distance_pts": round(spot * strike_distance_pct / 100.0, 1) if spot else None,
            "overall_touch_pct": 0.0,
            "sample_size_n": 0,
            "ci_lower": 0.0,
            "ci_upper": 0.0,
            "low_sample_warning": True,
            "by_year": [],
            "worst_10_dates": [],
            "distribution_bins": [],
            "data_as_of": "2026-10-31 UTC"
        }

    total_touches = int(df['is_touch'].sum())
    overall_touch_pct = round(100.0 * total_touches / total_samples, 2)
    ci_l, ci_u = wilson_score_interval(total_touches, total_samples)

    # By-year breakdown
    by_year = []
    for yr, group in df.groupby('yr'):
        n_yr = len(group)
        t_yr = int(group['is_touch'].sum())
        pct_yr = round(100.0 * t_yr / n_yr, 2)
        by_year.append(YearBreakdown(
            year=int(yr),
            total_samples=n_yr,
            touches=t_yr,
            touch_pct=pct_yr,
            median_move=round(float(group['adverse_move'].median()), 2),
            p95_move=round(float(group['adverse_move'].quantile(0.95)), 2),
            max_move=round(float(group['adverse_move'].max()), 2)
        ).model_dump())

    # Worst 10 dates (sorted by adverse move descending)
    worst_df = df.sort_values('adverse_move', ascending=False).head(10)
    worst_10 = []
    for _, r in worst_df.iterrows():
        move_pct = float(r['adverse_move'])
        ref_spot = spot if spot else float(r['entry_price'])
        move_pts = round(ref_spot * (move_pct / 100.0), 1)
        worst_10.append(WorstExcursionDate(
            date_str=str(r['entry_ts_utc'])[:16],
            entry_price=round(float(r['entry_price']), 2),
            move_pct=move_pct,
            move_pts=move_pts,
            net_pct=float(r['net_pct'])
        ).model_dump())

    # Distribution histogram bins (e.g. 0-0.5%, 0.5-1%, 1-1.5%, ..., 5%+)
    bins = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 10.0, 50.0]
    hist, bin_edges = np.histogram(df['adverse_move'], bins=bins)
    dist_bins = []
    for i in range(len(hist)):
        dist_bins.append({
            "range_label": f"{bin_edges[i]:.1f}% - {bin_edges[i+1]:.1f}%",
            "count": int(hist[i]),
            "pct_of_total": round(100.0 * hist[i] / total_samples, 2)
        })

    pts = round(spot * strike_distance_pct / 100.0, 1) if spot else None

    return {
        "day_name": DAY_NAMES[day_of_week],
        "time_str": f"{hour:02d}:{minute:02d}",
        "hold_min": hold_min,
        "strike_distance_pct": strike_distance_pct,
        "strike_distance_pts": pts,
        "overall_touch_pct": overall_touch_pct,
        "sample_size_n": total_samples,
        "ci_lower": ci_l,
        "ci_upper": ci_u,
        "low_sample_warning": total_samples < 100,
        "by_year": by_year,
        "worst_10_dates": worst_10,
        "distribution_bins": dist_bins,
        "data_as_of": "2026-10-31 UTC"
    }

