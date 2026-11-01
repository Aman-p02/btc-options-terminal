import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAnalytics } from '@/lib/api-client';
import { getRequestUser, validateFeatureAccess } from '@/lib/plan-guard';
import { z } from 'zod';

const DistanceCalcSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().default(0),
  hold_min: z.number().int().default(360),
  side: z.enum(['call', 'put', 'both']).default('call'),
  strike_distance_pct: z.number().positive().default(2.5),
  spot: z.number().positive().nullable().optional(),
  tz_offset_min: z.number().int().default(330),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = DistanceCalcSchema.parse(json);

    const user = getRequestUser(req);
    const access = validateFeatureAccess(user, 'distance_calc', { hold_min: parsed.hold_min });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason, requiresUpgrade: true }, { status: 403 });
    }

    const data = await fetchFromAnalytics('/api/distance-calculator', {
      method: 'POST',
      body: parsed,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 400 });
  }
}

