'use client';

import React from 'react';
import { ShieldCheck, Check, Zap, CreditCard, Sparkles, X } from 'lucide-react';

interface PlanGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export const PlanGateModal: React.FC<PlanGateModalProps> = ({
  isOpen,
  onClose,
  reason,
}) => {
  if (!isOpen) return null;

  const handleCheckout = (gateway: 'razorpay' | 'stripe', plan: 'pro' | 'elite') => {
    alert(`Initiating secure ${gateway.toUpperCase()} checkout for ${plan.toUpperCase()} Terminal Access...`);
    // In production, redirects to Razorpay Standard Checkout or Stripe Hosted Checkout
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-xs">
      <div className="bg-[var(--bg-surface)] hairline-border rounded max-w-xl w-full p-5 space-y-4">
        <div className="flex items-center justify-between hairline-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber" />
            <span className="font-bold text-sm text-[var(--text-primary)]">TERMINAL MEMBERSHIP PLANS</span>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {reason && (
          <div className="p-2.5 bg-amber/10 hairline-border border-amber/40 text-amber rounded text-[11px]">
            <b>Pro Feature Required:</b> {reason}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Pro Plan */}
          <div className="p-4 bg-[var(--bg-subtle)] hairline-border rounded space-y-3 relative border-amber/50">
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber text-black text-[9px] font-bold rounded">
              MOST POPULAR
            </div>
            <div>
              <span className="text-amber font-bold text-sm block">PRO RESEARCHER</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[var(--text-primary)] num">₹2,499</span>
                <span className="text-[10px] text-[var(--text-muted)]">/ month ($29)</span>
              </div>
            </div>

            <ul className="space-y-1.5 text-[11px] text-zinc-300">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Full 9-Year Dataset (2017-2026)</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> All 8 Hold Horizons (1h to 24h)</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Strike Finder Scanner</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Full Strategy Backtester</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Regime Filter & Out-Of-Sample</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited PDF & CSV Exports</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Telegram & Email Alerts</li>
            </ul>

            <div className="space-y-1.5 pt-2">
              <button
                onClick={() => handleCheckout('razorpay', 'pro')}
                className="w-full py-1.5 bg-amber text-black font-semibold rounded hover:bg-amber-hover transition-colors flex items-center justify-center gap-1 text-[11px]"
              >
                <span>Pay with UPI / Cards (Razorpay)</span>
              </button>
              <button
                onClick={() => handleCheckout('stripe', 'pro')}
                className="w-full py-1 hairline-border bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white rounded text-[10px]"
              >
                Pay with International Card (Stripe)
              </button>
            </div>
          </div>

          {/* Elite Plan */}
          <div className="p-4 bg-[var(--bg-subtle)] hairline-border rounded space-y-3">
            <div>
              <span className="text-zinc-200 font-bold text-sm block">ELITE QUANT API</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[var(--text-primary)] num">₹7,999</span>
                <span className="text-[10px] text-[var(--text-muted)]">/ month ($99)</span>
              </div>
            </div>

            <ul className="space-y-1.5 text-[11px] text-zinc-300">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Everything in Pro Plan</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Direct High-Speed REST API Access</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Python SDK & Webhook Ingestion</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 10,000 API calls / day</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Custom Delta Exchange India adapter</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Dedicated Quant Support channel</li>
            </ul>

            <div className="space-y-1.5 pt-2">
              <button
                onClick={() => handleCheckout('razorpay', 'elite')}
                className="w-full py-1.5 hairline-border bg-[var(--border-color)] text-[var(--text-primary)] font-semibold rounded hover:bg-zinc-700 transition-colors text-[11px]"
              >
                <span>Upgrade to Elite API</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-[9px] text-[var(--text-muted)] text-center pt-1">
          Razorpay supports UPI (GPay, PhonePe, Paytm), RuPay, and all major Indian banks. All subscriptions can be cancelled at any time from your account settings.
        </p>
      </div>
    </div>
  );
};

