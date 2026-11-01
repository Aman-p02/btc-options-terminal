'use client';

import React, { useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';
import { DistanceCalcResponse, SideType, HoldMin } from '@/lib/types';
import { Calendar, AlertTriangle, BarChart3, TrendingDown } from 'lucide-react';

interface DistanceCalcProps {
  locale: Locale;
  tzOffset: number;
  spotPrice: number;
  initialDow?: number;
  initialHour?: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOLDS: { label: string; value: HoldMin }[] = [
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '3h', value: 180 },
  { label: '4h', value: 240 },
  { label: '6h', value: 360 },
  { label: '8h', value: 480 },
  { label: '12h', value: 720 },
  { label: '24h', value: 1440 },
];

export const DistanceCalcView: React.FC<DistanceCalcProps> = ({
  locale,
  tzOffset,
  spotPrice,
  initialDow = 0,
  initialHour = 10,
}) => {
  const t = translations[locale];

  const [dow, setDow] = useState<number>(initialDow);
  const [hour, setHour] = useState<number>(initialHour);
  const [minute, setMinute] = useState<number>(0);
  const [holdMin, setHoldMin] = useState<HoldMin>(360);
  const [side, setSide] = useState<SideType>('call');
  const [strikeDistPct, setStrikeDistPct] = useState<number>(2.5);
  const [spot, setSpot] = useState<number>(spotPrice || 70000);

  const [data, setData] = useState<DistanceCalcResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spotPrice && spotPrice > 0 && spot === 70000) {
      setSpot(spotPrice);
    }
  }, [spotPrice]);

  useEffect(() => {
    async function fetchDistance() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch('/api/distance-calculator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day_of_week: dow,
            hour,
            minute,
            hold_min: holdMin,
            side,
            strike_distance_pct: strikeDistPct,
            spot,
            tz_offset_min: tzOffset,
          }),
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || 'Failed to calculate distance');
        }
        const res: DistanceCalcResponse = await resp.json();
        setData(res);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDistance();
  }, [dow, hour, minute, holdMin, side, strikeDistPct, spot, tzOffset]);

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Controls Bar */}
      <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded flex flex-wrap items-center gap-3">
        {/* Day */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">Day:</span>
          <select
            value={dow}
            onChange={(e) => setDow(Number(e.target.value))}
            className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] px-2 py-1 rounded text-xs focus:outline-none"
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">Entry Time:</span>
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] px-2 py-1 rounded text-xs focus:outline-none"
          >
            {Array.from({ length: 24 }).map((_, h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>

        {/* Hold */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">{t.holdDuration}:</span>
          <div className="inline-flex rounded hairline-border bg-[var(--bg-subtle)] p-0.5">
            {HOLDS.map((h) => (
              <button
                key={h.value}
                onClick={() => setHoldMin(h.value)}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  holdMin === h.value ? 'bg-amber text-black font-semibold' : 'text-[var(--text-muted)]'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Side */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">{t.side}:</span>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as SideType)}
            className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] px-2 py-1 rounded focus:outline-none uppercase"
          >
            <option value="call">Call</option>
            <option value="put">Put</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* Strike Distance */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">{t.strikeDist}:</span>
          <input
            type="number"
            step="0.25"
            min="0.5"
            max="30.0"
            value={strikeDistPct}
            onChange={(e) => setStrikeDistPct(Number(e.target.value))}
            className="w-16 bg-[var(--bg-subtle)] hairline-border px-2 py-1 rounded text-right focus:outline-none"
          />
          <span className="text-[var(--text-muted)]">%</span>
          {data?.strike_distance_pts && (
            <span className="text-amber">(${data.strike_distance_pts.toFixed(0)} pts)</span>
          )}
        </div>
      </div>

      {/* Main Metric Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">Historical Touch Probability</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold num ${
                data.overall_touch_pct <= 5.0 ? 'text-emerald-400' : data.overall_touch_pct <= 10.0 ? 'text-amber' : 'text-red-400'
              }`}>
                {data.overall_touch_pct}%
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                [{data.ci_lower}% - {data.ci_upper}%] 95% CI
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">
              Touched in {Math.round(data.sample_size_n * (data.overall_touch_pct / 100))} of {data.sample_size_n} historical windows
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">Sample Size & Data Horizon</span>
            <span className="text-xl font-bold text-[var(--text-primary)] block mt-1">
              n = {data.sample_size_n}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">
              Tested on every {data.day_name} {data.time_str} from 2017 to 2026
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">Worst Historical Excursion</span>
            <span className="text-xl font-bold text-red-400 block mt-1">
              +{data.worst_10_dates[0]?.move_pct.toFixed(2) || 0}%
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">
              ${data.worst_10_dates[0]?.move_pts.toFixed(0) || 0} pts on {data.worst_10_dates[0]?.date_str}
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">Safety Verdict</span>
            <span className={`text-xl font-bold block mt-1 ${
              data.overall_touch_pct <= 3.0 ? 'text-emerald-400' : data.overall_touch_pct <= 7.0 ? 'text-amber' : 'text-red-400'
            }`}>
              {data.overall_touch_pct <= 3.0 ? 'STATISTICALLY SAFE' : data.overall_touch_pct <= 7.0 ? 'MODERATE RISK' : 'HIGH TOUCH RISK'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-1">
              Based on empirical 1-second price action
            </span>
          </div>
        </div>
      )}

      {/* Grid: Yearly Breakdown & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* By-Year Breakdown */}
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold hairline-b pb-2">
            <span>YEAR-BY-YEAR TOUCH BREAKDOWN (2017-2026)</span>
            <span className="text-[10px] text-[var(--text-muted)]">Check consistency across regimes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[var(--text-muted)] text-[10px] uppercase hairline-b">
                  <th className="py-1 px-2">Year</th>
                  <th className="py-1 px-2 text-right">Trades (n)</th>
                  <th className="py-1 px-2 text-right">Touches</th>
                  <th className="py-1 px-2 text-right">Touch %</th>
                  <th className="py-1 px-2 text-right">Median Move</th>
                  <th className="py-1 px-2 text-right">95th %ile Move</th>
                  <th className="py-1 px-2 text-right">Worst Move</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {data?.by_year.map((y) => (
                  <tr key={y.year} className="hover:bg-[var(--bg-subtle)]">
                    <td className="py-1 px-2 font-bold">{y.year}</td>
                    <td className="py-1 px-2 text-right num text-zinc-400">{y.total_samples}</td>
                    <td className="py-1 px-2 text-right num text-zinc-400">{y.touches}</td>
                    <td className="py-1 px-2 text-right num font-semibold text-emerald-400">{y.touch_pct}%</td>
                    <td className="py-1 px-2 text-right num text-zinc-300">{y.median_move}%</td>
                    <td className="py-1 px-2 text-right num text-amber">{y.p95_move}%</td>
                    <td className="py-1 px-2 text-right num text-red-400 font-bold">{y.max_move}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adverse Excursion Distribution */}
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold hairline-b pb-2">
            <span>MAX ADVERSE EXCURSION DISTRIBUTION</span>
            <span className="text-[10px] text-[var(--text-muted)]">Histogram frequency of move magnitudes</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {data?.distribution_bins.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-24 text-[var(--text-muted)] num text-[11px]">{b.range_label}</span>
                <div className="flex-1 bg-[var(--bg-subtle)] h-4 rounded overflow-hidden relative">
                  <div
                    className={`h-full ${
                      i <= 2 ? 'bg-emerald-600/60' : i <= 4 ? 'bg-amber-600/60' : 'bg-red-600/70'
                    }`}
                    style={{ width: `${Math.min(100, b.pct_of_total * 2)}%` }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center text-[9px] num text-zinc-300">
                    {b.pct_of_total}% ({b.count})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Worst 10 Adverse Dates */}
      <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold hairline-b pb-2">
          <span className="text-red-400">WORST 10 HISTORICAL DATES FOR THIS WINDOW</span>
          <span className="text-[10px] text-[var(--text-muted)]">Exact market crash dates & outlier moves</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[var(--text-muted)] text-[10px] uppercase hairline-b">
                <th className="py-1.5 px-2">Date (UTC)</th>
                <th className="py-1.5 px-2 text-right">Entry Spot</th>
                <th className="py-1.5 px-2 text-right">Adverse Move %</th>
                <th className="py-1.5 px-2 text-right">Move in Points (at Current Spot)</th>
                <th className="py-1.5 px-2 text-right">Net Close % at Hold End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {data?.worst_10_dates.map((w, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-subtle)]">
                  <td className="py-1 px-2 font-mono text-zinc-300">{w.date_str}</td>
                  <td className="py-1 px-2 text-right num text-zinc-400">${w.entry_price.toLocaleString()}</td>
                  <td className="py-1 px-2 text-right num font-bold text-red-400">+{w.move_pct.toFixed(2)}%</td>
                  <td className="py-1 px-2 text-right num text-red-300">${w.move_pts.toLocaleString()} pts</td>
                  <td className="py-1 px-2 text-right num text-zinc-400">{w.net_pct > 0 ? `+${w.net_pct.toFixed(2)}%` : `${w.net_pct.toFixed(2)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

