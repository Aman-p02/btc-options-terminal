'use client';

import React, { useState, useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';
import { LiveTickerData, RegimeData } from '@/lib/types';
import { Header } from '@/components/Header';
import { HeatmapView } from '@/components/HeatmapView';
import { StrikeFinderView } from '@/components/StrikeFinderView';
import { DistanceCalcView } from '@/components/DistanceCalcView';
import { SLPlannerView } from '@/components/SLPlannerView';
import { BacktesterView } from '@/components/BacktesterView';
import { CompareView } from '@/components/CompareView';
import { LivePanel } from '@/components/LivePanel';
import { Footer } from '@/components/Footer';
import { ExportModal } from '@/components/ExportModal';
import { PlanGateModal } from '@/components/PlanGateModal';
import {
  Grid,
  Search,
  Ruler,
  ShieldAlert,
  PlaySquare,
  Columns,
  Radio,
  Download,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function TerminalPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [tzOffset, setTzOffset] = useState<number>(330); // IST default
  const [activeTab, setActiveTab] = useState<
    'heatmap' | 'strike_finder' | 'distance' | 'sl_planner' | 'backtester' | 'compare' | 'live'
  >('heatmap');

  const [liveData, setLiveData] = useState<LiveTickerData | null>(null);
  const [regimeData, setRegimeData] = useState<RegimeData | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'elite'>('pro');

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');

  // Selected setup state for chaining across tabs
  const [selectedDow, setSelectedDow] = useState<number>(0); // Sunday
  const [selectedHour, setSelectedHour] = useState<number>(10); // 10 AM
  const [selectedHold, setSelectedHold] = useState<number>(360); // 6h
  const [selectedDist, setSelectedDist] = useState<number>(2.5);

  const t = translations[locale];

  // Fetch live market data on interval
  useEffect(() => {
    async function loadTelemetry() {
      try {
        const [liveRes, regimeRes] = await Promise.all([
          fetch(`/api/live?tz_offset_min=${tzOffset}`),
          fetch('/api/regimes')
        ]);
        if (liveRes.ok) setLiveData(await liveRes.json());
        if (regimeRes.ok) setRegimeData(await regimeRes.json());
      } catch (e) {
        console.error('Failed to load telemetry', e);
      }
    }

    loadTelemetry();
    const timer = setInterval(loadTelemetry, 15000);
    return () => clearInterval(timer);
  }, [tzOffset]);

  const handleSelectSlotFromHeatmap = (dow: number, hour: number, minute: number) => {
    setSelectedDow(dow);
    setSelectedHour(hour);
    setActiveTab('distance');
  };

  const handleSelectSetupFromFinder = (dow: number, hour: number, hold: number, strikeDist: number) => {
    setSelectedDow(dow);
    setSelectedHour(hour);
    setSelectedHold(hold);
    setSelectedDist(strikeDist);
    setActiveTab('backtester');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDark ? 'dark bg-terminal-bg text-terminal-text' : 'light bg-lightterm-bg text-lightterm-text'}`}>
      {/* Modern Top Navigation Header with Hamburger */}
      <Header
        locale={locale}
        setLocale={setLocale}
        isDark={isDark}
        setIsDark={setIsDark}
        tzOffset={tzOffset}
        setTzOffset={setTzOffset}
        liveData={liveData}
        userPlan={userPlan}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportClick={() => setIsExportOpen(true)}
        onUpgradeClick={() => {
          setUpgradeReason('Upgrade to unlock full institutional features');
          setIsUpgradeOpen(true);
        }}
      />

      {/* Clean Insight Callout Bar */}
      <div className="bg-[var(--bg-subtle)] border-b border-[var(--border-color)] px-4 py-2 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber/15 border border-amber/30 text-amber font-mono font-bold text-[10px] shrink-0">
            <Sparkles className="w-3 h-3 text-amber" />
            <span>EMPIRICAL KEY TAKEAWAY</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] truncate">
            Sunday 10:00 AM IST (6h hold, 2.5% strike) historically touched in only <strong className="text-emerald-400">6.5%</strong> of cases (477 sample runs). Wednesday touched in <strong className="text-red-400">18.2%</strong>.
          </span>
        </div>

        <button
          onClick={() => setActiveTab('heatmap')}
          className="text-amber hover:underline text-[11px] font-mono flex items-center gap-1 shrink-0"
        >
          <span>View Heatmap</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Tab Navigation Ribbon (Desktop Clean Pills) */}
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-2 hidden md:flex items-center gap-1.5 overflow-x-auto select-none">
        {[
          { id: 'heatmap', label: t.navHeatmap, icon: Grid },
          { id: 'strike_finder', label: t.navStrikeFinder, icon: Search },
          { id: 'distance', label: t.navDistanceCalc, icon: Ruler },
          { id: 'sl_planner', label: t.navSLPlanner, icon: ShieldAlert },
          { id: 'backtester', label: t.navBacktester, icon: PlaySquare },
          { id: 'compare', label: t.navCompare, icon: Columns },
          { id: 'live', label: t.navLivePanel, icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                isActive
                  ? 'bg-amber text-black font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Views */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1650px] w-full mx-auto">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 sm:p-5 shadow-sm">
          {activeTab === 'heatmap' && (
            <HeatmapView
              locale={locale}
              tzOffset={tzOffset}
              spotPrice={liveData?.btc_price || 70000}
              onSelectSlot={handleSelectSlotFromHeatmap}
            />
          )}

          {activeTab === 'strike_finder' && (
            <StrikeFinderView
              locale={locale}
              tzOffset={tzOffset}
              spotPrice={liveData?.btc_price || 70000}
              onSelectSetup={handleSelectSetupFromFinder}
            />
          )}

          {activeTab === 'distance' && (
            <DistanceCalcView
              locale={locale}
              tzOffset={tzOffset}
              spotPrice={liveData?.btc_price || 70000}
              initialDow={selectedDow}
              initialHour={selectedHour}
            />
          )}

          {activeTab === 'sl_planner' && (
            <SLPlannerView
              locale={locale}
              tzOffset={tzOffset}
              spotPrice={liveData?.btc_price || 70000}
            />
          )}

          {activeTab === 'backtester' && (
            <BacktesterView
              locale={locale}
              tzOffset={tzOffset}
              spotPrice={liveData?.btc_price || 70000}
            />
          )}

          {activeTab === 'compare' && (
            <CompareView
              locale={locale}
              tzOffset={tzOffset}
              spotPrice={liveData?.btc_price || 70000}
            />
          )}

          {activeTab === 'live' && (
            <LivePanel
              locale={locale}
              liveData={liveData}
              regimeData={regimeData}
            />
          )}
        </div>
      </main>

      {/* Universal Footer */}
      <Footer locale={locale} />

      {/* PDF Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        reportData={{
          title: 'BTC Options Statistical Research Dossier',
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDow],
          timeStr: `${String(selectedHour).padStart(2, '0')}:00`,
          holdStr: `${selectedHold / 60}h`,
          strikeDist: selectedDist,
          touchProb: 6.5,
          ciLower: 4.6,
          ciUpper: 9.1,
          sampleSize: 477,
          spot: liveData?.btc_price || 70000,
        }}
      />

      {/* Plan Gate Modal */}
      <PlanGateModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        reason={upgradeReason}
      />
    </div>
  );
}
