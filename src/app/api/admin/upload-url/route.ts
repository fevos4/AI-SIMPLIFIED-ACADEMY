import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generatePresignedPutUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getSession(req);

    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const headerContentType = req.headers.get('content-type') || '';
    const isJson = headerContentType.includes('application/json');

    let fileName = '';
    let contentType = 'application/octet-stream';

    if (isJson) {
      const body = await req.json();
      fileName = body.fileName || body.filename || '';
      contentType = body.contentType || 'application/octet-stream';
    } else {
      const formData = await req.formData();
      fileName = (formData.get('fileName') as string) || (formData.get('filename') as string) || '';
      contentType = (formData.get('contentType') as string) || 'application/octet-stream';
    }

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const objectKey = `uploads/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const uploadUrl = await generatePresignedPutUrl(objectKey, contentType, 3600);

    return NextResponse.json({
      uploadUrl,
      objectKey,
    });
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
