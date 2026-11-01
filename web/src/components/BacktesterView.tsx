'use client';

import React, { useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';
import { BacktestResponse, HoldMin } from '@/lib/types';
import { Play, Download, TrendingUp, ShieldAlert, Sliders, CheckCircle } from 'lucide-react';

interface BacktesterProps {
  locale: Locale;
  tzOffset: number;
  spotPrice: number;
}

const DAYS = [
  { label: 'Every Day (Daily Rule)', value: -1 },
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const HOLDS: { label: string; value: HoldMin }[] = [
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
  { label: '6h', value: 360 },
  { label: '12h', value: 720 },
  { label: '24h', value: 1440 },
];

export const BacktesterView: React.FC<BacktesterProps> = ({
  locale,
  tzOffset,
  spotPrice,
}) => {
  const t = translations[locale];

  // Parameters
  const [strategy, setStrategy] = useState<'sell_call' | 'sell_put' | 'strangle'>('strangle');
  const [dow, setDow] = useState<number>(0); // Sunday default
  const [hour, setHour] = useState<number>(10); // 10 AM default
  const [holdMin, setHoldMin] = useState<HoldMin>(360);
  const [callDistPct, setCallDistPct] = useState<number>(2.5);
  const [putDistPct, setPutDistPct] = useState<number>(2.5);
  const [slMode, setSlMode] = useState<'spot_pct' | 'premium_multiple'>('spot_pct');
  const [slThreshold, setSlThreshold] = useState<number>(1.5);
  const [iv, setIv] = useState<number>(0.45);
  const [regimeFilter, setRegimeFilter] = useState<boolean>(false);
  const [max7dVol, setMax7dVol] = useState<number>(60.0);
  const [trainYears, setTrainYears] = useState<[number, number]>([2017, 2023]);
  const [testYears, setTestYears] = useState<[number, number]>([2024, 2026]);

  const [data, setData] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy,
          day_of_week: dow === -1 ? null : dow,
          hour,
          minute: 0,
          hold_min: holdMin,
          call_dist_pct: callDistPct,
          put_dist_pct: putDistPct,
          sl_mode: slMode,
          sl_threshold: slThreshold,
          iv,
          regime_filter: regimeFilter,
          max_7d_vol: regimeFilter ? max7dVol : null,
          train_years: trainYears,
          test_years: testYears,
          tz_offset_min: tzOffset,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json();
        throw new Error(errJson.error || 'Failed to execute backtest');
      }

      const res: BacktestResponse = await resp.json();
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, [dow, hour, holdMin, strategy, callDistPct, putDistPct, slMode, slThreshold, iv, regimeFilter, max7dVol, tzOffset]);

  // Download CSV of trades
  const downloadCSV = () => {
    if (!data || !data.trades) return;
    const headers = [
      'Date', 'Entry UTC', 'Spot Entry Price', 'Call Strike', 'Put Strike',
      'Theoretical Entry Premium USD', 'Exit PnL USD', 'Exit Return %',
      'Outcome', 'Max Adverse Up %', 'Max Adverse Down %', 'Net Move %', 'In Sample'
    ];
    const rows = data.trades.map((t) => [
      t.date_str,
      t.entry_ts_utc,
      t.entry_price,
      t.call_strike || 'N/A',
      t.put_strike || 'N/A',
      t.theoretical_entry_premium,
      t.exit_pnl_usd,
      t.exit_pnl_pct,
      t.outcome,
      t.max_up_pct,
      t.max_dn_pct,
      t.net_pct,
      t.is_in_sample ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `btc_options_backtest_${strategy}_hold${holdMin}m.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Configuration Bar */}
      <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Strategy */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Strategy:</span>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] px-2 py-1 rounded focus:outline-none uppercase"
            >
              <option value="strangle">Short Strangle (Call + Put)</option>
              <option value="sell_call">Short Call Only</option>
              <option value="sell_put">Short Put Only</option>
            </select>
          </div>

          {/* Day & Time Rule */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Day Rule:</span>
            <select
              value={dow}
              onChange={(e) => setDow(Number(e.target.value))}
              className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] px-2 py-1 rounded focus:outline-none"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Entry Time:</span>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] px-2 py-1 rounded focus:outline-none"
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>

          {/* Hold */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Hold:</span>
            <select
              value={holdMin}
              onChange={(e) => setHoldMin(Number(e.target.value) as HoldMin)}
              className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] px-2 py-1 rounded focus:outline-none"
            >
              {HOLDS.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </div>

          {/* Strikes */}
          {strategy !== 'sell_put' && (
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-muted)]">Call Dist:</span>
              <input
                type="number"
                step="0.25"
                value={callDistPct}
                onChange={(e) => setCallDistPct(Number(e.target.value))}
                className="w-14 bg-[var(--bg-subtle)] hairline-border px-1.5 py-1 rounded text-right focus:outline-none"
              />
              <span>%</span>
            </div>
          )}

          {strategy !== 'sell_call' && (
            <div className="flex items-center gap-1">
              <span className="text-[var(--text-muted)]">Put Dist:</span>
              <input
                type="number"
                step="0.25"
                value={putDistPct}
                onChange={(e) => setPutDistPct(Number(e.target.value))}
                className="w-14 bg-[var(--bg-subtle)] hairline-border px-1.5 py-1 rounded text-right focus:outline-none"
              />
              <span>%</span>
            </div>
          )}

          {/* SL Mode & Threshold */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">SL Mode:</span>
            <select
              value={slMode}
              onChange={(e) => setSlMode(e.target.value as any)}
              className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] px-2 py-1 rounded focus:outline-none"
            >
              <option value="spot_pct">Spot Move %</option>
              <option value="premium_multiple">Premium Multiple (e.g. 2x)</option>
            </select>
            <input
              type="number"
              step="0.1"
              value={slThreshold}
              onChange={(e) => setSlThreshold(Number(e.target.value))}
              className="w-14 bg-[var(--bg-subtle)] hairline-border px-1.5 py-1 rounded text-right focus:outline-none text-amber font-bold"
            />
            <span>{slMode === 'spot_pct' ? '%' : 'x'}</span>
          </div>

          {/* Regime Filter */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none text-[var(--text-muted)] ml-auto">
            <input
              type="checkbox"
              checked={regimeFilter}
              onChange={(e) => setRegimeFilter(e.target.checked)}
              className="accent-amber"
            />
            <span>Regime Filter (7D Vol &le; 60%)</span>
          </label>
        </div>
      </div>

      {/* Out-Of-Sample Comparison Cards (In-Sample vs Out-of-Sample) */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* In-Sample Card */}
          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                IN-SAMPLE ({trainYears[0]}-{trainYears[1]})
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">Historical Fit Period</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Win Rate</span>
                <span className="text-lg font-bold text-emerald-400 num">{data.in_sample.win_rate_pct}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Expectancy</span>
                <span className="text-lg font-bold text-[var(--text-primary)] num">+${data.in_sample.expectancy_usd}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Trades (n)</span>
                <span className="font-semibold text-zinc-300 num">{data.in_sample.trade_count}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">SL Hit Rate</span>
                <span className="font-semibold text-red-400 num">{data.in_sample.sl_hit_rate_pct}%</span>
              </div>
            </div>
          </div>

          {/* Out-Of-Sample Card */}
          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-1 border-amber/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber font-bold uppercase">
                OUT-OF-SAMPLE ({testYears[0]}-{testYears[1]})
              </span>
              <span className="text-[10px] text-amber font-semibold">Unseen Verification Data</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Win Rate</span>
                <span className="text-lg font-bold text-emerald-300 num">{data.out_of_sample.win_rate_pct}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Expectancy</span>
                <span className="text-lg font-bold text-amber num">+${data.out_of_sample.expectancy_usd}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Trades (n)</span>
                <span className="font-semibold text-zinc-300 num">{data.out_of_sample.trade_count}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">SL Hit Rate</span>
                <span className="font-semibold text-red-400 num">{data.out_of_sample.sl_hit_rate_pct}%</span>
              </div>
            </div>
          </div>

          {/* Full Period Card */}
          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                FULL 9-YEAR RECORD (2017-2026)
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">Cumulative Performance</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Total PnL ($10k base)</span>
                <span className="text-lg font-bold text-emerald-400 num">+${data.full_period.total_pnl_usd.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Max Drawdown</span>
                <span className="text-lg font-bold text-red-400 num">{data.full_period.max_drawdown_pct}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Profit Factor</span>
                <span className="font-semibold text-zinc-300 num">{data.full_period.profit_factor}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Total Trades</span>
                <span className="font-semibold text-zinc-300 num">{data.full_period.trade_count}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equity Curve SVG Visualization */}
      {data && data.equity_curve.length > 0 && (
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
          <div className="flex items-center justify-between text-xs hairline-b pb-2">
            <span className="font-semibold">CUMULATIVE EQUITY CURVE ($10,000 Starting Capital)</span>
            <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-500"></span> In-Sample
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber"></span> Out-of-Sample
              </span>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1 text-[var(--text-primary)] hover:text-amber font-semibold"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="h-40 w-full relative">
            {/* Simple high-density SVG line chart */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 160" preserveAspectRatio="none">
              {(() => {
                const points = data.equity_curve;
                const minEq = Math.min(...points.map((p) => p.equity)) * 0.98;
                const maxEq = Math.max(...points.map((p) => p.equity)) * 1.02;
                const range = maxEq - minEq || 1;

                const pathD = points
                  .map((p, i) => {
                    const x = (i / (points.length - 1)) * 1000;
                    const y = 160 - ((p.equity - minEq) / range) * 150 - 5;
                    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(' ');

                return (
                  <>
                    <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2" />
                    <line x1="0" y1="155" x2="1000" y2="155" stroke="#272C30" strokeWidth="1" />
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* Yearly Table */}
      {data && (
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold hairline-b pb-2">
            <span>YEARLY BREAKDOWN TABLE</span>
            <span className="text-[10px] text-[var(--text-muted)]">All metrics computed from real Binance tick excursions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[var(--text-muted)] text-[10px] uppercase hairline-b">
                  <th className="py-1 px-2">Year</th>
                  <th className="py-1 px-2 text-right">Trades (n)</th>
                  <th className="py-1 px-2 text-right">Win Rate %</th>
                  <th className="py-1 px-2 text-right">SL Hit Rate %</th>
                  <th className="py-1 px-2 text-right">Net PnL (USD)</th>
                  <th className="py-1 px-2 text-right">Expectancy / Trade</th>
                  <th className="py-1 px-2 text-right">Profit Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {data.yearly_breakdown.map((y) => (
                  <tr key={y.year} className="hover:bg-[var(--bg-subtle)]">
                    <td className="py-1.5 px-2 font-bold">{y.year}</td>
                    <td className="py-1.5 px-2 text-right num text-zinc-400">{y.trades}</td>
                    <td className="py-1.5 px-2 text-right num font-semibold text-emerald-400">{y.win_rate_pct}%</td>
                    <td className="py-1.5 px-2 text-right num font-semibold text-red-400">{y.sl_rate_pct}%</td>
                    <td className={`py-1.5 px-2 text-right num font-bold ${y.pnl_usd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {y.pnl_usd >= 0 ? `+$${y.pnl_usd.toLocaleString()}` : `-$${Math.abs(y.pnl_usd).toLocaleString()}`}
                    </td>
                    <td className="py-1.5 px-2 text-right num text-zinc-300">+${y.expectancy}</td>
                    <td className="py-1.5 px-2 text-right num text-zinc-300">{y.profit_factor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Honesty Warnings */}
      {data && (
        <div className="space-y-1 text-[10px] font-mono text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
          <p><b className="text-amber">Theoretical Pricing Notice:</b> {data.disclaimer}</p>
          <p><b className="text-zinc-400">Out-of-Sample Discipline:</b> {data.selection_bias_warning}</p>
        </div>
      )}
    </div>
  );
};

