import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { getClientIp, getFailureCount, recordFailure, resetRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const LOGIN_WINDOW_SECONDS = 15 * 60; // 15 minutes
const MAX_LOGIN_FAILURES = 5;

export async function POST(req: Request) {
  try {
    let email = '';
    let password = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = body.email || '';
      password = body.password || '';
    } else {
      const formData = await req.formData();
      email = (formData.get('email') as string) || '';
      password = (formData.get('password') as string) || '';
    }

    const clientIp = getClientIp(req);
    const trimmedEmail = email.trim().toLowerCase();
    const ipKey = `login_ip_${clientIp}`;
    const comboKey = `login_combo_${clientIp}_${trimmedEmail}`;

    const ipCheck = getFailureCount(ipKey);
    const comboCheck = getFailureCount(comboKey);

    if (ipCheck.count >= MAX_LOGIN_FAILURES || comboCheck.count >= MAX_LOGIN_FAILURES) {
      const retryAfter = Math.max(ipCheck.retryAfterSeconds, comboCheck.retryAfterSeconds, 1);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter,
          message: 'Too many login attempts. Please try again in 15 minutes.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Strictly enforce role = 'user'. Reject admin/super_admin with generic error.
    if (!user || user.role !== 'user') {
      const ipFail = recordFailure(ipKey, LOGIN_WINDOW_SECONDS);
      const comboFail = recordFailure(comboKey, LOGIN_WINDOW_SECONDS);
      const currentFail = Math.max(ipFail.count, comboFail.count);
      const retryAfter = Math.max(ipFail.retryAfterSeconds, comboFail.retryAfterSeconds, 1);

      if (currentFail >= MAX_LOGIN_FAILURES) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter,
            message: 'Too many login attempts. Please try again in 15 minutes.',
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          }
        );
      }

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Unverified email check
    if (!user.email_verified) {
      return NextResponse.json({ error: 'Please verify your email before logging in' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const ipFail = recordFailure(ipKey, LOGIN_WINDOW_SECONDS);
      const comboFail = recordFailure(comboKey, LOGIN_WINDOW_SECONDS);
      const currentFail = Math.max(ipFail.count, comboFail.count);
      const retryAfter = Math.max(ipFail.retryAfterSeconds, comboFail.retryAfterSeconds, 1);

      if (currentFail >= MAX_LOGIN_FAILURES) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter,
            message: 'Too many login attempts. Please try again in 15 minutes.',
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfter) },
          }
        );
      }

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Successful login resets rate limit counter for IP & combo
    resetRateLimit(ipKey);
    resetRateLimit(comboKey);

    // Issue session cookie
    await createSession(user.id, user.role, user.email, req);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      role: user.role,
      redirectUrl: '/dashboard',
    });
  } catch (error) {
    console.error('Error logging in student:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
