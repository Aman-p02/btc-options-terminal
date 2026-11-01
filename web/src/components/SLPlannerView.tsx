'use client';

import React, { useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';
import { SLPlannerResponse, SideType, HoldMin } from '@/lib/types';
import { ShieldAlert, Crosshair, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface SLPlannerProps {
  locale: Locale;
  tzOffset: number;
  spotPrice: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOLDS: { label: string; value: HoldMin }[] = [
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
  { label: '6h', value: 360 },
  { label: '12h', value: 720 },
  { label: '24h', value: 1440 },
];

export const SLPlannerView: React.FC<SLPlannerProps> = ({
  locale,
  tzOffset,
  spotPrice,
}) => {
  const t = translations[locale];

  const [dow, setDow] = useState<number>(0); // Sunday
  const [hour, setHour] = useState<number>(10);
  const [minute, setMinute] = useState<number>(0);
  const [holdMin, setHoldMin] = useState<HoldMin>(360);
  const [spot, setSpot] = useState<number>(spotPrice || 70000);
  const [userSlPct, setUserSlPct] = useState<number>(1.5);
  const [side, setSide] = useState<SideType>('both');

  const [data, setData] = useState<SLPlannerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spotPrice && spotPrice > 0 && spot === 70000) {
      setSpot(spotPrice);
    }
  }, [spotPrice]);

  useEffect(() => {
    async function fetchSLPlan() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch('/api/sl-planner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day_of_week: dow,
            hour,
            minute,
            hold_min: holdMin,
            spot,
            user_sl_pct: userSlPct,
            side,
            tz_offset_min: tzOffset,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || 'Failed to calculate stop-loss plan');
        }

        const res: SLPlannerResponse = await resp.json();
        setData(res);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSLPlan();
  }, [dow, hour, minute, holdMin, spot, userSlPct, side, tzOffset]);

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Configuration Bar */}
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
            <option value="both">Both (Strangle)</option>
          </select>
        </div>

        {/* Spot Price */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">Spot:</span>
          <input
            type="number"
            value={spot}
            onChange={(e) => setSpot(Number(e.target.value))}
            className="w-24 bg-[var(--bg-subtle)] hairline-border px-2 py-1 rounded text-right focus:outline-none"
          />
        </div>

        {/* User SL % */}
        <div className="flex items-center gap-1.5">
          <span className="text-amber font-semibold">Test Stop-Loss:</span>
          <input
            type="number"
            step="0.1"
            min="0.2"
            max="20.0"
            value={userSlPct}
            onChange={(e) => setUserSlPct(Number(e.target.value))}
            className="w-16 bg-[var(--bg-subtle)] hairline-border px-2 py-1 rounded text-right focus:outline-none font-bold text-amber"
          />
          <span className="text-amber">%</span>
          {data?.user_sl_pts && (
            <span className="text-[var(--text-muted)]">(${data.user_sl_pts.toFixed(0)} pts)</span>
          )}
        </div>
      </div>

      {/* Primary Empirical Percentiles Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">Average Adverse Move</span>
            <span className="text-xl font-bold num text-zinc-200 block mt-1">
              +{data.avg_adverse_move_pct}%
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              ${data.avg_adverse_pts} pts
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">90th Percentile Move</span>
            <span className="text-xl font-bold num text-emerald-400 block mt-1">
              +{data.p90_adverse_move_pct}%
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              ${data.p90_adverse_pts} pts (survives 90% of trades)
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">95th Percentile Move</span>
            <span className="text-xl font-bold num text-amber block mt-1">
              +{data.p95_adverse_move_pct}%
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              ${data.p95_adverse_pts} pts (survives 95% of trades)
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">99th Percentile Move</span>
            <span className="text-xl font-bold num text-red-300 block mt-1">
              +{data.p99_adverse_move_pct}%
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              ${data.p99_adverse_pts} pts (outlier tail risk)
            </span>
          </div>

          <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase">Worst Crash Move (9y)</span>
            <span className="text-xl font-bold num text-red-500 block mt-1">
              +{data.worst_adverse_move_pct}%
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              ${data.worst_adverse_pts} pts
            </span>
          </div>
        </div>
      )}

      {/* Tested SL Performance Card */}
      {data && (
        <div className="p-4 bg-[var(--bg-surface)] hairline-border rounded flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber" />
              <span className="font-bold text-sm text-[var(--text-primary)]">
                Tested Stop-Loss: {userSlPct}% (${data.user_sl_pts} pts from entry)
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Historically triggered in <b className="text-[var(--text-primary)]">{data.user_sl_hit_rate_pct}%</b> of {data.sample_size_n} historical windows between 2017 and 2026.
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">95% Wilson Confidence Interval</span>
              <span className="font-bold text-sm text-zinc-300 num">
                [{data.ci_lower}% - {data.ci_upper}%]
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded font-bold text-xs ${
              data.user_sl_hit_rate_pct <= 5.0
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : data.user_sl_hit_rate_pct <= 15.0
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-red-950 text-red-400 border border-red-800'
            }`}>
              {data.user_sl_hit_rate_pct <= 5.0 ? 'HIGH SURVIVAL (>95%)' : data.user_sl_hit_rate_pct <= 15.0 ? 'MODERATE RISK' : 'FREQUENT STOPPED'}
            </div>
          </div>
        </div>
      )}

      {/* Yearly SL Hit Rate Breakdown */}
      <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold hairline-b pb-2">
          <span>YEAR-BY-YEAR STOP-LOSS HIT RATE FOR {userSlPct}% SL</span>
          <span className="text-[10px] text-[var(--text-muted)]">Shows whether this stop-loss survived extreme high-volatility years</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[var(--text-muted)] text-[10px] uppercase hairline-b">
                <th className="py-1 px-2">Year</th>
                <th className="py-1 px-2 text-right">Total Windows (n)</th>
                <th className="py-1 px-2 text-right">SL Hit Count</th>
                <th className="py-1 px-2 text-right">SL Hit Rate %</th>
                <th className="py-1 px-2 text-right">Worst Adverse Excursion That Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {data?.sl_hit_by_year.map((y) => (
                <tr key={y.year} className="hover:bg-[var(--bg-subtle)]">
                  <td className="py-1 px-2 font-bold">{y.year}</td>
                  <td className="py-1 px-2 text-right num text-zinc-400">{y.trades}</td>
                  <td className="py-1 px-2 text-right num text-zinc-400">{y.sl_hits}</td>
                  <td className="py-1 px-2 text-right num font-semibold">
                    <span className={y.hit_rate_pct <= 5 ? 'text-emerald-400' : y.hit_rate_pct <= 15 ? 'text-amber' : 'text-red-400'}>
                      {y.hit_rate_pct}%
                    </span>
                  </td>
                  <td className="py-1 px-2 text-right num text-zinc-300">+{y.worst_move_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

