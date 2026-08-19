import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedGetUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    const url = await generatePresignedGetUrl(path, 3600);
    return NextResponse.redirect(url, 307);
  } catch (error) {
    console.error('Error generating presigned GET URL:', error);
    return NextResponse.json({ error: 'Failed to generate image URL' }, { status: 500 });
  }
}
