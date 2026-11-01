export type SideType = 'call' | 'put' | 'both';
export type HoldMin = 60 | 120 | 180 | 240 | 360 | 480 | 720 | 1440;
export type HeatmapMetric = 'touch_prob' | 'median_range' | 'p95_range' | 'worst_case';
export type Resolution = 'hour' | '15min';

export interface HeatmapCell {
  day_of_week: number;
  day_name: string;
  hour: number;
  minute: number;
  slot_label: string;
  metric_value: number;
  touch_pct: number;
  sample_size_n: number;
  ci_lower: number;
  ci_upper: number;
  low_sample_warning: boolean;
}

export interface HeatmapResponse {
  data_as_of: string;
  hold_min: number;
  side: SideType;
  strike_distance_pct: number;
  metric: HeatmapMetric;
  cells: HeatmapCell[];
  overall_n: number;
  overall_touch_pct: number;
  safest_slot: string;
  riskiest_slot: string;
  selection_bias_note: string;
}

export interface StrikeFinderRow {
  rank: number;
  day_name: string;
  day_of_week: number;
  entry_time_str: string;
  hour: number;
  minute: number;
  strike: number;
  strike_call?: number;
  strike_put?: number;
  distance_pct: number;
  distance_pts: number;
  theoretical_premium: number;
  touch_pct_recent: number;
  touch_pct_full: number;
  sample_size_n: number;
  ci_lower: number;
  ci_upper: number;
  low_sample_warning: boolean;
}

export interface StrikeFinderResponse {
  data_as_of: string;
  spot: number;
  hold_min: number;
  iv: number;
  results: StrikeFinderRow[];
  disclaimer: string;
  selection_bias_note: string;
}

export interface YearBreakdown {
  year: number;
  total_samples: number;
  touches: number;
  touch_pct: number;
  median_move: number;
  p95_move: number;
  max_move: number;
}

export interface WorstExcursionDate {
  date_str: string;
  entry_price: number;
  move_pct: number;
  move_pts: number;
  net_pct: number;
}

export interface DistanceCalcResponse {
  day_name: string;
  time_str: string;
  hold_min: number;
  strike_distance_pct: number;
  strike_distance_pts?: number;
  overall_touch_pct: number;
  sample_size_n: number;
  ci_lower: number;
  ci_upper: number;
  low_sample_warning: boolean;
  by_year: YearBreakdown[];
  worst_10_dates: WorstExcursionDate[];
  distribution_bins: { range_label: string; count: number; pct_of_total: number }[];
  data_as_of: string;
}

export interface SLPlannerResponse {
  day_name: string;
  time_str: string;
  hold_min: number;
  spot: number;
  user_sl_pct: number;
  user_sl_pts: number;
  user_sl_hit_rate_pct: number;
  sample_size_n: number;
  ci_lower: number;
  ci_upper: number;
  avg_adverse_move_pct: number;
  p90_adverse_move_pct: number;
  p95_adverse_move_pct: number;
  p99_adverse_move_pct: number;
  worst_adverse_move_pct: number;
  avg_adverse_pts: number;
  p90_adverse_pts: number;
  p95_adverse_pts: number;
  p99_adverse_pts: number;
  worst_adverse_pts: number;
  sl_hit_by_year: { year: number; trades: number; sl_hits: number; hit_rate_pct: number; worst_move_pct: number }[];
  data_as_of: string;
}

export interface BacktestTrade {
  date_str: string;
  entry_ts_utc: string;
  entry_price: number;
  call_strike?: number;
  put_strike?: number;
  theoretical_entry_premium: number;
  exit_pnl_usd: number;
  exit_pnl_pct: number;
  outcome: string;
  max_up_pct: number;
  max_dn_pct: number;
  net_pct: number;
  is_in_sample: boolean;
}

export interface BacktestSummaryMetrics {
  trade_count: number;
  win_count: number;
  sl_count: number;
  win_rate_pct: number;
  sl_hit_rate_pct: number;
  avg_win_usd: number;
  avg_loss_usd: number;
  expectancy_usd: number;
  profit_factor: number;
  max_drawdown_pct: number;
  total_pnl_usd: number;
}

export interface BacktestResponse {
  strategy: string;
  hold_min: number;
  in_sample: BacktestSummaryMetrics;
  out_of_sample: BacktestSummaryMetrics;
  full_period: BacktestSummaryMetrics;
  equity_curve: { date: string; equity: number; drawdown_pct: number; is_in_sample: boolean }[];
  yearly_breakdown: { year: number; trades: number; win_rate_pct: number; sl_rate_pct: number; pnl_usd: number; expectancy: number; profit_factor: number }[];
  trades: BacktestTrade[];
  disclaimer: string;
  selection_bias_warning: string;
}

export interface LiveTickerData {
  btc_price: number;
  source: string;
  timestamp_utc: string;
  current_hour_utc: number;
  deribit_iv: { deribit_dvol: number; timestamp?: number; source?: string };
  current_hour_rank: {
    median_range_pct: number;
    avg_realized_vol: number;
    calmness_percentile: number;
    verdict: string;
  };
}

export interface RegimeData {
  min_7d_vol: number;
  p25_7d_vol: number;
  median_7d_vol: number;
  p75_7d_vol: number;
  p90_7d_vol: number;
  max_7d_vol: number;
  avg_7d_vol: number;
  total_days_analyzed: number;
  latest_date: string;
  latest_7d_vol: number;
  recommendation: string;
}

