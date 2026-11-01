import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAnalytics } from '@/lib/api-client';

export async function GET(req: NextRequest) {
  try {
    const tzOffset = req.nextUrl.searchParams.get('tz_offset_min') || '330';
    const data = await fetchFromAnalytics(`/api/live/ticker?tz_offset_min=${tzOffset}`, {
      method: 'GET',
      revalidate: 10,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

