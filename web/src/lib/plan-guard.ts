import { NextRequest, NextResponse } from 'next/server';

export interface PlanUser {
  userId: string;
  plan: 'free' | 'pro' | 'elite';
  queriesToday: number;
}

// In a full deployment, this reads from Neon / Supabase session token
// For local/demo mode, read from session header or default to Pro/Free
export function getRequestUser(req: NextRequest): PlanUser {
  const planHeader = req.headers.get('x-user-plan') || 'pro'; // default to pro for full preview
  const userId = req.headers.get('x-user-id') || 'usr_terminal_demo';
  return {
    userId,
    plan: planHeader === 'free' ? 'free' : 'pro',
    queriesToday: 1,
  };
}

export function validateFeatureAccess(
  user: PlanUser,
  feature: 'heatmap' | 'strike_finder' | 'distance_calc' | 'sl_planner' | 'backtest' | 'export',
  params?: { hold_min?: number; from_year?: number }
): { allowed: boolean; reason?: string } {
  if (user.plan === 'pro' || user.plan === 'elite') {
    return { allowed: true };
  }

  // Free Tier constraints:
  if (feature === 'strike_finder' || feature === 'backtest' || feature === 'export') {
    return {
      allowed: false,
      reason: `The ${feature.replace('_', ' ').toUpperCase()} engine is available on the Pro plan. Free tier includes Safety Heatmap and Distance Calculator.`
    };
  }

  if (params?.hold_min && params.hold_min !== 360) {
    return {
      allowed: false,
      reason: `Free tier is restricted to 6h hold (360m). Pro plan unlocks all 8 hold horizons (1h to 24h).`
    };
  }

  if (params?.from_year && params.from_year < 2024) {
    return {
      allowed: false,
      reason: `Free tier is restricted to recent 2024-2026 history. Pro plan unlocks the full 9-year dataset (2017-2026).`
    };
  }

  return { allowed: true };
}

