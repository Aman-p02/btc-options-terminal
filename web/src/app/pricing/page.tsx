import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ShieldCheck, Zap } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0B0D0E] text-[#EDEDED] font-mono text-xs p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between hairline-b pb-4">
        <Link href="/" className="flex items-center gap-2 text-amber hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Research Terminal</span>
        </Link>
        <span className="text-[10px] text-zinc-400">PLANS & INSTITUTIONAL ACCESS</span>
      </div>

      <div className="space-y-2 text-center max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-white">Transparent Terminal Pricing</h1>
        <p className="text-zinc-400 text-xs">
          Built for serious Bitcoin options sellers. Powered by 29 crore 1-second price ticks. Server-enforced limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* FREE TIER */}
        <div className="p-4 bg-[#131618] hairline-border rounded space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <span className="text-zinc-400 font-bold block">COMMUNITY FREE</span>
              <div className="text-2xl font-bold text-white mt-1">₹0</div>
              <span className="text-[10px] text-zinc-500">Free forever</span>
            </div>
            <ul className="space-y-2 text-[11px] text-zinc-400">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-zinc-500" /> Last 2 Years of Data (2025-2026)</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-zinc-500" /> 6-Hour Hold Only (360m)</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-zinc-500" /> Safety Heatmap (Hourly)</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-zinc-500" /> Distance Calculator</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-zinc-500" /> 10 Queries / Day</li>
            </ul>
          </div>
          <Link href="/" className="w-full py-1.5 hairline-border bg-[#1C2023] hover:text-white rounded text-center block font-semibold">
            Use Free Terminal
          </Link>
        </div>

        {/* PRO RESEARCHER */}
        <div className="p-4 bg-[#131618] hairline-border rounded space-y-3 flex flex-col justify-between border-amber/60 relative">
          <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-amber text-black text-[9px] font-bold rounded">
            RECOMMENDED
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-amber font-bold block">PRO RESEARCHER</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-white num">₹2,499</span>
                <span className="text-[10px] text-zinc-400">/ mo ($29)</span>
              </div>
              <span className="text-[10px] text-zinc-400">Billed monthly or annually</span>
            </div>
            <ul className="space-y-2 text-[11px] text-zinc-300">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Full 9-Year History (2017-2026)</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> All 8 Hold Horizons (1h to 24h)</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Strike Finder Scanner</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Strategy Backtester with Equity Curve</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 7D Realized Vol Regime Filter</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Out-of-Sample Train/Test Engine</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 15-Minute Grid Resolution</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> PDF & CSV Dossier Export</li>
            </ul>
          </div>
          <button className="w-full py-1.5 bg-amber text-black rounded font-bold hover:bg-amber-hover transition-colors">
            Upgrade with UPI / Card
          </button>
        </div>

        {/* ELITE QUANT API */}
        <div className="p-4 bg-[#131618] hairline-border rounded space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <span className="text-zinc-200 font-bold block">ELITE QUANT API</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-white num">₹7,999</span>
                <span className="text-[10px] text-zinc-400">/ mo ($99)</span>
              </div>
              <span className="text-[10px] text-zinc-400">For algorithmic desks</span>
            </div>
            <ul className="space-y-2 text-[11px] text-zinc-400">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Everything in Pro</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Sub-50ms REST Analytics API</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Python SDK & Direct Parquet Access</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Delta Exchange India Custom Adapter</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 10,000 requests/day</li>
            </ul>
          </div>
          <button className="w-full py-1.5 hairline-border bg-[#1C2023] hover:text-white rounded font-bold">
            Contact Quant Sales
          </button>
        </div>
      </div>
    </div>
  );
}

