import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeExtraction } from '@/lib/normalize';
import { classifyExtraction } from '@/lib/classify';
import { snapToCoarseCell } from '@/lib/geo';
import { GeminiExtraction } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const extraction: GeminiExtraction = body.extraction;
    const location: { lat: number; lng: number } | undefined = body.location;
    const scanId = body.scanId || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!extraction) {
      return NextResponse.json({ error: 'Missing extraction payload' }, { status: 400 });
    }

    const normalized = normalizeExtraction(extraction);
    const result = await classifyExtraction(extraction, normalized, scanId);

    // Persist scan in SQLite
    const insertScan = db.prepare(`
      INSERT INTO scans (
        id, user_id, image_refs, medicine_name, brand_name,
        active_ingredients, manufacturer, batch_number,
        manufacturing_date, expiry_date, barcode, extraction_raw
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertScan.run(
      scanId,
      body.userId || 'guest_user',
      JSON.stringify(body.images || ['demo-pack']),
      normalized.medicineName,
      normalized.brandName,
      JSON.stringify(normalized.activeIngredients),
      normalized.manufacturer,
      normalized.batchNumber,
      normalized.mfgDate?.raw || null,
      normalized.expDate?.raw || null,
      normalized.barcode,
      JSON.stringify(extraction)
    );

    // Persist verification in SQLite
    const insertVerification = db.prepare(`
      INSERT INTO verifications (
        id, scan_id, status, primary_reason, confidence,
        checks_json, sources_json, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertVerification.run(
      `ver_${scanId}`,
      scanId,
      result.status,
      result.primaryReason,
      result.confidence,
      JSON.stringify(result.checks),
      JSON.stringify(result.sources),
      result.isDemo ? 1 : 0
    );

    // If location is provided and opt-in is enabled, save aggregate event
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      const geoCell = snapToCoarseCell(location.lat, location.lng);
      const currentWeek = new Date().toISOString().substring(0, 10);
      const insertAggregate = db.prepare(`
        INSERT INTO aggregate_events (
          id, geo_cell, week, medicine_norm, manufacturer_norm, status, reason, is_synthetic
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertAggregate.run(
        `agg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        geoCell,
        currentWeek,
        normalized.medicineName || 'unknown',
        normalized.manufacturer || 'unknown',
        result.status,
        result.primaryReason,
        result.isDemo ? 1 : 0
      );
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('API /api/verify error:', error);
    return NextResponse.json(
      { error: error?.message || 'Classification failed' },
      { status: 500 }
    );
  }
}
