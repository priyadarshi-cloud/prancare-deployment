import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const members = db.prepare(`SELECT * FROM family_members ORDER BY name ASC`).all();
    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('API /api/family GET error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, stock_count, alert_on_missed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
    }

    if (status !== undefined) {
      db.prepare(`UPDATE family_members SET status = ? WHERE id = ?`).run(status, id);
    }
    if (stock_count !== undefined) {
      db.prepare(`UPDATE family_members SET stock_count = ? WHERE id = ?`).run(stock_count, id);
    }
    if (alert_on_missed !== undefined) {
      db.prepare(`UPDATE family_members SET alert_on_missed = ? WHERE id = ?`).run(alert_on_missed ? 1 : 0, id);
    }

    const updated = db.prepare(`SELECT * FROM family_members WHERE id = ?`).get(id);
    return NextResponse.json({ member: updated });
  } catch (error: any) {
    console.error('API /api/family POST error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
