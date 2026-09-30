import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const facilitiesCount = (db.prepare('SELECT COUNT(*) as c FROM supply_facilities').get() as { c: number }).c;
    const inventoryCount = (db.prepare('SELECT COUNT(*) as c FROM supply_inventory').get() as { c: number }).c;

    const statusCounts = db.prepare(`
      SELECT stock_status, COUNT(*) as count
      FROM supply_inventory
      GROUP BY stock_status
    `).all() as Array<{ stock_status: string; count: number }>;

    let criticalCount = 0;
    let warningCount = 0;
    let adequateCount = 0;
    let surplusCount = 0;

    for (const row of statusCounts) {
      if (row.stock_status === 'CRITICAL') criticalCount = row.count;
      else if (row.stock_status === 'WARNING') warningCount = row.count;
      else if (row.stock_status === 'ADEQUATE') adequateCount = row.count;
      else if (row.stock_status === 'SURPLUS') surplusCount = row.count;
    }

    const activeRedistCount = (
      db.prepare(`
        SELECT COUNT(*) as c FROM supply_redistributions
        WHERE status IN ('PROPOSED', 'APPROVED', 'IN_TRANSIT')
      `).get() as { c: number }
    ).c;

    // Critical urgent alerts
    const criticalAlerts = db.prepare(`
      SELECT 
        i.id, i.medicine_name, i.category, i.current_stock, i.days_of_supply,
        i.daily_consumption_rate, i.expiry_date,
        f.name as facility_name, f.district, f.tier
      FROM supply_inventory i
      JOIN supply_facilities f ON i.facility_id = f.id
      WHERE i.stock_status = 'CRITICAL'
      ORDER BY i.days_of_supply ASC
      LIMIT 8
    `).all();

    // District level aggregated metrics
    const districtSummary = db.prepare(`
      SELECT 
        f.district,
        f.state,
        COUNT(DISTINCT f.id) as facility_count,
        SUM(CASE WHEN i.stock_status = 'CRITICAL' THEN 1 ELSE 0 END) as critical_items,
        SUM(CASE WHEN i.stock_status = 'WARNING' THEN 1 ELSE 0 END) as warning_items,
        SUM(CASE WHEN i.stock_status = 'SURPLUS' THEN 1 ELSE 0 END) as surplus_items,
        COUNT(i.id) as total_items
      FROM supply_facilities f
      LEFT JOIN supply_inventory i ON f.id = i.facility_id
      GROUP BY f.district, f.state
      ORDER BY critical_items DESC
    `).all();

    // Active redistributions
    const activeRedistributions = db.prepare(`
      SELECT 
        r.*,
        sf.name as source_name, sf.district as source_district, sf.tier as source_tier,
        tf.name as target_name, tf.district as target_district, tf.tier as target_tier
      FROM supply_redistributions r
      JOIN supply_facilities sf ON r.source_facility_id = sf.id
      JOIN supply_facilities tf ON r.target_facility_id = tf.id
      ORDER BY 
        CASE r.urgency WHEN 'CRITICAL' THEN 1 ELSE 2 END,
        r.created_at DESC
    `).all();

    return NextResponse.json({
      summary: {
        totalFacilities: facilitiesCount,
        totalSkus: inventoryCount,
        criticalCount,
        warningCount,
        adequateCount,
        surplusCount,
        activeRedistributions: activeRedistCount,
      },
      criticalAlerts,
      districtSummary,
      activeRedistributions,
      label: 'Demo data — synthetic district/facility supply data',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('API /api/health-system/overview error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load supply overview' },
      { status: 500 }
    );
  }
}
