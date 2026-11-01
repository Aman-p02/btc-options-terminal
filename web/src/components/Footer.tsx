'use client';

import React from 'react';
import Link from 'next/link';
import { Locale, translations } from '@/lib/i18n';
import {
  ShieldAlert,
  FileText,
  DollarSign,
  AlertTriangle,
  Scale,
  Lock,
  ArrowUpRight,
  Database,
  Cpu
} from 'lucide-react';

interface FooterProps {
  locale: Locale;
}

export const Footer: React.FC<FooterProps> = ({ locale }) => {
  const t = translations[locale];

  const footerLinks = [
    { href: '/methodology', label: 'Methodology & Formulas', icon: FileText, tag: 'Black-Scholes & Wilson' },
    { href: '/pricing', label: 'Terminal Plans', icon: DollarSign, tag: 'Institutional' },
    { href: '/risk', label: 'Risk Disclosure', icon: AlertTriangle, tag: 'Options Hazards' },
    { href: '/terms', label: 'Terms of Service', icon: Scale, tag: 'Compliance' },
    { href: '/privacy', label: 'Privacy Policy', icon: Lock, tag: 'Data Safety' },
  ];

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-6 text-xs font-mono text-[var(--text-muted)] space-y-5">
      <div className="max-w-[1650px] mx-auto space-y-6">
        
        {/* Risk Notice & Regulatory Disclaimer Card */}
        <div className="flex flex-col sm:flex-row items-start gap-3.5 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[11px] leading-relaxed shadow-sm">
          <div className="p-2 rounded-lg bg-amber/10 border border-amber/30 shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)] tracking-wide text-xs">
                STATISTICAL RESEARCH NOTICE & REGULATORY DISCLAIMER
              </span>
              <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                STRICTLY EMPIRICAL
              </span>
            </div>
            <p className="text-zinc-300">{t.disclaimerFooter}</p>
            <p className="text-[10px] text-zinc-400">
              <strong className="text-zinc-300">Binance Data Terms & Compliance:</strong> Historical data is derived from Binance Spot public market tick records (2017-2026). Options pricing uses theoretical Black-Scholes formulas (r=0) without spread slippage. Users in India and international jurisdictions must review applicable financial regulations prior to deploying live capital.
            </p>
          </div>
        </div>

        {/* Interactive Clickable Links Navigation Cards */}
        <div>
          <div className="text-[10px] uppercase font-mono text-zinc-500 mb-2.5 px-1 tracking-wider">
            Terminal Resources & Documentation
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {footerLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] hover:border-amber/60 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 group-hover:border-amber/40 group-hover:text-amber text-zinc-400 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-amber transition-colors block">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                      {item.tag}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Engine & Data Status Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)] text-[11px]">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Binance Tick Archive: <strong className="text-zinc-200">292,031,464 Rows (2017-2026)</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              <Database className="w-3 h-3 text-amber" />
              <span>ZSTD Parquet (DuckDB 2.0)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)]">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>FastAPI $p95 &lt; 500ms</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
