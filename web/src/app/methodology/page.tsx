import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-[#0B0D0E] text-[#EDEDED] font-mono text-xs p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between hairline-b pb-4">
        <Link href="/" className="flex items-center gap-2 text-amber hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Research Terminal</span>
        </Link>
        <span className="text-[10px] text-zinc-400">MATHEMATICAL SPECIFICATION v1.0</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber" />
          <span>Methodology, Mathematical Definitions & Limits of the Model</span>
        </h1>
        <p className="text-zinc-400 text-sm">
          All statistics on this terminal are calculated deterministically from 292,031,464 raw Binance 1-second price ticks recorded between 2017-08-17 and 2026-10-31 UTC. No values are synthetic or simulated.
        </p>
      </div>

      {/* 1. Touch Definition */}
      <section className="p-4 bg-[#131618] hairline-border rounded space-y-2">
        <h2 className="text-sm font-bold text-amber">1. What is a "Touch"? (Strict 1-Second Definition)</h2>
        <p className="text-zinc-300 leading-relaxed">
          For any entry timestamp $t_0$ and holding horizon $H$ minutes (window $[t_0, t_0 + H]$):
        </p>
        <div className="p-2.5 bg-[#1C2023] rounded font-mono text-[11px] text-zinc-200">
          Max Up Excursion (%) = (max_high(window) - entry_open) / entry_open * 100<br />
          Max Down Excursion (%) = (entry_open - min_low(window)) / entry_open * 100
        </div>
        <p className="text-zinc-400 leading-relaxed">
          A <b>Touch</b> occurs if, at any single 1-second tick during the window, the price exceeded or equalled the strike distance $d$. We do <i>not</i> measure whether the option finished in-the-money at expiration; we measure continuous intra-candle breaches. This reflects the true stop-loss survival requirement for option sellers.
        </p>
      </section>

      {/* 2. Wilson Score Confidence Interval */}
      <section className="p-4 bg-[#131618] hairline-border rounded space-y-2">
        <h2 className="text-sm font-bold text-amber">2. Wilson 95% Score Confidence Interval</h2>
        <p className="text-zinc-300 leading-relaxed">
          Instead of naive normal approximations which collapse near 0% or 100%, we compute the exact Wilson score interval:
        </p>
        <div className="p-2.5 bg-[#1C2023] rounded font-mono text-[11px] text-zinc-200">
          p_center = (p_hat + z^2 / (2n)) / (1 + z^2 / n)<br />
          spread = (z / (1 + z^2 / n)) * sqrt((p_hat * (1 - p_hat) / n) + (z^2 / (4n^2)))
        </div>
        <p className="text-zinc-400 leading-relaxed">
          With $z = 1.95996$ for 95% confidence. This ensures that when a window shows 0% historical touches across $n=50$ instances, the upper bound honestly displays ~7.1%, alerting users to statistical uncertainty.
        </p>
      </section>

      {/* 3. Black-Scholes Theoretical Estimate */}
      <section className="p-4 bg-[#131618] hairline-border rounded space-y-2">
        <h2 className="text-sm font-bold text-amber">3. Black-Scholes Theoretical Premium (r = 0)</h2>
        <p className="text-zinc-300 leading-relaxed">
          Because crypto assets trade 24/7/365 without continuous dividend yields, time to expiration is annualized as T = hours / 8760. Premium estimates are computed under standard Black-Scholes with risk-free rate r = 0.0.
        </p>
        <p className="text-amber text-[11px]">
          <b>Notice:</b> Every premium display is labeled "theoretical estimate". In live trading, broker bid-ask spreads, orderbook slippage, and delta margin impact net real returns.
        </p>
      </section>

      {/* 4. Selection Bias Warning */}
      <section className="p-4 bg-[#131618] hairline-border rounded space-y-2 border-red-900/50">
        <h2 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>4. Selection Bias & Multiple Hypothesis Testing</span>
        </h2>
        <p className="text-zinc-300 leading-relaxed">
          When scanning across 168 weekly hours (or 672 15-minute slots), the top-ranked slot will inherently appear anomalously safe simply due to random variance. To combat this:
        </p>
        <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
          <li>We always display the full 9-year touch probability next to any recent period number.</li>
          <li>We mandate out-of-sample testing (Train on 2017-2023, Test on 2024-2026). If a pattern fails out-of-sample, it was an overfitted illusion.</li>
          <li>We display sample size $n$ and warn visibly whenever $n &lt; 100$.</li>
        </ul>
      </section>

      {/* 5. Limits of the Model */}
      <section className="p-4 bg-[#131618] hairline-border rounded space-y-2">
        <h2 className="text-sm font-bold text-zinc-200">5. Limits of Historical Excursion Models</h2>
        <p className="text-zinc-400 leading-relaxed">
          Historical patterns reflect past market microstructure, liquidity, and trading participants. Major macro regime changes, regulatory bans, protocol failures, or flash crashes may produce moves outside 9-year historical 99th percentiles.
        </p>
        <p className="text-zinc-400 leading-relaxed">
          Options selling carries asymmetric tail risk: losses can exceed initial collected premiums. Position sizing must never exceed capital tolerance.
        </p>
      </section>
    </div>
  );
}
