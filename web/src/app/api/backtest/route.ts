import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAnalytics } from '@/lib/api-client';
import { getRequestUser, validateFeatureAccess } from '@/lib/plan-guard';
import { z } from 'zod';

const BacktestSchema = z.object({
  strategy: z.enum(['sell_call', 'sell_put', 'strangle']).default('strangle'),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  hour: z.number().int().min(0).max(23).nullable().optional(),
  minute: z.number().int().default(0),
  hold_min: z.number().int().default(360),
  call_dist_pct: z.number().positive().default(2.5),
  put_dist_pct: z.number().positive().default(2.5),
  sl_mode: z.enum(['spot_pct', 'premium_multiple']).default('spot_pct'),
  sl_threshold: z.number().positive().default(1.5),
  iv: z.number().positive().default(0.45),
  regime_filter: z.boolean().default(false),
  max_7d_vol: z.number().nullable().optional(),
  train_years: z.array(z.number()).length(2).default([2017, 2023]),
  test_years: z.array(z.number()).length(2).default([2024, 2026]),
  tz_offset_min: z.number().int().default(330),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = BacktestSchema.parse(json);

    const user = getRequestUser(req);
    const access = validateFeatureAccess(user, 'backtest');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason, requiresUpgrade: true }, { status: 403 });
    }

    const data = await fetchFromAnalytics('/api/backtest', {
      method: 'POST',
      body: parsed,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 400 });
  }
}

