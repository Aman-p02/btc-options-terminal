import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0D0E] text-[#EDEDED] font-mono text-xs p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between hairline-b pb-4">
        <Link href="/" className="flex items-center gap-2 text-amber hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Research Terminal</span>
        </Link>
        <span className="text-[10px] text-zinc-400">TERMS OF SERVICE</span>
      </div>

      <div className="space-y-4 text-zinc-300 leading-relaxed text-xs">
        <h1 className="text-xl font-bold text-white">Terms of Service</h1>
        <p className="text-zinc-400 text-xs">Effective: November 2026</p>

        <p>
          By accessing or using this BTC Options Research Terminal, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
        </p>

        <div className="p-3 bg-[#131618] hairline-border rounded space-y-2">
          <h2 className="font-bold text-amber">1. Intellectual Property & Fair Use</h2>
          <p>
            The software architecture, precomputed analytical data structures, and statistical visualization algorithms are proprietary. You may not scrape, reverse-engineer, or resell the raw data streams without an Elite API commercial license.
          </p>
        </div>

        <div className="p-3 bg-[#131618] hairline-border rounded space-y-2">
          <h2 className="font-bold text-amber">2. Subscriptions, Upgrades & Cancellations</h2>
          <p>
            Pro and Elite subscriptions renew automatically via Razorpay or Stripe unless cancelled prior to the end of the current billing cycle. You may cancel at any time from your account settings without penalty.
          </p>
        </div>

        <div className="p-3 bg-[#131618] hairline-border rounded space-y-2">
          <h2 className="font-bold text-amber">3. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, the creators, operators, and data providers disclaim all warranties and shall not be liable for any financial losses, lost profits, or damages arising from the use of this terminal.
          </p>
        </div>
      </div>
    </div>
  );
}

