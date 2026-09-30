import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Search by scan_id or verifications.id
    const row = db.prepare(`
      SELECT 
        v.id as verification_id,
        v.scan_id,
        v.status,
        v.primary_reason,
        v.confidence,
        v.checks_json,
        v.sources_json,
        v.is_demo,
        v.created_at,
        s.medicine_name,
        s.brand_name,
        s.active_ingredients,
        s.manufacturer,
        s.batch_number,
        s.manufacturing_date,
        s.expiry_date,
        s.barcode,
        s.extraction_raw
      FROM verifications v
      JOIN scans s ON v.scan_id = s.id
      WHERE v.scan_id = ? OR v.id = ?
    `).get(id, id) as any;

    if (!row) {
      return NextResponse.json({ error: 'Verification report not found' }, { status: 404 });
    }

    return NextResponse.json({
      report: {
        id: row.verification_id,
        scanId: row.scan_id,
        status: row.status,
        primaryReason: row.primary_reason,
        confidence: row.confidence,
        checks: JSON.parse(row.checks_json || '[]'),
        sources: JSON.parse(row.sources_json || '[]'),
        isDemo: Boolean(row.is_demo),
        createdAt: row.created_at,
        medicine: {
          name: row.medicine_name,
          brand: row.brand_name,
          activeIngredients: JSON.parse(row.active_ingredients || '[]'),
          manufacturer: row.manufacturer,
          batchNumber: row.batch_number,
          mfgDate: row.manufacturing_date,
          expDate: row.expiry_date,
          barcode: row.barcode
        },
        extraction: JSON.parse(row.extraction_raw || '{}')
      }
    });
  } catch (error: any) {
    console.error('API /api/report/[id] error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
