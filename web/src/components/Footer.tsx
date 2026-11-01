'use client';

import React from 'react';
import Link from 'next/link';
import { Locale, translations } from '@/lib/i18n';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface FooterProps {
  locale: Locale;
}

export const Footer: React.FC<FooterProps> = ({ locale }) => {
  const t = translations[locale];

  return (
    <footer className="hairline-t bg-[var(--bg-surface)] px-4 py-4 text-xs font-mono text-[var(--text-muted)] space-y-3">
      {/* Risk Notice & Regulatory Statement */}
      <div className="flex items-start gap-2.5 p-3 rounded hairline-border bg-[var(--bg-subtle)] text-[11px] leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-amber shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[var(--text-primary)]">
            STATISTICAL RESEARCH NOTICE & REGULATORY DISCLAIMER
          </p>
          <p>{t.disclaimerFooter}</p>
          <p className="text-[10px] text-zinc-400">
            <b>Binance Data Terms & Compliance:</b> Historical data is derived from Binance Spot public market tick records (2017-2026). Options pricing uses theoretical Black-Scholes formulas (r=0) without spread slippage. Users in India and international jurisdictions must review applicable financial regulations prior to deploying live capital.
          </p>
        </div>
      </div>

      {/* Navigation Links and Copyright */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-1">
        <div className="flex items-center gap-4">
          <Link href="/methodology" className="hover:text-amber transition-colors">
            Methodology & Formulas
          </Link>
          <Link href="/pricing" className="hover:text-amber transition-colors">
            Terminal Plans
          </Link>
          <Link href="/risk" className="hover:text-amber transition-colors">
            Risk Disclosure
          </Link>
          <Link href="/terms" className="hover:text-amber transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-amber transition-colors">
            Privacy Policy
          </Link>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span>Data As-Of: <b className="text-[var(--text-primary)]">2026-10-31 UTC</b></span>
          <span>•</span>
          <span>Engine: <b className="text-emerald-400">DuckDB 2.0.0 Fast Analytics</b></span>
        </div>
      </div>
    </footer>
  );
};

