'use client';

import React, { useState } from 'react';
import { Locale, translations } from '@/lib/i18n';
import { LiveTickerData } from '@/lib/types';
import {
  Clock,
  ShieldCheck,
  Sun,
  Moon,
  Globe,
  Terminal,
  Menu,
  X,
  Grid,
  Search,
  Ruler,
  ShieldAlert,
  PlaySquare,
  Columns,
  Radio,
  Download,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

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
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onExportClick: () => void;
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
  activeTab,
  setActiveTab,
  onExportClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[locale];

  const navItems = [
    { id: 'heatmap', label: t.navHeatmap, icon: Grid, desc: 'Historical safety probabilities across 7x24 hours' },
    { id: 'strike_finder', label: t.navStrikeFinder, icon: Search, desc: 'Scan for highest EV and safest OTM strikes' },
    { id: 'distance', label: t.navDistanceCalc, icon: Ruler, desc: 'Required strike cushion for target safety' },
    { id: 'sl_planner', label: t.navSLPlanner, icon: ShieldAlert, desc: 'Statistical stop loss multiplier planner' },
    { id: 'backtester', label: t.navBacktester, icon: PlaySquare, desc: 'Run historical 9.2-year strategy backtest' },
    { id: 'compare', label: t.navCompare, icon: Columns, desc: 'Side-by-side comparative trade setup analysis' },
    { id: 'live', label: t.navLivePanel, icon: Radio, desc: 'Live orderbook telemetry & volatility regimes' },
  ];

  return (
    <>
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs sticky top-0 z-50 backdrop-blur-md bg-opacity-95 shadow-sm">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] hover:bg-[var(--border-hover)] text-[var(--text-primary)] transition-all flex items-center gap-1.5 focus:outline-none"
              title="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-amber" /> : <Menu className="w-4 h-4 text-amber" />}
              <span className="font-mono text-[11px] font-semibold hidden sm:inline text-zinc-300">MENU</span>
            </button>

            {/* Brand Logo & Data Badge */}
            <div className="flex items-center gap-2 font-mono font-bold tracking-wider text-[var(--text-primary)]">
              <div className="w-6 h-6 rounded bg-amber/15 border border-amber/40 flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-amber" />
              </div>
              <span className="text-sm font-extrabold hidden xs:inline tracking-tight">
                BTC <span className="text-amber">TERMINAL</span>
              </span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-subtle)] font-mono text-[10px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>292.0M Ticks · 2017-2026</span>
            </div>
          </div>

          {/* Center: Live Bitcoin Ticker Clean Bar */}
          <div className="flex items-center gap-3 font-mono text-[11px] bg-[var(--bg-subtle)] px-3 py-1 rounded-full border border-[var(--border-color)]">
            {liveData ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-muted)] text-[10px]">BTC:</span>
                  <span className="font-bold text-amber">
                    ${liveData.btc_price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                </div>

                <div className="hidden md:flex items-center gap-1.5 border-l border-[var(--border-color)] pl-2.5">
                  <span className="text-[var(--text-muted)] text-[10px]">DVOL:</span>
                  <span className="text-zinc-200 font-semibold">{liveData.deribit_iv.deribit_dvol}%</span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 border-l border-[var(--border-color)] pl-2.5">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                    liveData.current_hour_rank.verdict === 'Very Calm'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {liveData.current_hour_rank.verdict}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-[var(--text-muted)] animate-pulse text-[10px]">Connecting telemetry...</div>
            )}
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2">
            {/* Timezone Selector */}
            <div className="hidden md:flex items-center gap-1 text-[var(--text-muted)]">
              <Clock className="w-3.5 h-3.5" />
              <select
                value={tzOffset}
                onChange={(e) => setTzOffset(Number(e.target.value))}
                className="bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] text-[11px] px-2 py-1 rounded-md font-mono focus:outline-none focus:border-amber transition-colors cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.offset} value={tz.offset}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Export PDF Button */}
            <button
              onClick={onExportClick}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] hover:text-amber text-[var(--text-primary)] text-[11px] font-semibold transition-colors"
              title="Download Research Dossier PDF"
            >
              <Download className="w-3.5 h-3.5 text-amber" />
              <span>PDF Report</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 px-2 py-1 border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded-md hover:bg-[var(--border-hover)] font-mono text-[10px]"
              title="Toggle English / Hindi"
            >
              <Globe className="w-3 h-3 text-amber" />
              <span>{locale === 'en' ? 'हिन्दी' : 'ENG'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded-md hover:bg-[var(--border-hover)] transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
            </button>

            {/* Pro Plan Indicator */}
            {userPlan === 'free' ? (
              <button
                onClick={onUpgradeClick}
                className="px-2.5 py-1 bg-amber text-black font-semibold rounded-md text-[11px] hover:bg-amber-hover transition-colors font-mono"
              >
                UPGRADE
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded border border-amber/30 bg-amber/10 text-amber font-mono text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                <span>PRO</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hamburger Flyout Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar Drawer */}
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border-r border-[var(--border-color)] h-full flex flex-col p-4 shadow-2xl z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-amber/20 border border-amber/40 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-amber" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">BTC Terminal Modules</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">9.2Y Empirical Backtest Suite</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Timezone selector */}
            <div className="mb-4 md:hidden">
              <label className="text-[10px] uppercase font-mono text-[var(--text-muted)] block mb-1">Timezone Display</label>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={tzOffset}
                  onChange={(e) => setTzOffset(Number(e.target.value))}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs p-2 rounded-md font-mono"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.offset} value={tz.offset}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navigation Options List */}
            <div className="space-y-1.5 flex-1">
              <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] px-2 py-1">Analytical Tools</div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-amber/15 border border-amber/50 text-amber'
                        : 'hover:bg-[var(--bg-subtle)] border border-transparent text-[var(--text-primary)]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-amber text-black' : 'bg-[var(--bg-subtle)] text-zinc-400 border border-[var(--border-color)]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs tracking-tight">{item.label}</span>
                        {isActive && <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber text-black font-bold">ACTIVE</span>}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Additional Links in Drawer */}
            <div className="pt-4 border-t border-[var(--border-color)] mt-4 space-y-2 text-xs">
              <button
                onClick={() => {
                  onExportClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded-md bg-[var(--bg-subtle)] hover:bg-amber/15 hover:text-amber border border-[var(--border-color)] font-mono text-[11px]"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full PDF Dossier</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[var(--text-muted)] pt-2">
                <a href="/methodology" className="p-1.5 hover:text-amber rounded bg-[var(--bg-subtle)] text-center border border-[var(--border-color)]">
                  Methodology
                </a>
                <a href="/pricing" className="p-1.5 hover:text-amber rounded bg-[var(--bg-subtle)] text-center border border-[var(--border-color)]">
                  Pricing Plans
                </a>
                <a href="/risk" className="p-1.5 hover:text-amber rounded bg-[var(--bg-subtle)] text-center border border-[var(--border-color)]">
                  Risk Notice
                </a>
                <a href="/terms" className="p-1.5 hover:text-amber rounded bg-[var(--bg-subtle)] text-center border border-[var(--border-color)]">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
