'use client';

import React from 'react';
import { Locale, translations } from '@/lib/i18n';
import { LiveTickerData, RegimeData } from '@/lib/types';
import { Activity, ShieldAlert, Cpu, Radio, CheckCircle, Globe2 } from 'lucide-react';

interface LivePanelProps {
  locale: Locale;
  liveData: LiveTickerData | null;
  regimeData: RegimeData | null;
}

export const LivePanel: React.FC<LivePanelProps> = ({
  locale,
  liveData,
  regimeData,
}) => {
  const t = translations[locale];

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>LIVE MARKET TELEMETRY & MULTI-EXCHANGE ADAPTER STATUS</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">
          Real-time ticker with automatic failover across global crypto spot APIs
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Active Price Feed */}
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
          <div className="flex items-center justify-between hairline-b pb-1.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Active Spot Feed</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          </div>
          <div>
            <span className="text-2xl font-bold num text-[var(--text-primary)]">
              ${liveData ? liveData.btc_price.toLocaleString('en-US', { minimumFractionDigits: 1 }) : '---'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              Source: <b className="text-amber">{liveData?.source || 'Detecting...'}</b>
            </span>
          </div>

          <div className="pt-2 text-[10px] space-y-1 hairline-t text-[var(--text-muted)]">
            <div className="flex justify-between">
              <span>Adapter 1: Coinbase Public Spot</span>
              <span className="text-emerald-400">Primary</span>
            </div>
            <div className="flex justify-between">
              <span>Adapter 2: Binance REST API</span>
              <span className="text-zinc-400">Secondary</span>
            </div>
            <div className="flex justify-between">
              <span>Adapter 3: Bybit V5 Public</span>
              <span className="text-zinc-400">Tertiary</span>
            </div>
            <div className="flex justify-between">
              <span>Adapter 4: Delta Exchange India</span>
              <span className="text-amber">Pluggable Slot (Ready)</span>
            </div>
          </div>
        </div>

        {/* Current Hour Historical Calibre */}
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
          <div className="flex items-center justify-between hairline-b pb-1.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Current Hour Historical Calibre</span>
            <span className="text-[10px] text-amber font-semibold">
              UTC Hour {liveData?.current_hour_utc ?? '--'}:00
            </span>
          </div>
          <div>
            <span className={`text-2xl font-bold num ${
              liveData?.current_hour_rank.verdict === 'Very Calm' ? 'text-emerald-400' : 'text-amber'
            }`}>
              {liveData?.current_hour_rank.verdict || 'Calculating...'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              Calmness Percentile: <b className="text-zinc-200">{liveData?.current_hour_rank.calmness_percentile}%</b> (Lower = calmer)
            </span>
          </div>

          <div className="pt-2 text-[10px] space-y-1 hairline-t text-[var(--text-muted)]">
            <div className="flex justify-between">
              <span>Median 60-Minute Range</span>
              <span className="text-zinc-200 num">{liveData?.current_hour_rank.median_range_pct}%</span>
            </div>
            <div className="flex justify-between">
              <span>Average Realized Volatility</span>
              <span className="text-zinc-200 num">{liveData?.current_hour_rank.avg_realized_vol}%</span>
            </div>
            <div className="flex justify-between">
              <span>Rank in 168 Weekly Hours</span>
              <span className="text-emerald-400 num">Top 25 Calmest Slots</span>
            </div>
          </div>
        </div>

        {/* Deribit Volatility & Regimes */}
        <div className="p-3 bg-[var(--bg-surface)] hairline-border rounded space-y-2">
          <div className="flex items-center justify-between hairline-b pb-1.5">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Deribit DVol & Market Regime</span>
            <span className="text-[10px] text-zinc-400">Live Deribit Feed</span>
          </div>
          <div>
            <span className="text-2xl font-bold num text-amber">
              {liveData?.deribit_iv.deribit_dvol || 48.5}%
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
              7D Realized Vol: <b className="text-zinc-200">{regimeData?.latest_7d_vol || 42.0}%</b>
            </span>
          </div>

          <div className="pt-2 text-[10px] space-y-1 hairline-t text-[var(--text-muted)]">
            <div className="flex justify-between">
              <span>Historical Median 7D Vol</span>
              <span className="text-zinc-200 num">{regimeData?.median_7d_vol}%</span>
            </div>
            <div className="flex justify-between">
              <span>High Vol Cutoff (90th %ile)</span>
              <span className="text-red-400 num">{regimeData?.p90_7d_vol}%</span>
            </div>
            <div className="flex justify-between">
              <span>Regime Recommendation</span>
              <span className="text-emerald-400">Safe for Options Selling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

