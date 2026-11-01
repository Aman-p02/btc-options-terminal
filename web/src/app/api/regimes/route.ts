import { NextRequest, NextResponse } from 'next/server';
import { fetchFromAnalytics } from '@/lib/api-client';

export async function GET(req: NextRequest) {
  try {
    const data = await fetchFromAnalytics('/api/regimes', {
      method: 'GET',
      revalidate: 300,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

