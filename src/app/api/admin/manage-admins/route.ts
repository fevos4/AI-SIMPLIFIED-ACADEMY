import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    
    // Strict server-side check: session.role MUST be super_admin
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super admin access required.' }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'super_admin'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admin accounts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);

    // Strict server-side check: session.role MUST be super_admin
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super admin access required.' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let name = '';
    let email = '';
    let password = '';
    let role = 'admin';

    if (isJson) {
      const body = await req.json();
      name = body.name || '';
      email = body.email || '';
      password = body.password || '';
      role = body.role || 'admin';
    } else {
      const formData = await req.formData();
      name = (formData.get('name') as string) || '';
      email = (formData.get('email') as string) || '';
      password = (formData.get('password') as string) || '';
      role = (formData.get('role') as string) || 'admin';
    }

    if (!name || !email || !password || !role) {
      if (!isJson) {
        return NextResponse.redirect(new URL('/admin/manage-admins?error=All+fields+required', req.url), 303);
      }
      return NextResponse.json({ error: 'All fields (name, email, password, role) are required' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'super_admin') {
      if (!isJson) {
        return NextResponse.redirect(new URL('/admin/manage-admins?error=Invalid+role', req.url), 303);
      }
      return NextResponse.json({ error: "Role must be 'admin' or 'super_admin'" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      if (!isJson) {
        return NextResponse.redirect(new URL('/admin/manage-admins?error=Email+already+exists', req.url), 303);
      }
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        password_hash,
        role: role as any,
        email_verified: true, // Admin accounts bypass OTP
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    if (!isJson) {
      return NextResponse.redirect(new URL('/admin/manage-admins', req.url), 303);
    }

    return NextResponse.json({ admin: newAdmin }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Failed to create admin account' }, { status: 500 });
  }
}
