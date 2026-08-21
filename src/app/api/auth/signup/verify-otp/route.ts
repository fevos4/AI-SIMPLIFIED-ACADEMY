import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSignupVerifiedCookie } from '@/lib/auth';

import { getClientIp, checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rate = checkRateLimit(`otp_${clientIp}`, 5, 600);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rate.retryAfterSeconds,
          message: 'Too many verification attempts. Please wait before trying again.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        }
      );
    }

    const { email, otp_code } = await req.json();

    if (!email || !otp_code) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user || !user.otp_code_hash || !user.otp_expires_at) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return NextResponse.json({ error: 'OTP code has expired. Please request a new one.' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(otp_code.trim(), user.otp_code_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    // Clear OTP hash and expiration
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp_code_hash: null,
        otp_expires_at: null,
      },
    });

    // Set 15-minute HttpOnly cookie "signup_verified"
    const otpToken = await setSignupVerifiedCookie(trimmedEmail);

    return NextResponse.json({
      success: true,
      otp_token: otpToken,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
