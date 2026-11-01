'use client';

import React, { useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';
import { DistanceCalcResponse, HoldMin } from '@/lib/types';
import { Columns, ArrowRight, ShieldCheck, Check, AlertTriangle } from 'lucide-react';

interface CompareViewProps {
  locale: Locale;
  tzOffset: number;
  spotPrice: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CompareView: React.FC<CompareViewProps> = ({
  locale,
  tzOffset,
  spotPrice,
}) => {
  const t = translations[locale];

  // Setup A (Default: Sunday 10 AM, 6h hold, 2.5% strike)
  const [dowA, setDowA] = useState<number>(0);
  const [hourA, setHourA] = useState<number>(10);
  const [holdA, setHoldA] = useState<HoldMin>(360);
  const [distA, setDistA] = useState<number>(2.25);
  const [resA, setResA] = useState<DistanceCalcResponse | null>(null);

  // Setup B (Default: Saturday 1 PM, 6h hold, 2.35% strike)
  const [dowB, setDowB] = useState<number>(6);
  const [hourB, setHourB] = useState<number>(13);
  const [holdB, setHoldB] = useState<HoldMin>(360);
  const [distB, setDistB] = useState<number>(2.35);
  const [resB, setResB] = useState<DistanceCalcResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchBoth() {
      setLoading(true);
      try {
        const [respA, respB] = await Promise.all([
          fetch('/api/distance-calculator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              day_of_week: dowA,
              hour: hourA,
              minute: 0,
              hold_min: holdA,
              side: 'both',
              strike_distance_pct: distA,
              spot: spotPrice,
              tz_offset_min: tzOffset,
            }),
          }),
          fetch('/api/distance-calculator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              day_of_week: dowB,
              hour: hourB,
              minute: 0,
              hold_min: holdB,
              side: 'both',
              strike_distance_pct: distB,
              spot: spotPrice,
              tz_offset_min: tzOffset,
            }),
          }),
        ]);

        if (respA.ok) setResA(await respA.json());
        if (respB.ok) setResB(await respB.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchBoth();
  }, [dowA, hourA, holdA, distA, dowB, hourB, holdB, distB, tzOffset, spotPrice]);

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Columns className="w-4 h-4 text-amber" />
          <span>SIDE-BY-SIDE SETUP COMPARISON</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">
          Compare risk profiles, confidence intervals, and tail moves across two independent setups
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SETUP A */}
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-3">
          <div className="flex items-center justify-between hairline-b pb-2">
            <span className="font-bold text-emerald-400">SETUP A</span>
            <div className="flex items-center gap-2">
              <select
                value={dowA}
                onChange={(e) => setDowA(Number(e.target.value))}
                className="bg-[var(--bg-subtle)] hairline-border px-1.5 py-0.5 rounded text-[11px]"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
              <select
                value={hourA}
                onChange={(e) => setHourA(Number(e.target.value))}
                className="bg-[var(--bg-subtle)] hairline-border px-1.5 py-0.5 rounded text-[11px]"
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
              <span className="text-[var(--text-muted)]">Dist:</span>
              <input
                type="number"
                step="0.1"
                value={distA}
                onChange={(e) => setDistA(Number(e.target.value))}
                className="w-14 bg-[var(--bg-subtle)] hairline-border px-1 py-0.5 rounded text-right"
              />
              <span>%</span>
            </div>
          </div>

          {resA && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-[var(--bg-subtle)] rounded">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Touch Rate</span>
                  <span className="text-xl font-bold num text-emerald-400">{resA.overall_touch_pct}%</span>
                </div>
                <div className="p-2 bg-[var(--bg-subtle)] rounded">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">95% Wilson CI</span>
                  <span className="text-sm font-semibold num text-zinc-300 block mt-1">[{resA.ci_lower}% - {resA.ci_upper}%]</span>
                </div>
                <div className="p-2 bg-[var(--bg-subtle)] rounded">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Sample Size (n)</span>
                  <span className="text-sm font-semibold num text-zinc-300 block mt-1">n = {resA.sample_size_n}</span>
                </div>
                <div className="p-2 bg-[var(--bg-subtle)] rounded">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Worst 9y Move</span>
                  <span className="text-sm font-bold num text-red-400 block mt-1">+{resA.worst_10_dates[0]?.move_pct || 0}%</span>
                </div>
              </div>

              {/* By year mini table */}
              <div className="pt-2 hairline-t">
                <span className="text-[10px] text-[var(--text-muted)] block mb-1">Consistency (Recent 3 Years):</span>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                  {resA.by_year.slice(-3).map((y) => (
                    <div key={y.year} className="p-1 bg-[var(--bg-subtle)] rounded">
                      <span className="text-[9px] text-[var(--text-muted)] block">{y.year}</span>
                      <span className="font-bold num text-emerald-300">{y.touch_pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SETUP B */}
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-3">
          <div className="flex items-center justify-between hairline-b pb-2">
            <span className="font-bold text-amber">SETUP B</span>
            <div className="flex items-center gap-2">
              <select
                value={dowB}
                onChange={(e) => setDowB(Number(e.target.value))}
                className="bg-[var(--bg-subtle)] hairline-border px-1.5 py-0.5 rounded text-[11px]"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
              <select
                value={hourB}
                onChange={(e) => setHourB(Number(e.target.value))}
                className="bg-[var(--bg-subtle)] hairline-border px-1.5 py-0.5 rounded text-[11px]"
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
              <span className="text-[var(--text-muted)]">Dist:</span>
              <input
                type="number"
                step="0.1"
                value={distB}
                onChange={(e) => setDistB(Number(e.target.value))}
                className="w-14 bg-[var(--bg-subtle)] hairline-border px-1 py-0.5 rounded text-right"
              />
              <span>%</span>
            </div>
          </div>

          {resB && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-[var(--bg-subtle)] rounded">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Touch Rate</span>
                  <span className="text-xl font-bold num text-amber">{resB.overall_touch_pct}%</span>
                </div>
                <div className="p-2 bg-[var(--bg-subtle)] rounded">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">95% Wilson CI</span>
                  <span className="text-sm font-semibold num text-zinc-300 block mt-1">[{resB.ci_lower}% - {resB.ci_upper}%]</span>
                </div>
                <div className="p-2 bg-[var(--bg-subtle)] rounded">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Sample Size (n)</span>
                  <span className="text-sm font-semibold num text-zinc-300 block mt-1">n = {resB.sample_size_n}</span>
                </div>
                <div className="p-2 bg-[var(--bg-subtle)] rounded">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Worst 9y Move</span>
                  <span className="text-sm font-bold num text-red-400 block mt-1">+{resB.worst_10_dates[0]?.move_pct || 0}%</span>
                </div>
              </div>

              {/* By year mini table */}
              <div className="pt-2 hairline-t">
                <span className="text-[10px] text-[var(--text-muted)] block mb-1">Consistency (Recent 3 Years):</span>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                  {resB.by_year.slice(-3).map((y) => (
                    <div key={y.year} className="p-1 bg-[var(--bg-subtle)] rounded">
                      <span className="text-[9px] text-[var(--text-muted)] block">{y.year}</span>
                      <span className="font-bold num text-amber">{y.touch_pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

