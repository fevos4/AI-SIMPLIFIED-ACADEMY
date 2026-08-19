import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

import { formatEmbedUrl } from '@/lib/video-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId parameter is required' }, { status: 400 });
    }

    const videos = await prisma.courseVideo.findMany({
      where: { lesson_id: lessonId },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Resolve active admin user in DB
    let user = session.userId ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
    if (!user && session.email) {
      user = await prisma.user.findUnique({ where: { email: session.email } });
    }

    if (!user) {
      return NextResponse.json({ error: 'Admin account not found in database. Please log in again.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let lesson_id = '';
    let category_id = '';
    let title = '';
    let description = '';
    let source_type = 'self_hosted';
    let file_path = '';
    let embed_url = '';
    let thumbnail_path = '';
    let format = 'landscape';
    let is_free = false;
    let downloadable = false;
    let position: any = null;
    let duration_seconds: any = null;

    if (isJson) {
      const body = await req.json();
      lesson_id = body.lesson_id || body.lessonId || '';
      category_id = body.category_id || body.categoryId || '';
      title = body.title || '';
      description = body.description || '';
      source_type = body.source_type || body.sourceType || 'self_hosted';
      file_path = body.file_path || body.filePath || '';
      embed_url = body.embed_url || body.embedUrl || '';
      thumbnail_path = body.thumbnail_path || body.thumbnailPath || '';
      format = body.format || 'landscape';
      is_free = Boolean(body.is_free ?? body.isFree);
      downloadable = Boolean(body.downloadable);
      position = body.position;
      duration_seconds = body.duration_seconds ?? body.durationSeconds;
    } else {
      const formData = await req.formData();
      lesson_id = (formData.get('lesson_id') as string) || (formData.get('lessonId') as string) || '';
      category_id = (formData.get('category_id') as string) || (formData.get('categoryId') as string) || '';
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      source_type = (formData.get('source_type') as string) || 'self_hosted';
      file_path = (formData.get('file_path') as string) || '';
      embed_url = (formData.get('embed_url') as string) || '';
      thumbnail_path = (formData.get('thumbnail_path') as string) || '';
      format = (formData.get('format') as string) || 'landscape';
      is_free = formData.get('is_free') === 'true' || formData.get('is_free') === 'on';
      downloadable = formData.get('downloadable') === 'true' || formData.get('downloadable') === 'on';
      position = formData.get('position');
      duration_seconds = formData.get('duration_seconds');
    }

    if (!lesson_id || !title || !source_type) {
      if (!isJson) {
        return NextResponse.redirect(new URL(`/admin/categories?error=Title+and+lesson+required`, req.url), 303);
      }
      return NextResponse.json({ error: 'lesson_id, title, and source_type are required' }, { status: 400 });
    }

    if (source_type === 'self_hosted' && !file_path) {
      if (!isJson) {
        return NextResponse.redirect(new URL(`/admin/categories?error=File+path+required`, req.url), 303);
      }
      return NextResponse.json({ error: 'file_path is required for self_hosted video' }, { status: 400 });
    }

    if (source_type === 'embed' && !embed_url) {
      if (!isJson) {
        return NextResponse.redirect(new URL(`/admin/categories?error=Embed+URL+required`, req.url), 303);
      }
      return NextResponse.json({ error: 'embed_url is required for embed video' }, { status: 400 });
    }

    let pos = position;
    if (pos === undefined || pos === null || pos === '') {
      const maxVid = await prisma.courseVideo.findFirst({
        where: { lesson_id },
        orderBy: { position: 'desc' },
      });
      pos = maxVid ? maxVid.position + 1 : 1;
    }

    const video = await prisma.courseVideo.create({
      data: {
        lesson_id,
        title: title.trim(),
        description: description.trim() || null,
        source_type: source_type as any,
        file_path: file_path.trim() || null,
        embed_url: embed_url ? formatEmbedUrl(embed_url) : null,
        thumbnail_path: thumbnail_path.trim() || null,
        format: format as any,
        is_free: Boolean(is_free),
        downloadable: Boolean(downloadable),
        position: Number(pos),
        duration_seconds: duration_seconds ? Number(duration_seconds) : null,
        uploaded_by: user.id,
      },
    });

    if (!isJson) {
      const redirectTarget = category_id ? `/admin/categories/${category_id}` : '/admin/categories';
      return NextResponse.redirect(new URL(redirectTarget, req.url), 303);
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
  }
}
