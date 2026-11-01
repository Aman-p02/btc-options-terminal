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
  Info,
  TrendingDown
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
    <div className={`min-h-screen flex flex-col font-sans ${isDark ? 'dark bg-terminal-bg text-terminal-text' : 'light bg-lightterm-bg text-lightterm-text'}`}>
      {/* Terminal Top Navigation Header */}
      <Header
        locale={locale}
        setLocale={setLocale}
        isDark={isDark}
        setIsDark={setIsDark}
        tzOffset={tzOffset}
        setTzOffset={setTzOffset}
        liveData={liveData}
        userPlan={userPlan}
        onUpgradeClick={() => {
          setUpgradeReason('Upgrade to unlock full institutional features');
          setIsUpgradeOpen(true);
        }}
      />

      {/* Real Data Finding Highlight Banner */}
      <div className="bg-[var(--bg-subtle)] hairline-b px-4 py-2 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber/20 text-amber font-bold text-[10px]">
            EMPIRICAL FINDING (2017-2026)
          </span>
          <span className="text-[11px] text-[var(--text-primary)]">
            Over 9.2 years (477 instances), <b>Sunday 10:00 AM IST</b> 6h hold with a 2.5% strike touched historically in only <b>6.5% of cases</b> (95% CI: [4.6% - 9.1%]). Wednesday 11:00 AM IST touched in <b>18.2%</b> of cases.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 hairline-border bg-[var(--bg-surface)] hover:text-amber rounded text-[11px] font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportPDF}</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Tab Navigation */}
      <div className="bg-[var(--bg-surface)] hairline-b px-4 flex items-center gap-1 overflow-x-auto text-xs font-mono select-none">
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
              className={`flex items-center gap-2 px-3 py-2.5 hairline-r transition-colors border-b-2 ${
                isActive
                  ? 'border-amber text-amber font-bold bg-[var(--bg-subtle)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Views */}
      <main className="flex-1 p-3 sm:p-4 max-w-[1600px] w-full mx-auto">
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

