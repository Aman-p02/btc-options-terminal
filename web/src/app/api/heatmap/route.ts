import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAnalytics } from '@/lib/api-client';
import { getRequestUser, validateFeatureAccess } from '@/lib/plan-guard';
import { z } from 'zod';

const HeatmapSchema = z.object({
  hold_min: z.number().int().default(360),
  side: z.enum(['call', 'put', 'both']).default('call'),
  strike_distance_pct: z.number().min(0.1).max(50.0).default(2.5),
  from_year: z.number().int().min(2017).max(2026).default(2024),
  to_year: z.number().int().min(2017).max(2026).default(2026),
  metric: z.enum(['touch_prob', 'median_range', 'p95_range', 'worst_case']).default('touch_prob'),
  grid_resolution: z.enum(['hour', '15min']).default('hour'),
  tz_offset_min: z.number().int().default(330),
  max_7d_vol: z.number().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = HeatmapSchema.parse(json);

    const user = getRequestUser(req);
    const access = validateFeatureAccess(user, 'heatmap', {
      hold_min: parsed.hold_min,
      from_year: parsed.from_year,
    });

    if (!access.allowed) {
      return NextResponse.json({ error: access.reason, requiresUpgrade: true }, { status: 403 });
    }

    const data = await fetchFromAnalytics('/api/heatmap', {
      method: 'POST',
      body: parsed,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 400 });
  }
}

