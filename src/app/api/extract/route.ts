import { NextRequest, NextResponse } from 'next/server';
import { extractMedicineData } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const images: string[] = body.images || [];
    const demoHint: string | undefined = body.demoHint;

    if (!images.length && !demoHint) {
      return NextResponse.json(
        { error: 'No image or demoHint provided' },
        { status: 400 }
      );
    }

    const extraction = await extractMedicineData(images, demoHint);
    return NextResponse.json({ extraction });
  } catch (error: any) {
    console.error('API /api/extract error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to extract text from packaging' },
      { status: 500 }
    );
  }
}
