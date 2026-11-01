'use client';

import React, { useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';
import { HeatmapResponse, HeatmapCell, SideType, HoldMin, HeatmapMetric, Resolution } from '@/lib/types';
import { Shield, AlertTriangle, Info, Sliders, ChevronDown } from 'lucide-react';

interface HeatmapViewProps {
  locale: Locale;
  tzOffset: number;
  spotPrice: number;
  onSelectSlot?: (dow: number, hour: number, minute: number) => void;
}

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

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  locale,
  tzOffset,
  spotPrice,
  onSelectSlot,
}) => {
  const t = translations[locale];

  // User filter states
  const [holdMin, setHoldMin] = useState<HoldMin>(360);
  const [side, setSide] = useState<SideType>('call');
  const [strikeDistPct, setStrikeDistPct] = useState<number>(2.5);
  const [fromYear, setFromYear] = useState<number>(2024);
  const [toYear, setToYear] = useState<number>(2026);
  const [metric, setMetric] = useState<HeatmapMetric>('touch_prob');
  const [resolution, setResolution] = useState<Resolution>('hour');
  const [filter7dVol, setFilter7dVol] = useState<boolean>(false);
  const [max7dVol, setMax7dVol] = useState<number>(60.0);
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  // Data & loading states
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    async function loadHeatmap() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch('/api/heatmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hold_min: holdMin,
            side,
            strike_distance_pct: strikeDistPct,
            from_year: fromYear,
            to_year: toYear,
            metric,
            grid_resolution: resolution,
            tz_offset_min: tzOffset,
            max_7d_vol: filter7dVol ? max7dVol : null,
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json();
          throw new Error(errData.error || 'Failed to load heatmap data');
        }

        const resData: HeatmapResponse = await resp.json();
        setData(resData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHeatmap();
  }, [holdMin, side, strikeDistPct, fromYear, toYear, metric, resolution, tzOffset, filter7dVol, max7dVol]);

  const getCellBg = (val: number, isTouchProb: boolean) => {
    if (isTouchProb) {
      if (val <= 3.0) return 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60 hover:border-emerald-400';
      if (val <= 6.0) return 'bg-emerald-900/40 text-emerald-400 border-emerald-900/40 hover:border-emerald-300';
      if (val <= 9.0) return 'bg-amber-950/60 text-amber-300 border-amber-900/50 hover:border-amber-400';
      if (val <= 14.0) return 'bg-amber-900/70 text-amber-200 border-amber-800/60 hover:border-amber-300';
      return 'bg-red-950/80 text-red-300 border-red-900/60 hover:border-red-400';
    }
    if (val <= 1.5) return 'bg-emerald-950/80 text-emerald-300 border-emerald-900/60 hover:border-emerald-400';
    if (val <= 3.0) return 'bg-amber-950/60 text-amber-300 border-amber-900/50 hover:border-amber-400';
    return 'bg-red-950/80 text-red-300 border-red-900/60 hover:border-red-400';
  };

  const ptsValue = spotPrice ? (spotPrice * (strikeDistPct / 100)).toFixed(0) : '0';

  return (
    <div className="space-y-3">
      {/* Mobile Filters Toggle Button */}
      <div className="sm:hidden flex items-center justify-between p-2.5 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber" />
          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">Trade Setup Filters</span>
        </div>
        <button
          onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          className="flex items-center gap-1 text-[11px] font-mono text-amber hover:underline"
        >
          <span>{showFiltersMobile ? 'Hide Filters' : 'Adjust Filters'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFiltersMobile ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Control Bar: Responsive Filters Toolbar */}
      <div className={`p-3 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-xl space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 text-xs ${showFiltersMobile ? 'block' : 'hidden sm:flex'}`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Hold Duration */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[var(--text-muted)] font-mono text-[11px]">{t.holdDuration}:</span>
            <div className="inline-flex rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] p-0.5 overflow-x-auto max-w-full">
              {HOLDS.map((h) => (
                <button
                  key={h.value}
                  onClick={() => setHoldMin(h.value)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors whitespace-nowrap ${
                    holdMin === h.value
                      ? 'bg-amber text-black font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Option Side */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[var(--text-muted)] font-mono text-[11px]">{t.side}:</span>
            <div className="inline-flex rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] p-0.5 font-mono">
              {(['call', 'put', 'both'] as SideType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={`px-2.5 py-0.5 text-[11px] uppercase rounded transition-colors ${
                    side === s
                      ? 'bg-amber/20 border border-amber/40 text-amber font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Strike Distance */}
          <div className="flex items-center gap-1.5 font-mono w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[var(--text-muted)] text-[11px]">{t.strikeDist}:</span>
            <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-color)] px-2 py-1 rounded-md">
              <input
                type="number"
                step="0.25"
                min="0.5"
                max="25.0"
                value={strikeDistPct}
                onChange={(e) => setStrikeDistPct(Number(e.target.value))}
                className="w-12 bg-transparent text-[var(--text-primary)] text-right font-bold focus:outline-none"
              />
              <span className="text-[var(--text-muted)]">%</span>
              {spotPrice > 0 && (
                <span className="text-[10px] text-amber pl-1">(${ptsValue} pts)</span>
              )}
            </div>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-1.5 font-mono w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[var(--text-muted)] text-[11px]">{t.metric}:</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as HeatmapMetric)}
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] px-2 py-1 rounded-md text-[11px] focus:outline-none focus:border-amber cursor-pointer"
            >
              <option value="touch_prob">{t.touchProb}</option>
              <option value="median_range">{t.medianRange}</option>
              <option value="p95_range">{t.p95Range}</option>
              <option value="worst_case">{t.worstCase}</option>
            </select>
          </div>
        </div>

        {/* Right side: Year Range & Skip Vol */}
        <div className="flex flex-wrap items-center gap-3 font-mono pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-color)]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[var(--text-muted)] text-[11px]">{t.years}:</span>
            <select
              value={`${fromYear}-${toYear}`}
              onChange={(e) => {
                const [from, to] = e.target.value.split('-').map(Number);
                setFromYear(from);
                setToYear(to);
              }}
              className="bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] px-2 py-1 rounded-md text-[11px] focus:outline-none focus:border-amber cursor-pointer"
            >
              <option value="2024-2026">2024-2026 (Recent Regime)</option>
              <option value="2017-2026">2017-2026 (Full 9-Year History)</option>
              <option value="2017-2023">2017-2023 (In-Sample Past)</option>
              <option value="2025-2026">2025-2026 (Last 2 Years)</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={filter7dVol}
              onChange={(e) => setFilter7dVol(e.target.checked)}
              className="accent-amber w-3.5 h-3.5"
            />
            <span>Skip High Vol (&gt;60%)</span>
          </label>
        </div>
      </div>

      {/* Main Heatmap Container */}
      <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl space-y-3">
        {/* Statistical Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-lg">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">{t.safestWindow}</span>
              <span className="font-bold text-emerald-400 text-sm sm:text-base">{data.safest_slot}</span>
            </div>
            <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-lg">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">{t.riskiestWindow}</span>
              <span className="font-bold text-red-400 text-sm sm:text-base">{data.riskiest_slot}</span>
            </div>
            <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-lg">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Mean Touch Rate</span>
              <span className="font-bold text-[var(--text-primary)] text-sm sm:text-base">{data.overall_touch_pct}%</span>
            </div>
            <div className="p-2.5 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-lg">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Total Windows (n)</span>
              <span className="font-bold text-zinc-300 text-sm sm:text-base">{data.overall_n.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Swipe hint on mobile */}
        <div className="sm:hidden text-center text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-center gap-1">
          <span>👈 Swipe left/right across 24 hours 👉</span>
        </div>

        {/* Heatmap Grid with Smooth Mobile Horizontal Scrolling */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-[var(--text-muted)] font-mono text-xs gap-2">
            <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin"></div>
            <span>Evaluating 2.57M historical excursions...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/20 border border-red-800 text-red-400 text-xs font-mono rounded-lg">
            {error}
          </div>
        ) : data ? (
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[840px] select-none">
              {/* Hour Header (00 to 23) */}
              <div className="grid grid-cols-[60px_repeat(24,_minmax(0,_1fr))] gap-1 mb-1 font-mono text-[10px] text-[var(--text-muted)] text-center">
                <div className="text-left pl-2 font-bold">DAY</div>
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="py-1 bg-[var(--bg-subtle)] rounded font-semibold text-zinc-400">
                    {String(h).padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Day Rows */}
              {Array.from({ length: 7 }).map((_, dow) => {
                const dayCells = data.cells.filter((c) => c.day_of_week === dow);
                return (
                  <div
                    key={dow}
                    className="grid grid-cols-[60px_repeat(24,_minmax(0,_1fr))] gap-1 mb-1 items-center font-mono text-xs"
                  >
                    <div className="text-[11px] font-bold text-amber pl-2">
                      {DAYS_SHORT[dow]}
                    </div>
                    {Array.from({ length: 24 }).map((_, hr) => {
                      const cell = dayCells.find((c) => c.hour === hr);
                      if (!cell) return <div key={hr} className="h-9 bg-zinc-900/30 rounded"></div>;

                      const val = cell.metric_value;
                      const isTouch = metric === 'touch_prob';
                      const bgClass = getCellBg(val, isTouch);

                      return (
                        <button
                          key={hr}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => {
                            setHoveredCell(cell);
                            if (onSelectSlot) onSelectSlot(cell.day_of_week, cell.hour, cell.minute);
                          }}
                          className={`h-9 rounded-md border flex flex-col items-center justify-center transition-all cursor-pointer ${bgClass} active:scale-95 focus:ring-1 focus:ring-amber focus:outline-none`}
                        >
                          <span className="text-[10px] font-bold num">{val.toFixed(1)}</span>
                          <span className="text-[7.5px] opacity-75 num">{cell.sample_size_n}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Selected / Hovered Detail Inspection Box */}
        <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-lg text-xs font-mono">
          {hoveredCell ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-amber text-black font-bold text-xs">
                  {hoveredCell.slot_label}
                </span>
                <span>
                  {t.touchProb}: <b className="text-amber">{hoveredCell.touch_pct}%</b>
                </span>
                <span>
                  95% CI: <b className="text-zinc-300">[{hoveredCell.ci_lower}% - {hoveredCell.ci_upper}%]</b>
                </span>
                <span>
                  Sample (n): <b className="text-zinc-300">{hoveredCell.sample_size_n}</b>
                </span>
              </div>
              {hoveredCell.low_sample_warning && (
                <div className="flex items-center gap-1 text-amber text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t.lowSampleWarning}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[var(--text-muted)] text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber shrink-0" />
              <span>Tap or hover any day/hour cell above to view statistical confidence intervals and sample size.</span>
            </div>
          )}
        </div>

        {/* Statistical Honesty Rule */}
        {data && (
          <div className="text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)] leading-normal">
            <b className="text-amber">Statistical Honesty:</b> {data.selection_bias_note}
          </div>
        )}
      </div>
    </div>
  );
};
