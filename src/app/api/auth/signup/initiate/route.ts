import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';

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

    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const defaultName = name && name.trim() ? name.trim() : trimmedEmail.split('@')[0];

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser && existingUser.email_verified) {
      return NextResponse.json({ error: 'An account with this email already exists. Log in instead?' }, { status: 400 });
    }

    // Generate random 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    if (existingUser && !existingUser.email_verified) {
      // Unverified user from prior abandoned signup - update OTP code & expires_at
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          otp_code_hash: otpHash,
          otp_expires_at: otpExpiresAt,
          ...(name && name.trim() ? { name: name.trim() } : {}),
        },
      });
    } else {
      // Create new unverified user record
      await prisma.user.create({
        data: {
          email: trimmedEmail,
          name: defaultName,
          password_hash: '',
          email_verified: false,
          role: 'user',
          otp_code_hash: otpHash,
          otp_expires_at: otpExpiresAt,
        },
      });
    }

    await sendOtpEmail(trimmedEmail, rawOtp);

    const isTest = process.env.NODE_ENV !== 'production';
    return NextResponse.json({
      success: true,
      message: 'OTP sent to email',
      ...(isTest ? { debug_otp: rawOtp } : {}),
    });
  } catch (error) {
    console.error('Error initiating signup:', error);
    return NextResponse.json({ error: 'Failed to initiate signup' }, { status: 500 });
  }
}
