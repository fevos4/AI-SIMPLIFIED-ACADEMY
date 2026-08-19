import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let email = '';
    let password = '';
    let isAdminContext = false;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = body.email || '';
      password = body.password || '';
      isAdminContext = Boolean(body.isAdminContext);
    } else {
      const formData = await req.formData();
      email = (formData.get('email') as string) || '';
      password = (formData.get('password') as string) || '';
      isAdminContext = formData.get('isAdminContext') === 'true';
    }

    if (!email || !password) {
      if (!contentType.includes('application/json')) {
        return NextResponse.redirect(new URL('/admin?error=Missing+credentials', req.url), 303);
      }
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      if (!contentType.includes('application/json')) {
        return NextResponse.redirect(new URL('/admin?error=Invalid+credentials', req.url), 303);
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // Unverified email check
    if (!user.email_verified) {
      if (!contentType.includes('application/json')) {
        return NextResponse.redirect(new URL('/admin?error=Email+not+verified', req.url), 303);
      }
      return NextResponse.json({ error: 'Please verify your email before logging in' }, { status: 400 });
    }

    const isAdminRole = user.role === 'admin' || user.role === 'super_admin';

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      if (!contentType.includes('application/json')) {
        return NextResponse.redirect(new URL('/admin?error=Invalid+credentials', req.url), 303);
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // Issue session cookie
    await createSession(user.id, user.role, user.email);

    const redirectUrl = isAdminRole ? '/admin' : '/dashboard';

    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL(redirectUrl, req.url), 303);
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      role: user.role,
      redirectUrl,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
