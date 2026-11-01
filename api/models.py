"""
Pydantic Request and Response Schemas for Analytics API.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- HEATMAP ---
class HeatmapRequest(BaseModel):
    hold_min: int = Field(360, description="Hold duration in minutes: 60, 120, 180, 240, 360, 480, 720, 1440")
    side: str = Field("call", description="'call', 'put', or 'both'")
    strike_distance_pct: float = Field(2.5, description="Strike distance from entry in %")
    from_year: int = Field(2024, description="Start year filter (2017-2026)")
    to_year: int = Field(2026, description="End year filter")
    metric: str = Field("touch_prob", description="'touch_prob', 'median_range', 'p95_range', 'worst_case'")
    grid_resolution: str = Field("hour", description="'hour' (24 slots) or '15min' (96 slots)")
    tz_offset_min: int = Field(330, description="Timezone offset in minutes (330 for IST +5:30)")
    max_7d_vol: Optional[float] = Field(None, description="Regime filter: max 7-day realized vol")


class HeatmapCell(BaseModel):
    day_of_week: int
    day_name: str
    hour: int
    minute: int
    slot_label: str
    metric_value: float
    touch_pct: float
    sample_size_n: int
    ci_lower: float
    ci_upper: float
    low_sample_warning: bool


class HeatmapResponse(BaseModel):
    data_as_of: str
    hold_min: int
    side: str
    strike_distance_pct: float
    metric: str
    cells: List[HeatmapCell]
    overall_n: int
    overall_touch_pct: float
    safest_slot: str
    riskiest_slot: str
    selection_bias_note: str


# --- STRIKE FINDER ---
class StrikeFinderRequest(BaseModel):
    spot: float = Field(..., description="Current spot price in USD")
    hold_min: int = Field(360, description="Hold duration in minutes")
    side: str = Field("call", description="'call', 'put', or 'both'")
    max_touch_prob: float = Field(5.0, description="Max acceptable historical touch %")
    min_premium: float = Field(25.0, description="Minimum theoretical premium in USD")
    iv: float = Field(0.45, description="Broker Implied Volatility (e.g. 0.45 for 45%)")
    from_year: int = Field(2024, description="Analysis start year")
    to_year: int = Field(2026, description="Analysis end year")
    tz_offset_min: int = Field(330, description="Timezone offset in minutes")
    max_7d_vol: Optional[float] = Field(None, description="Regime filter threshold")


class StrikeFinderRow(BaseModel):
    rank: int
    day_name: str
    day_of_week: int
    entry_time_str: str
    hour: int
    minute: int
    strike: float
    strike_call: Optional[float]
    strike_put: Optional[float]
    distance_pct: float
    distance_pts: float
    theoretical_premium: float
    touch_pct_recent: float
    touch_pct_full: float
    sample_size_n: int
    ci_lower: float
    ci_upper: float
    low_sample_warning: bool


class StrikeFinderResponse(BaseModel):
    data_as_of: str
    spot: float
    hold_min: int
    iv: float
    results: List[StrikeFinderRow]
    disclaimer: str
    selection_bias_note: str


# --- DISTANCE CALCULATOR ---
class DistanceCalcRequest(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(0, description="0, 15, 30, 45")
    hold_min: int = Field(360)
    side: str = Field("call")
    strike_distance_pct: float = Field(2.5)
    spot: Optional[float] = Field(None)
    tz_offset_min: int = Field(330)


class YearBreakdown(BaseModel):
    year: int
    total_samples: int
    touches: int
    touch_pct: float
    median_move: float
    p95_move: float
    max_move: float


class WorstExcursionDate(BaseModel):
    date_str: str
    entry_price: float
    move_pct: float
    move_pts: float
    net_pct: float


class DistanceCalcResponse(BaseModel):
    day_name: str
    time_str: str
    hold_min: int
    strike_distance_pct: float
    strike_distance_pts: Optional[float]
    overall_touch_pct: float
    sample_size_n: int
    ci_lower: float
    ci_upper: float
    low_sample_warning: bool
    by_year: List[YearBreakdown]
    worst_10_dates: List[WorstExcursionDate]
    distribution_bins: List[Dict[str, Any]]
    data_as_of: str


# --- SL PLANNER ---
class SLPlannerRequest(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(0)
    hold_min: int = Field(360)
    spot: float = Field(..., gt=0)
    user_sl_pct: float = Field(1.5, gt=0)
    side: str = Field("both", description="'call', 'put', 'both'")
    tz_offset_min: int = Field(330)


class SLPlannerResponse(BaseModel):
    day_name: str
    time_str: str
    hold_min: int
    spot: float
    user_sl_pct: float
    user_sl_pts: float
    user_sl_hit_rate_pct: float
    sample_size_n: int
    ci_lower: float
    ci_upper: float
    avg_adverse_move_pct: float
    p90_adverse_move_pct: float
    p95_adverse_move_pct: float
    p99_adverse_move_pct: float
    worst_adverse_move_pct: float
    avg_adverse_pts: float
    p90_adverse_pts: float
    p95_adverse_pts: float
    p99_adverse_pts: float
    worst_adverse_pts: float
    sl_hit_by_year: List[Dict[str, Any]]
    data_as_of: str


# --- BACKTESTER ---
class BacktestRequest(BaseModel):
    strategy: str = Field("strangle", description="'sell_call', 'sell_put', 'strangle'")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    hour: Optional[int] = Field(None, ge=0, le=23)
    minute: int = Field(0)
    hold_min: int = Field(360)
    call_dist_pct: float = Field(2.5)
    put_dist_pct: float = Field(2.5)
    sl_mode: str = Field("spot_pct", description="'spot_pct' or 'premium_multiple'")
    sl_threshold: float = Field(1.5, description="Stop-loss % on spot or multiple of premium (e.g. 2.0x)")
    iv: float = Field(0.45, description="IV assumption for Black-Scholes premium")
    regime_filter: bool = Field(False)
    max_7d_vol: Optional[float] = Field(None)
    train_years: List[int] = Field([2017, 2023])
    test_years: List[int] = Field([2024, 2026])
    tz_offset_min: int = Field(330)


class BacktestTrade(BaseModel):
    date_str: str
    entry_ts_utc: str
    entry_price: float
    call_strike: Optional[float]
    put_strike: Optional[float]
    theoretical_entry_premium: float
    exit_pnl_usd: float
    exit_pnl_pct: float
    outcome: str  # 'FULL_WIN', 'CALL_SL', 'PUT_SL', 'EXPIRED_ITM'
    max_up_pct: float
    max_dn_pct: float
    net_pct: float
    is_in_sample: bool


class BacktestSummaryMetrics(BaseModel):
    trade_count: int
    win_count: int
    sl_count: int
    win_rate_pct: float
    sl_hit_rate_pct: float
    avg_win_usd: float
    avg_loss_usd: float
    expectancy_usd: float
    profit_factor: float
    max_drawdown_pct: float
    total_pnl_usd: float


class BacktestResponse(BaseModel):
    strategy: str
    hold_min: int
    in_sample: BacktestSummaryMetrics
    out_of_sample: BacktestSummaryMetrics
    full_period: BacktestSummaryMetrics
    equity_curve: List[Dict[str, Any]]
    yearly_breakdown: List[Dict[str, Any]]
    trades: List[BacktestTrade]
    disclaimer: str
    selection_bias_warning: str

