"""
Strike Finder Router.
Scans day and entry time combinations, finds safe strikes meeting max touch probability,
computes theoretical Black-Scholes premium, and provides full-history vs recent-history comparison
with Wilson 95% confidence intervals and selection bias warnings.
"""

from fastapi import APIRouter, Depends
import numpy as np
from api.models import StrikeFinderRequest, StrikeFinderResponse, StrikeFinderRow
from api.security import verify_internal_secret
from api.db import get_db, get_excursions_path, get_daily_path
from api.stats import wilson_score_interval, black_scholes
from api.cache import cached_query

router = APIRouter(prefix="/strike-finder", tags=["Strike Finder"])

DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


@router.post("", response_model=StrikeFinderResponse)
def find_safe_strikes(
    req: StrikeFinderRequest,
    _auth: bool = Depends(verify_internal_secret)
):
    return compute_strike_finder(
        req.spot,
        req.hold_min,
        req.side,
        req.max_touch_prob,
        req.min_premium,
        req.iv,
        req.from_year,
        req.to_year,
        req.tz_offset_min,
        req.max_7d_vol
    )


@cached_query(ttl_seconds=300)
def compute_strike_finder(
    spot: float,
    hold_min: int,
    side: str,
    max_touch_prob: float,
    min_premium: float,
    iv: float,
    from_year: int,
    to_year: int,
    tz_offset_min: int,
    max_7d_vol: float = None
) -> dict:
    con = get_db()
    ex_path = get_excursions_path()
    daily_path = get_daily_path()

    tz_expr = f"entry_ts_utc + INTERVAL {tz_offset_min} MINUTE"
    hours = hold_min / 60.0

    # Regime filter if present
    regime_join = ""
    regime_where = ""
    if max_7d_vol is not None and max_7d_vol > 0:
        regime_join = f"JOIN '{daily_path}' d ON CAST(e.entry_ts_utc AS DATE) = d.date"
        regime_where = f"AND d.vol_7d <= {max_7d_vol}"

    # We evaluate strikes in step increments: 0.5% to 8.0% by 0.25%
    # First, fetch excursions aggregated by day, hour, and year for efficiency
    sql = f"""
    SELECT
        dayofweek({tz_expr}) AS dow,
        hour({tz_expr}) AS hr,
        year(e.entry_ts_utc) AS yr,
        round(max_up_pct, 2) AS up,
        round(max_dn_pct, 2) AS dn
    FROM '{ex_path}' e
    {regime_join}
    WHERE e.hold_min = {hold_min}
      {regime_where}
    """
    df = con.execute(sql).df()

    test_strikes = np.arange(0.5, 9.01, 0.25)
    candidates = []

    for (dow, hr), group in df.groupby(['dow', 'hr']):
        recent = group[(group['yr'] >= from_year) & (group['yr'] <= to_year)]
        n_recent = len(recent)
        n_full = len(group)
        if n_recent < 30:
            continue

        # Find the smallest strike distance that satisfies max_touch_prob in the recent period
        best_strike_dist = None
        best_recent_touch = 0.0
        best_full_touch = 0.0
        best_touches_recent = 0

        for dist in test_strikes:
            if side == "call":
                t_recent = int((recent['up'] >= dist).sum())
                t_full = int((group['up'] >= dist).sum())
            elif side == "put":
                t_recent = int((recent['dn'] >= dist).sum())
                t_full = int((group['dn'] >= dist).sum())
            else:  # both
                t_recent = int(((recent['up'] >= dist) | (recent['dn'] >= dist)).sum())
                t_full = int(((group['up'] >= dist) | (group['dn'] >= dist)).sum())

            pct_recent = round(100.0 * t_recent / n_recent, 2)
            pct_full = round(100.0 * t_full / n_full, 2)

            if pct_recent <= max_touch_prob:
                best_strike_dist = dist
                best_recent_touch = pct_recent
                best_full_touch = pct_full
                best_touches_recent = t_recent
                break

        if best_strike_dist is None:
            continue

        # Calculate theoretical strikes and Black-Scholes premium
        strike_call = round(spot * (1.0 + best_strike_dist / 100.0), 1) if side in ["call", "both"] else None
        strike_put = round(spot * (1.0 - best_strike_dist / 100.0), 1) if side in ["put", "both"] else None

        prem_call = black_scholes(spot, strike_call, hours, iv, is_call=True) if strike_call else 0.0
        prem_put = black_scholes(spot, strike_put, hours, iv, is_call=False) if strike_put else 0.0

        if side == "call":
            prem_total = prem_call
            main_strike = strike_call
        elif side == "put":
            prem_total = prem_put
            main_strike = strike_put
        else:
            prem_total = prem_call + prem_put
            main_strike = strike_call  # show call strike by default in singular column

        if prem_total < min_premium:
            continue

        ci_l, ci_u = wilson_score_interval(best_touches_recent, n_recent)
        distance_pts = round(spot * (best_strike_dist / 100.0), 1)

        candidates.append({
            "day_name": DAY_NAMES[dow],
            "day_of_week": int(dow),
            "entry_time_str": f"{hr:02d}:00",
            "hour": int(hr),
            "minute": 0,
            "strike": round(main_strike, 1),
            "strike_call": strike_call,
            "strike_put": strike_put,
            "distance_pct": float(best_strike_dist),
            "distance_pts": float(distance_pts),
            "theoretical_premium": round(prem_total, 2),
            "touch_pct_recent": float(best_recent_touch),
            "touch_pct_full": float(best_full_touch),
            "sample_size_n": int(n_recent),
            "ci_lower": ci_l,
            "ci_upper": ci_u,
            "low_sample_warning": n_recent < 100
        })

    # Rank by theoretical premium (descending) while keeping touch <= max_touch_prob
    candidates.sort(key=lambda x: (-x['theoretical_premium'], x['touch_pct_recent']))

    results = []
    for rank, item in enumerate(candidates[:50], 1):
        item["rank"] = rank
        results.append(StrikeFinderRow(**item))

    return {
        "data_as_of": "2026-10-31 UTC",
        "spot": spot,
        "hold_min": hold_min,
        "iv": iv,
        "results": [r.model_dump() for r in results],
        "disclaimer": (
            "THEORETICAL ESTIMATE ONLY. Premiums are computed via Black-Scholes (r=0) and do not represent guaranteed broker fills or bid-ask spreads. "
            "Past Binance 1-second price excursion history does not guarantee future market behavior."
        ),
        "selection_bias_note": (
            "Selection Bias Warning: When scanning across 168 weekly hours, top-ranked slots will show anomalously favorable recent metrics. "
            "Compare the recent touch % against the full-period touch % to detect regime over-fitting."
        )
    }

