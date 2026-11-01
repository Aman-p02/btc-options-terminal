import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAnalytics } from '@/lib/api-client';
import { getRequestUser, validateFeatureAccess } from '@/lib/plan-guard';
import { z } from 'zod';

const StrikeFinderSchema = z.object({
  spot: z.number().positive(),
  hold_min: z.number().int().default(360),
  side: z.enum(['call', 'put', 'both']).default('call'),
  max_touch_prob: z.number().min(0.1).max(50.0).default(5.0),
  min_premium: z.number().min(0).default(25.0),
  iv: z.number().positive().default(0.45),
  from_year: z.number().int().min(2017).max(2026).default(2024),
  to_year: z.number().int().min(2017).max(2026).default(2026),
  tz_offset_min: z.number().int().default(330),
  max_7d_vol: z.number().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = StrikeFinderSchema.parse(json);

    const user = getRequestUser(req);
    const access = validateFeatureAccess(user, 'strike_finder');
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason, requiresUpgrade: true }, { status: 403 });
    }

    const data = await fetchFromAnalytics('/api/strike-finder', {
      method: 'POST',
      body: parsed,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 400 });
  }
}

