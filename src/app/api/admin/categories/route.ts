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

    const categories = await prisma.courseCategory.findMany({
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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

    let name = '';
    let description = '';
    let price: any = 0;
    let coming_soon = false;
    let position: any = null;
    let cover_image_path = '';

    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      const body = await req.json();
      name = body.name || '';
      description = body.description || '';
      price = body.price;
      coming_soon = Boolean(body.coming_soon);
      position = body.position;
      cover_image_path = body.cover_image_path || '';
    } else {
      const formData = await req.formData();
      name = (formData.get('name') as string) || '';
      description = (formData.get('description') as string) || '';
      price = formData.get('price');
      coming_soon = formData.get('coming_soon') === 'true' || formData.get('coming_soon') === 'on';
      position = formData.get('position');
      cover_image_path = (formData.get('cover_image_path') as string) || '';
    }

    if (!name || price === undefined || price === null || price === '') {
      if (!isJson) {
        return NextResponse.redirect(new URL('/admin/categories?error=Name+and+price+required', req.url), 303);
      }
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    let pos = position;
    if (pos === undefined || pos === null || pos === '') {
      const maxCat = await prisma.courseCategory.findFirst({ orderBy: { position: 'desc' } });
      pos = maxCat ? maxCat.position + 1 : 1;
    }

    const category = await prisma.courseCategory.create({
      data: {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        coming_soon: Boolean(coming_soon),
        position: Number(pos),
        cover_image_path: cover_image_path.trim() || null,
        created_by: user.id,
      },
    });

    if (!isJson) {
      return NextResponse.redirect(new URL('/admin/categories', req.url), 303);
    }

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
