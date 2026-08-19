import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { deleteStorageFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    const data: any = {};
    let category_id: string | null = null;

    if (isJson) {
      const body = await req.json();
      if (body.title !== undefined) data.title = body.title;
      if (body.description !== undefined) data.description = body.description;
      if (body.source_type !== undefined) data.source_type = body.source_type;
      if (body.file_path !== undefined) data.file_path = body.file_path;
      if (body.embed_url !== undefined) data.embed_url = body.embed_url;
      if (body.thumbnail_path !== undefined) data.thumbnail_path = body.thumbnail_path;
      if (body.format !== undefined) data.format = body.format;
      if (body.is_free !== undefined) data.is_free = Boolean(body.is_free);
      if (body.downloadable !== undefined) data.downloadable = Boolean(body.downloadable);
      if (body.position !== undefined) data.position = Number(body.position);
      if (body.duration_seconds !== undefined) data.duration_seconds = body.duration_seconds === null ? null : Number(body.duration_seconds);
      category_id = body.category_id || null;
    } else {
      const formData = await req.formData();
      const title = formData.get('title');
      const description = formData.get('description');
      const source_type = formData.get('source_type');
      const file_path = formData.get('file_path');
      const embed_url = formData.get('embed_url');
      const thumbnail_path = formData.get('thumbnail_path');
      const format = formData.get('format');
      const is_free = formData.get('is_free');
      const downloadable = formData.get('downloadable');
      const position = formData.get('position');
      const duration_seconds = formData.get('duration_seconds');
      category_id = (formData.get('category_id') as string) || (formData.get('categoryId') as string) || null;

      if (title !== null) data.title = (title as string).trim();
      if (description !== null) data.description = (description as string).trim() || null;
      if (source_type !== null) data.source_type = source_type;
      if (file_path !== null) data.file_path = (file_path as string).trim() || null;
      if (embed_url !== null) data.embed_url = (embed_url as string).trim() || null;
      if (thumbnail_path !== null) data.thumbnail_path = (thumbnail_path as string).trim() || null;
      if (format !== null) data.format = format;
      if (is_free !== null) data.is_free = is_free === 'true' || is_free === 'on';
      if (downloadable !== null) data.downloadable = downloadable === 'true' || downloadable === 'on';
      if (position !== null) data.position = Number(position);
      if (duration_seconds !== null) data.duration_seconds = Number(duration_seconds);
    }

    if (data.file_path !== undefined) {
      const existingVideo = await prisma.courseVideo.findUnique({
        where: { id },
        select: { file_path: true },
      });
      if (existingVideo?.file_path && existingVideo.file_path !== data.file_path) {
        await deleteStorageFile(existingVideo.file_path);
      }
    }

    const updatedVideo = await prisma.courseVideo.update({
      where: { id },
      data,
    });

    if (!isJson) {
      const redirectTarget = category_id ? `/admin/categories/${category_id}` : '/admin/categories';
      return NextResponse.redirect(new URL(redirectTarget, req.url), 303);
    }

    return NextResponse.json({ video: updatedVideo });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteParams) {
  return PATCH(req, context);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const video = await prisma.courseVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Delete storage files (file_path and thumbnail_path)
    if (video.file_path) {
      await deleteStorageFile(video.file_path);
    }
    if (video.thumbnail_path) {
      await deleteStorageFile(video.thumbnail_path);
    }

    await prisma.courseVideo.delete({
      where: { id },
    });

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/admin/categories', req.url), 303);
    }

    return NextResponse.json({ success: true, message: 'Video record and storage files deleted' });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
