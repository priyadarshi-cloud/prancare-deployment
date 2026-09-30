import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { filterAggregateCellsByKAnonymity, CellAggregate } from '@/lib/geo';

export async function GET() {
  try {
    const rows = db.prepare(`
      SELECT geo_cell, status
      FROM aggregate_events
    `).all() as Array<{ geo_cell: string; status: string }>;

    const cellMap = filterAggregateCellsByKAnonymity(rows, 5);
    const cells: CellAggregate[] = Array.from(cellMap.values());

    let totalScans = 0;
    let verifiedCount = 0;
    let needsVerificationCount = 0;
    let suspiciousCount = 0;

    for (const cell of cells) {
      totalScans += cell.total;
      verifiedCount += cell.verified;
      needsVerificationCount += cell.needsVerification;
      suspiciousCount += cell.suspicious;
    }

    return NextResponse.json({
      cells,
      summary: {
        totalScans,
        verifiedCount,
        needsVerificationCount,
        suspiciousCount,
        cellsReportingCount: cells.length,
        kAnonymityThreshold: 5
      },
      isDemo: process.env.DEMO_MODE !== 'false'
    });
  } catch (error: any) {
    console.error('API /api/map error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load map data' },
      { status: 500 }
    );
  }
}
