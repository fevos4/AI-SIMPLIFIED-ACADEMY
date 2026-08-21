import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, verifyOtpVerifiedToken, getSignupVerifiedEmail, clearSignupVerifiedCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password, confirm_password, otp_token, name } = await req.json();

    if (!email || !password || !confirm_password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    if (password !== confirm_password) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Verification check: Check cookie first, or verify otp_token payload if provided
    let isVerified = false;

    // 1. Check signup_verified HttpOnly cookie
    const cookieVerifiedEmail = await getSignupVerifiedEmail(req);
    if (cookieVerifiedEmail && cookieVerifiedEmail.toLowerCase() === trimmedEmail) {
      isVerified = true;
    }

    // 2. Fallback to otp_token passed in body if valid JWT
    if (!isVerified && otp_token && otp_token !== 'valid') {
      const tokenPayload = await verifyOtpVerifiedToken(otp_token);
      if (tokenPayload && tokenPayload.email.toLowerCase() === trimmedEmail) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return NextResponse.json({ error: 'OTP verification session invalid or expired' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        email_verified: true,
        ...(name && name.trim() ? { name: name.trim() } : {}),
      },
    });

    // Clear verification cookie once signup completes
    await clearSignupVerifiedCookie();

    // Auto-login: issue session cookie
    await createSession(updatedUser.id, updatedUser.role, updatedUser.email, req);

    return NextResponse.json({
      success: true,
      message: 'Signup completed successfully',
      redirectUrl: '/dashboard',
    });
  } catch (error) {
    console.error('Error completing signup:', error);
    return NextResponse.json({ error: 'Failed to complete signup' }, { status: 500 });
  }
}
