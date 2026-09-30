import { NextRequest, NextResponse } from 'next/server';
import { checkInteractions } from '@/lib/safemix';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const medicines: string[] = body.medicines || [];

    if (!Array.isArray(medicines) || medicines.length < 2) {
      return NextResponse.json(
        { error: 'Please provide at least two medicines or herbs to check interactions.' },
        { status: 400 }
      );
    }

    const response = await checkInteractions(medicines);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('API /api/safemix error:', error);
    return NextResponse.json(
      { error: error?.message || 'Interaction check failed' },
      { status: 500 }
    );
  }
}
