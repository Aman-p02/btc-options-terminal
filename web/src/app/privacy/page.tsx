import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0D0E] text-[#EDEDED] font-mono text-xs p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between hairline-b pb-4">
        <Link href="/" className="flex items-center gap-2 text-amber hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Research Terminal</span>
        </Link>
        <span className="text-[10px] text-zinc-400">PRIVACY POLICY</span>
      </div>

      <div className="space-y-4 text-zinc-300 leading-relaxed text-xs">
        <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
        <p className="text-zinc-400 text-xs">Effective: November 2026</p>

        <p>
          We value your privacy. We collect only the minimum information necessary to authenticate your account and securely process subscriptions.
        </p>

        <div className="p-3 bg-[#131618] hairline-border rounded space-y-2">
          <h2 className="font-bold text-amber">1. Information We Collect</h2>
          <p>
            - Account data: Email address and authentication provider IDs (via Clerk or Supabase Auth).<br />
            - Billing telemetry: Payment transaction references processed by Razorpay and Stripe. We never store credit card numbers or UPI PINs on our servers.<br />
            - Research telemetry: Query metrics aggregated anonymously to enforce fair usage limits.
          </p>
        </div>

        <div className="p-3 bg-[#131618] hairline-border rounded space-y-2">
          <h2 className="font-bold text-amber">2. Zero Sale of Data</h2>
          <p>
            We do not sell, rent, or monetize your research setups or personal information to third-party data brokers or marketing agencies.
          </p>
        </div>
      </div>
    </div>
  );
}

