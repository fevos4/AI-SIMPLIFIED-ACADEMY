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
      if (body.name !== undefined) data.name = body.name;
      if (body.description !== undefined) data.description = body.description;
      if (body.position !== undefined) data.position = Number(body.position);
      if (body.published !== undefined) data.published = Boolean(body.published);
      category_id = body.category_id || null;
    } else {
      const formData = await req.formData();
      const name = formData.get('name');
      const description = formData.get('description');
      const position = formData.get('position');
      const published = formData.get('published');
      category_id = (formData.get('category_id') as string) || (formData.get('categoryId') as string) || null;

      if (name !== null) data.name = (name as string).trim();
      if (description !== null) data.description = (description as string).trim() || null;
      if (position !== null) data.position = Number(position);
      if (published !== null) data.published = published === 'true' || published === 'on';
    }

    const updatedLesson = await prisma.courseLesson.update({
      where: { id },
      data,
    });

    if (!isJson) {
      const redirectTarget = category_id || updatedLesson.category_id ? `/admin/categories/${category_id || updatedLesson.category_id}` : '/admin/categories';
      return NextResponse.redirect(new URL(redirectTarget, req.url), 303);
    }

    return NextResponse.json({ lesson: updatedLesson });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
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

    const lesson = await prisma.courseLesson.findUnique({
      where: { id },
      include: { videos: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const category_id = lesson.category_id;

    // Clean up video storage files
    for (const video of lesson.videos) {
      if (video.file_path) await deleteStorageFile(video.file_path);
      if (video.thumbnail_path) await deleteStorageFile(video.thumbnail_path);
    }

    await prisma.courseLesson.delete({
      where: { id },
    });

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL(`/admin/categories/${category_id}`, req.url), 303);
    }

    return NextResponse.json({ success: true, message: 'Lesson and associated storage files deleted' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
