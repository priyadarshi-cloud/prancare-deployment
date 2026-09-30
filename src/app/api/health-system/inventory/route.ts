import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const district = searchParams.get('district');
    const tier = searchParams.get('tier');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        i.*,
        f.name as facility_name, f.district, f.state, f.tier,
        f.contact_person, f.phone
      FROM supply_inventory i
      JOIN supply_facilities f ON i.facility_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (district && district !== 'ALL') {
      query += ` AND f.district = ?`;
      params.push(district);
    }

    if (tier && tier !== 'ALL') {
      query += ` AND f.tier = ?`;
      params.push(tier);
    }

    if (status && status !== 'ALL') {
      query += ` AND i.stock_status = ?`;
      params.push(status);
    }

    if (search && search.trim() !== '') {
      query += ` AND (i.medicine_name LIKE ? OR i.category LIKE ? OR i.batch_number LIKE ? OR f.name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY 
      CASE i.stock_status 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'WARNING' THEN 2 
        WHEN 'SURPLUS' THEN 3 
        ELSE 4 
      END,
      i.days_of_supply ASC
    `;

    const items = db.prepare(query).all(...params);

    // Get filter options
    const districts = db.prepare(`SELECT DISTINCT district FROM supply_facilities ORDER BY district`).all() as Array<{ district: string }>;
    const tiers = ['DH', 'CHC', 'PHC'];
    const statuses = ['CRITICAL', 'WARNING', 'ADEQUATE', 'SURPLUS'];

    return NextResponse.json({
      items,
      count: items.length,
      filters: {
        districts: districts.map(d => d.district),
        tiers,
        statuses,
      },
      label: 'Demo data — synthetic district/facility supply data',
    });
  } catch (error: any) {
    console.error('API /api/health-system/inventory error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load inventory' },
      { status: 500 }
    );
  }
}
