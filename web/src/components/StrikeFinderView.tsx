'use client';

import React, { useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';
import { StrikeFinderResponse, StrikeFinderRow, SideType, HoldMin } from '@/lib/types';
import { Search, AlertCircle, ArrowUpDown, Shield, Clock } from 'lucide-react';

interface StrikeFinderProps {
  locale: Locale;
  tzOffset: number;
  spotPrice: number;
  onSelectSetup?: (dow: number, hour: number, hold: number, strikeDist: number) => void;
}

const HOLDS: { label: string; value: HoldMin }[] = [
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
  { label: '6h', value: 360 },
  { label: '12h', value: 720 },
  { label: '24h', value: 1440 },
];

export const StrikeFinderView: React.FC<StrikeFinderProps> = ({
  locale,
  tzOffset,
  spotPrice,
  onSelectSetup,
}) => {
  const t = translations[locale];

  // Parameters
  const [spot, setSpot] = useState<number>(spotPrice || 70000);
  const [holdMin, setHoldMin] = useState<HoldMin>(360);
  const [side, setSide] = useState<SideType>('call');
  const [maxTouchProb, setMaxTouchProb] = useState<number>(5.0);
  const [minPremium, setMinPremium] = useState<number>(25.0);
  const [iv, setIv] = useState<number>(0.45);
  const [fromYear, setFromYear] = useState<number>(2024);
  const [toYear, setToYear] = useState<number>(2026);

  const [data, setData] = useState<StrikeFinderResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync spot if updated
  useEffect(() => {
    if (spotPrice && spotPrice > 0 && spot === 70000) {
      setSpot(spotPrice);
    }
  }, [spotPrice]);

  const runFinder = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/strike-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spot,
          hold_min: holdMin,
          side,
          max_touch_prob: maxTouchProb,
          min_premium: minPremium,
          iv,
          from_year: fromYear,
          to_year: toYear,
          tz_offset_min: tzOffset,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json();
        throw new Error(errJson.error || 'Failed to scan strikes');
      }

      const res: StrikeFinderResponse = await resp.json();
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runFinder();
  }, [holdMin, side, maxTouchProb, minPremium, iv, fromYear, toYear, tzOffset]);

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          {/* Spot Price */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Spot USD:</span>
            <input
              type="number"
              value={spot}
              onChange={(e) => setSpot(Number(e.target.value))}
              className="w-24 bg-[var(--bg-subtle)] hairline-border px-2 py-1 rounded text-right focus:outline-none"
            />
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

          {/* Max Touch Prob */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Max Touch %:</span>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="20.0"
              value={maxTouchProb}
              onChange={(e) => setMaxTouchProb(Number(e.target.value))}
              className="w-16 bg-[var(--bg-subtle)] hairline-border px-2 py-1 rounded text-right focus:outline-none"
            />
            <span className="text-[var(--text-muted)]">%</span>
          </div>

          {/* Min Premium */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Min Premium:</span>
            <input
              type="number"
              min="0"
              value={minPremium}
              onChange={(e) => setMinPremium(Number(e.target.value))}
              className="w-16 bg-[var(--bg-subtle)] hairline-border px-2 py-1 rounded text-right focus:outline-none"
            />
            <span className="text-[var(--text-muted)]">USD</span>
          </div>

          {/* Broker IV */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Broker IV:</span>
            <input
              type="number"
              step="0.01"
              min="0.10"
              max="2.00"
              value={iv}
              onChange={(e) => setIv(Number(e.target.value))}
              className="w-16 bg-[var(--bg-subtle)] hairline-border px-2 py-1 rounded text-right focus:outline-none"
            />
            <span className="text-[var(--text-muted)]">({(iv * 100).toFixed(0)}%)</span>
          </div>

          <button
            onClick={runFinder}
            disabled={loading}
            className="px-3 py-1 bg-amber text-black font-semibold rounded hover:bg-amber-hover transition-colors flex items-center gap-1 ml-auto"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loading ? 'Scanning...' : 'Scan Strikes'}</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--text-muted)]">
            RANKED STRIKE OPPORTUNITIES ({data?.results.length || 0} setups found meeting &le;{maxTouchProb}% touch risk)
          </span>
          <span className="text-[10px] text-amber">
            Theoretical Estimates via Black-Scholes (r=0)
          </span>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-[var(--text-muted)] font-mono text-xs">
            Evaluating historical distributions and option repricing...
          </div>
        ) : error ? (
          <div className="p-3 bg-red-950/20 hairline-border border-red-800 text-red-400 text-xs font-mono">
            {error}
          </div>
        ) : data && data.results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="hairline-b text-[var(--text-muted)] text-[10px] uppercase">
                  <th className="py-2 px-2 text-center w-12">#</th>
                  <th className="py-2 px-2">Day & Entry (Timezone)</th>
                  <th className="py-2 px-2 text-right">Distance</th>
                  <th className="py-2 px-2 text-right">Target Strike</th>
                  <th className="py-2 px-2 text-right">Theor. Premium</th>
                  <th className="py-2 px-2 text-right">Recent Touch % ({fromYear}-{toYear})</th>
                  <th className="py-2 px-2 text-right">Full History Touch % (2017-2026)</th>
                  <th className="py-2 px-2 text-right">95% Wilson CI</th>
                  <th className="py-2 px-2 text-right">Sample (n)</th>
                  <th className="py-2 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {data.results.map((r) => (
                  <tr key={`${r.rank}-${r.day_name}-${r.hour}`} className="hover:bg-[var(--bg-subtle)] transition-colors">
                    <td className="py-2 px-2 text-center text-[var(--text-muted)]">{r.rank}</td>
                    <td className="py-2 px-2 font-bold text-[var(--text-primary)]">
                      {r.day_name} {r.entry_time_str}
                    </td>
                    <td className="py-2 px-2 text-right num text-zinc-300">
                      +{r.distance_pct.toFixed(2)}% (${r.distance_pts.toFixed(0)} pts)
                    </td>
                    <td className="py-2 px-2 text-right num font-semibold text-amber">
                      ${r.strike.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-2 text-right num text-emerald-400 font-bold">
                      ${r.theoretical_premium.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right num font-semibold text-emerald-300">
                      {r.touch_pct_recent.toFixed(2)}%
                    </td>
                    <td className="py-2 px-2 text-right num text-zinc-400">
                      {r.touch_pct_full.toFixed(2)}%
                    </td>
                    <td className="py-2 px-2 text-right num text-zinc-400 text-[11px]">
                      [{r.ci_lower.toFixed(2)}% - {r.ci_upper.toFixed(2)}%]
                    </td>
                    <td className="py-2 px-2 text-right num text-zinc-400">
                      {r.sample_size_n}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => onSelectSetup && onSelectSetup(r.day_of_week, r.hour, holdMin, r.distance_pct)}
                        className="px-2 py-0.5 hairline-border bg-[var(--bg-subtle)] hover:bg-amber hover:text-black rounded text-[10px] transition-colors"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--text-muted)] font-mono text-xs">
            No day/time slots found matching criteria. Try increasing max touch % or lowering minimum premium.
          </div>
        )}

        {/* Disclaimer & Selection Bias Notes */}
        {data && (
          <div className="space-y-1 pt-2 border-t border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)]">
            <p><b className="text-amber">Model Disclaimer:</b> {data.disclaimer}</p>
            <p><b className="text-zinc-400">Selection Bias Warning:</b> {data.selection_bias_note}</p>
          </div>
        )}
      </div>
    </div>
  );
};

