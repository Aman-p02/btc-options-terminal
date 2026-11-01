"""
Stop-Loss Planner Router.
Computes empirical percentile adverse excursions (90th, 95th, 99th, worst) and
evaluates exact SL hit rates with Wilson 95% confidence intervals and yearly breakdowns.
"""

from fastapi import APIRouter, Depends
from api.models import SLPlannerRequest, SLPlannerResponse
from api.security import verify_internal_secret
from api.db import get_db, get_excursions_path
from api.stats import wilson_score_interval
from api.cache import cached_query

router = APIRouter(prefix="/sl-planner", tags=["SL Planner"])

DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


@router.post("", response_model=SLPlannerResponse)
def plan_stop_loss(
    req: SLPlannerRequest,
    _auth: bool = Depends(verify_internal_secret)
):
    return compute_sl_plan(
        req.day_of_week,
        req.hour,
        req.minute,
        req.hold_min,
        req.spot,
        req.user_sl_pct,
        req.side,
        req.tz_offset_min
    )


@cached_query(ttl_seconds=300)
def compute_sl_plan(
    day_of_week: int,
    hour: int,
    minute: int,
    hold_min: int,
    spot: float,
    user_sl_pct: float,
    side: str,
    tz_offset_min: int = 330
) -> dict:
    con = get_db()
    ex_path = get_excursions_path()

    tz_expr = f"entry_ts_utc + INTERVAL {tz_offset_min} MINUTE"

    if side == "call":
        move_col = "max_up_pct"
    elif side == "put":
        move_col = "max_dn_pct"
    else:  # both
        move_col = "greatest(max_up_pct, max_dn_pct)"

    sql = f"""
    SELECT
        year(entry_ts_utc) AS yr,
        round({move_col}, 4) AS adverse_move,
        CAST({move_col} >= {user_sl_pct} AS INT) AS sl_hit
    FROM '{ex_path}'
    WHERE hold_min = {hold_min}
      AND dayofweek({tz_expr}) = {day_of_week}
      AND hour({tz_expr}) = {hour}
      AND minute({tz_expr}) = {minute}
    ORDER BY entry_ts_utc;
    """

    df = con.execute(sql).df()

    total_n = len(df)
    if total_n == 0:
        return {
            "day_name": DAY_NAMES[day_of_week],
            "time_str": f"{hour:02d}:{minute:02d}",
            "hold_min": hold_min,
            "spot": spot,
            "user_sl_pct": user_sl_pct,
            "user_sl_pts": round(spot * user_sl_pct / 100.0, 1),
            "user_sl_hit_rate_pct": 0.0,
            "sample_size_n": 0,
            "ci_lower": 0.0,
            "ci_upper": 0.0,
            "avg_adverse_move_pct": 0.0,
            "p90_adverse_move_pct": 0.0,
            "p95_adverse_move_pct": 0.0,
            "p99_adverse_move_pct": 0.0,
            "worst_adverse_move_pct": 0.0,
            "avg_adverse_pts": 0.0,
            "p90_adverse_pts": 0.0,
            "p95_adverse_pts": 0.0,
            "p99_adverse_pts": 0.0,
            "worst_adverse_pts": 0.0,
            "sl_hit_by_year": [],
            "data_as_of": "2026-10-31 UTC"
        }

    total_hits = int(df['sl_hit'].sum())
    hit_rate = round(100.0 * total_hits / total_n, 2)
    ci_l, ci_u = wilson_score_interval(total_hits, total_n)

    avg_move = float(df['adverse_move'].mean())
    p90 = float(df['adverse_move'].quantile(0.90))
    p95 = float(df['adverse_move'].quantile(0.95))
    p99 = float(df['adverse_move'].quantile(0.99))
    worst = float(df['adverse_move'].max())

    # Yearly breakdown
    yearly = []
    for yr, group in df.groupby('yr'):
        n_yr = len(group)
        hits_yr = int(group['sl_hit'].sum())
        yearly.append({
            "year": int(yr),
            "trades": n_yr,
            "sl_hits": hits_yr,
            "hit_rate_pct": round(100.0 * hits_yr / n_yr, 2),
            "worst_move_pct": round(float(group['adverse_move'].max()), 2)
        })

    return {
        "day_name": DAY_NAMES[day_of_week],
        "time_str": f"{hour:02d}:{minute:02d}",
        "hold_min": hold_min,
        "spot": spot,
        "user_sl_pct": user_sl_pct,
        "user_sl_pts": round(spot * user_sl_pct / 100.0, 1),
        "user_sl_hit_rate_pct": hit_rate,
        "sample_size_n": total_n,
        "ci_lower": ci_l,
        "ci_upper": ci_u,
        "avg_adverse_move_pct": round(avg_move, 2),
        "p90_adverse_move_pct": round(p90, 2),
        "p95_adverse_move_pct": round(p95, 2),
        "p99_adverse_move_pct": round(p99, 2),
        "worst_adverse_move_pct": round(worst, 2),
        "avg_adverse_pts": round(spot * avg_move / 100.0, 1),
        "p90_adverse_pts": round(spot * p90 / 100.0, 1),
        "p95_adverse_pts": round(spot * p95 / 100.0, 1),
        "p99_adverse_pts": round(spot * p99 / 100.0, 1),
        "worst_adverse_pts": round(spot * worst / 100.0, 1),
        "sl_hit_by_year": yearly,
        "data_as_of": "2026-10-31 UTC"
    }

