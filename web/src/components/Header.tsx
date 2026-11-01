'use client';

import React from 'react';
import { Locale, translations } from '@/lib/i18n';
import { LiveTickerData } from '@/lib/types';
import { Activity, Clock, ShieldCheck, Sun, Moon, Globe, Terminal } from 'lucide-react';

interface HeaderProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  isDark: boolean;
  setIsDark: (d: boolean) => void;
  tzOffset: number;
  setTzOffset: (tz: number) => void;
  liveData: LiveTickerData | null;
  userPlan: 'free' | 'pro' | 'elite';
  onUpgradeClick: () => void;
}

export const TIMEZONES = [
  { label: 'IST (UTC+5:30)', offset: 330 },
  { label: 'UTC (UTC+0)', offset: 0 },
  { label: 'EST (UTC-5)', offset: -300 },
  { label: 'CET (UTC+1)', offset: 60 },
  { label: 'SGT (UTC+8)', offset: 480 },
  { label: 'JST (UTC+9)', offset: 540 },
];

export const Header: React.FC<HeaderProps> = ({
  locale,
  setLocale,
  isDark,
  setIsDark,
  tzOffset,
  setTzOffset,
  liveData,
  userPlan,
  onUpgradeClick,
}) => {
  const t = translations[locale];

  return (
    <header className="hairline-b bg-[var(--bg-surface)] px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
      {/* Brand & Data Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono font-bold tracking-wider text-[var(--text-primary)]">
          <Terminal className="w-4 h-4 text-amber" />
          <span>{t.terminalTitle}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded hairline-border bg-[var(--bg-subtle)] font-mono text-[10px] text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{t.dataBadge}</span>
        </div>
      </div>

      {/* Live Market Feeds */}
      <div className="flex items-center gap-4 font-mono text-[11px]">
        {liveData ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">{t.liveSpot}:</span>
              <span className="font-bold text-[var(--text-primary)]">
                ${liveData.btc_price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-[9px] text-[var(--text-muted)]">({liveData.source})</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">{t.liveIV}:</span>
              <span className="text-amber font-semibold">{liveData.deribit_iv.deribit_dvol}%</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">{t.currentHour}:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                liveData.current_hour_rank.verdict === 'Very Calm'
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                  : 'bg-zinc-800 text-zinc-300'
              }`}>
                {liveData.current_hour_rank.verdict} ({liveData.current_hour_rank.calmness_percentile}th %ile)
              </span>
            </div>
          </>
        ) : (
          <div className="text-[var(--text-muted)] animate-pulse">Loading market feeds...</div>
        )}
      </div>

      {/* Controls: Timezone, Language, Theme, Plan Badge */}
      <div className="flex items-center gap-2.5">
        {/* Timezone Selector */}
        <div className="flex items-center gap-1 text-[var(--text-muted)]">
          <Clock className="w-3.5 h-3.5" />
          <select
            value={tzOffset}
            onChange={(e) => setTzOffset(Number(e.target.value))}
            className="bg-[var(--bg-subtle)] hairline-border text-[var(--text-primary)] text-[11px] px-1.5 py-1 rounded font-mono focus:outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.offset} value={tz.offset}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* Hindi / English Toggle */}
        <button
          onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1 px-2 py-1 hairline-border bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded hover:bg-[var(--border-hover)] font-mono text-[10px]"
          title="Toggle English / Hindi language"
        >
          <Globe className="w-3 h-3 text-amber" />
          <span>{locale === 'en' ? 'हिन्दी' : 'ENG'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-1.5 hairline-border bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded hover:bg-[var(--border-hover)]"
          title="Toggle dark/light terminal theme"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
        </button>

        {/* Plan Status */}
        {userPlan === 'free' ? (
          <button
            onClick={onUpgradeClick}
            className="px-2.5 py-1 bg-amber text-black font-semibold rounded text-[11px] hover:bg-amber-hover transition-colors font-mono"
          >
            PRO UPGRADE
          </button>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded hairline-border bg-amber/10 text-amber font-mono text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>PRO TERMINAL</span>
          </div>
        )}
      </div>
    </header>
  );
};

