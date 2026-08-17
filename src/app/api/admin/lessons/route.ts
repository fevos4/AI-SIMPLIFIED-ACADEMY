import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId parameter is required' }, { status: 400 });
    }

    const lessons = await prisma.courseLesson.findMany({
      where: { category_id: categoryId },
      orderBy: { position: 'asc' },
      include: {
        videos: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
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

    let category_id = '';
    let name = '';
    let description = '';
    let position: any = null;

    if (isJson) {
      const body = await req.json();
      category_id = body.category_id || '';
      name = body.name || '';
      description = body.description || '';
      position = body.position;
    } else {
      const formData = await req.formData();
      category_id = (formData.get('category_id') as string) || (formData.get('categoryId') as string) || '';
      name = (formData.get('name') as string) || '';
      description = (formData.get('description') as string) || '';
      position = formData.get('position');
    }

    if (!category_id || !name) {
      if (!isJson) {
        return NextResponse.redirect(new URL(`/admin/categories/${category_id || ''}?error=Category+and+name+required`, req.url), 303);
      }
      return NextResponse.json({ error: 'category_id and name are required' }, { status: 400 });
    }

    let pos = position;
    if (pos === undefined || pos === null || pos === '') {
      const maxLesson = await prisma.courseLesson.findFirst({
        where: { category_id },
        orderBy: { position: 'desc' },
      });
      pos = maxLesson ? maxLesson.position + 1 : 1;
    }

    const lesson = await prisma.courseLesson.create({
      data: {
        category_id,
        name: name.trim(),
        description: description.trim() || null,
        position: Number(pos),
        created_by: user.id,
      },
    });

    if (!isJson) {
      return NextResponse.redirect(new URL(`/admin/categories/${category_id}`, req.url), 303);
    }

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}
