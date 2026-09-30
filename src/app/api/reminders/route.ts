import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const reminders = db.prepare(`SELECT * FROM reminders ORDER BY created_at DESC`).all();
    return NextResponse.json({ reminders });
  } catch (error: any) {
    console.error('API /api/reminders GET error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patient_name, medicine, dose, times, frequency, stock_count } = body;

    const id = `rem_${Date.now()}`;
    const timesJson = JSON.stringify(times || ['08:00 AM', '08:00 PM']);

    db.prepare(`
      INSERT INTO reminders (id, patient_name, medicine, dose, times_json, frequency, stock_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      patient_name || 'Family Member',
      medicine || 'Prescribed Medicine',
      dose || '1 Tablet',
      timesJson,
      frequency || 'Daily',
      stock_count || 10
    );

    const created = db.prepare(`SELECT * FROM reminders WHERE id = ?`).get(id);
    return NextResponse.json({ reminder: created });
  } catch (error: any) {
    console.error('API /api/reminders POST error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
