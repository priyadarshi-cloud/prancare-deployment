import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const district = searchParams.get('district');

    let query = `
      SELECT 
        fc.*,
        f.name as facility_name, f.district, f.state, f.tier
      FROM supply_forecasts fc
      JOIN supply_facilities f ON fc.facility_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (district && district !== 'ALL') {
      query += ` AND f.district = ?`;
      params.push(district);
    }

    query += ` ORDER BY fc.projected_deficit ASC`;

    const forecasts = db.prepare(query).all(...params);

    const totalProjectedDeficitUnits = forecasts.reduce((acc: number, curr: any) => {
      return acc + Math.abs(curr.projected_deficit || 0);
    }, 0);

    return NextResponse.json({
      forecasts,
      totalProjectedDeficitUnits,
      forecastPeriod: 'Next 30 Days (Predictive Model)',
      label: 'Demo data — synthetic district/facility supply data',
    });
  } catch (error: any) {
    console.error('API /api/health-system/forecasts error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load forecasts' },
      { status: 500 }
    );
  }
}
