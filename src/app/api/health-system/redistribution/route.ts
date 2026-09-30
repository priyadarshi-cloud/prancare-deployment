import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const recommendations = db.prepare(`
      SELECT 
        r.*,
        sf.name as source_name, sf.district as source_district, sf.state as source_state, sf.tier as source_tier,
        tf.name as target_name, tf.district as target_district, tf.state as target_state, tf.tier as target_tier
      FROM supply_redistributions r
      JOIN supply_facilities sf ON r.source_facility_id = sf.id
      JOIN supply_facilities tf ON r.target_facility_id = tf.id
      ORDER BY 
        CASE r.status 
          WHEN 'PROPOSED' THEN 1 
          WHEN 'APPROVED' THEN 2 
          WHEN 'IN_TRANSIT' THEN 3 
          ELSE 4 
        END,
        CASE r.urgency WHEN 'CRITICAL' THEN 1 ELSE 2 END
    `).all();

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
      label: 'Demo data — synthetic district/facility supply data',
    });
  } catch (error: any) {
    console.error('API /api/health-system/redistribution error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load redistributions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nextStatus } = body;

    if (!id || !nextStatus) {
      return NextResponse.json(
        { error: 'id and nextStatus are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PROPOSED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED'];
    if (!validStatuses.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Invalid status: ${nextStatus}` },
        { status: 400 }
      );
    }

    const update = db.prepare(`
      UPDATE supply_redistributions
      SET status = ?
      WHERE id = ?
    `).run(nextStatus, id);

    if (update.changes === 0) {
      return NextResponse.json(
        { error: `Transfer order ${id} not found` },
        { status: 404 }
      );
    }

    const updatedRecord = db.prepare(`
      SELECT 
        r.*,
        sf.name as source_name, sf.district as source_district, sf.tier as source_tier,
        tf.name as target_name, tf.district as target_district, tf.tier as target_tier
      FROM supply_redistributions r
      JOIN supply_facilities sf ON r.source_facility_id = sf.id
      JOIN supply_facilities tf ON r.target_facility_id = tf.id
      WHERE r.id = ?
    `).get(id);

    return NextResponse.json({
      success: true,
      updatedRecord,
      isSimulatedAction: true,
      simulationNotice: 'Prototype demonstration only: Stock redistribution order status updated. No real government inventory or physical medicine dispatch was executed.',
      label: 'Demo data — synthetic district/facility supply data',
    });
  } catch (error: any) {
    console.error('API /api/health-system/redistribution POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update transfer status' },
      { status: 500 }
    );
  }
}
