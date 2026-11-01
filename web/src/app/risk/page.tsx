import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function RiskPage() {
  return (
    <div className="min-h-screen bg-[#0B0D0E] text-[#EDEDED] font-mono text-xs p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between hairline-b pb-4">
        <Link href="/" className="flex items-center gap-2 text-amber hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Research Terminal</span>
        </Link>
        <span className="text-[10px] text-zinc-400">LEGAL & RISK DISCLOSURE</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber" />
          <span>Risk Disclosure for Crypto Options Sellers</span>
        </h1>
        <p className="text-zinc-400 text-xs">Last Updated: November 2026</p>
      </div>

      <div className="space-y-4 text-zinc-300 leading-relaxed text-xs">
        <div className="p-3 bg-[#131618] hairline-border rounded space-y-1">
          <h2 className="font-bold text-amber">1. Asymmetric Loss Potential</h2>
          <p>
            Selling options (naked calls, short puts, or short strangles) involves accepting limited upside (the initial premium received) in exchange for potentially substantial or unlimited downside risk if the underlying Bitcoin price moves violently against the position.
          </p>
        </div>

        <div className="p-3 bg-[#131618] hairline-border rounded space-y-1">
          <h2 className="font-bold text-amber">2. Historical Probability vs Future Execution</h2>
          <p>
            Historical touch probabilities and adverse excursions are calculated strictly from Binance 1-second price history between 2017 and 2026. Prior survival of a stop-loss level does not guarantee future market behavior. Liquidity gaps, flash crashes, exchange outages, and extreme volatility spikes can cause execution slippage far worse than theoretical models predict.
          </p>
        </div>

        <div className="p-3 bg-[#131618] hairline-border rounded space-y-1">
          <h2 className="font-bold text-amber">3. No Investment Advice</h2>
          <p>
            The software, data, statistics, and backtests provided are strictly for quantitative research, backtesting, and educational purposes. Nothing on this website constitutes financial, trading, legal, or tax advice. Users are solely responsible for their own trading decisions and risk management.
          </p>
        </div>

        <div className="p-3 bg-[#131618] hairline-border rounded space-y-1">
          <h2 className="font-bold text-amber">4. Regulatory & Licensing Considerations</h2>
          <p>
            Crypto derivatives may be subject to legal restrictions or prohibitions in specific jurisdictions. Before trading or charging users for financial research services, subscribers must ensure full compliance with Binance data use policies, local financial regulators (including SEBI in India or equivalent international authorities), and taxation rules on Virtual Digital Assets (VDA).
          </p>
        </div>
      </div>
    </div>
  );
}

