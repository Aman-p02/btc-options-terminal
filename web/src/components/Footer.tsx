'use client';

import React from 'react';
import Link from 'next/link';
import { Locale, translations } from '@/lib/i18n';
import { ShieldAlert } from 'lucide-react';

interface FooterProps {
  locale: Locale;
}

export const Footer: React.FC<FooterProps> = ({ locale }) => {
  const t = translations[locale];

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-5 text-xs font-mono text-[var(--text-muted)] space-y-4">
      <div className="max-w-[1650px] mx-auto space-y-4">
        {/* Risk Notice & Regulatory Statement */}
        <div className="flex flex-col sm:flex-row items-start gap-3 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[11px] leading-relaxed shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <p className="font-bold text-[var(--text-primary)] tracking-wide">
              STATISTICAL RESEARCH NOTICE & REGULATORY DISCLAIMER
            </p>
            <p className="text-zinc-300">{t.disclaimerFooter}</p>
            <p className="text-[10px] text-zinc-400">
              <strong className="text-zinc-300">Binance Data Terms & Compliance:</strong> Historical data is derived from Binance Spot public market tick records (2017-2026). Options pricing uses theoretical Black-Scholes formulas (r=0) without spread slippage. Users in India and international jurisdictions must review applicable financial regulations prior to deploying live capital.
            </p>
          </div>
        </div>

        {/* Navigation Links and Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] pt-1">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-zinc-400">
            <Link href="/methodology" className="hover:text-amber transition-colors">
              Methodology & Formulas
            </Link>
            <span className="hidden sm:inline text-zinc-600">·</span>
            <Link href="/pricing" className="hover:text-amber transition-colors">
              Terminal Plans
            </Link>
            <span className="hidden sm:inline text-zinc-600">·</span>
            <Link href="/risk" className="hover:text-amber transition-colors">
              Risk Disclosure
            </Link>
            <span className="hidden sm:inline text-zinc-600">·</span>
            <Link href="/terms" className="hover:text-amber transition-colors">
              Terms of Service
            </Link>
            <span className="hidden sm:inline text-zinc-600">·</span>
            <Link href="/privacy" className="hover:text-amber transition-colors">
              Privacy Policy
            </Link>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span>Data As-Of: <strong className="text-zinc-300">2026-10-31 UTC</strong></span>
            <span>•</span>
            <span>Engine: <strong className="text-emerald-400">DuckDB 2.0.0 Fast Analytics</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
};
