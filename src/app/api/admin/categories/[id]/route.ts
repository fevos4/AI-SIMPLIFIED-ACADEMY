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

    if (isJson) {
      const body = await req.json();
      if (body.name !== undefined) data.name = body.name;
      if (body.description !== undefined) data.description = body.description;
      if (body.price !== undefined) data.price = Number(body.price);
      if (body.coming_soon !== undefined) data.coming_soon = Boolean(body.coming_soon);
      if (body.position !== undefined) data.position = Number(body.position);
      if (body.cover_image_path !== undefined) data.cover_image_path = body.cover_image_path;
    } else {
      const formData = await req.formData();
      const name = formData.get('name');
      const description = formData.get('description');
      const price = formData.get('price');
      const coming_soon = formData.get('coming_soon');
      const position = formData.get('position');
      const cover_image_path = formData.get('cover_image_path');

      if (name !== null) data.name = (name as string).trim();
      if (description !== null) data.description = (description as string).trim() || null;
      if (price !== null) data.price = Number(price);
      if (coming_soon !== null) data.coming_soon = coming_soon === 'true' || coming_soon === 'on';
      if (position !== null) data.position = Number(position);
      if (cover_image_path !== null) data.cover_image_path = (cover_image_path as string).trim() || null;
    }

    if (data.cover_image_path !== undefined) {
      const existingCategory = await prisma.courseCategory.findUnique({
        where: { id },
        select: { cover_image_path: true },
      });
      if (existingCategory?.cover_image_path && existingCategory.cover_image_path !== data.cover_image_path) {
        await deleteStorageFile(existingCategory.cover_image_path);
      }
    }

    const updatedCategory = await prisma.courseCategory.update({
      where: { id },
      data,
    });

    if (!isJson) {
      return NextResponse.redirect(new URL('/admin/categories', req.url), 303);
    }

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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

    const category = await prisma.courseCategory.findUnique({
      where: { id },
      include: {
        lessons: {
          include: {
            videos: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Storage cleanup: delete cover image, and all self-hosted video/thumbnail files
    if (category.cover_image_path) {
      await deleteStorageFile(category.cover_image_path);
    }

    for (const lesson of category.lessons) {
      for (const video of lesson.videos) {
        if (video.file_path) await deleteStorageFile(video.file_path);
        if (video.thumbnail_path) await deleteStorageFile(video.thumbnail_path);
      }
    }

    await prisma.courseCategory.delete({
      where: { id },
    });

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/admin/categories', req.url), 303);
    }

    return NextResponse.json({ success: true, message: 'Category and associated storage files deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
