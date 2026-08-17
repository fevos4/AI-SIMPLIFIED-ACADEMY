import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const defaultName = name && name.trim() ? name.trim() : trimmedEmail.split('@')[0];

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Log in instead?' }, { status: 400 });
    }

    // Generate random 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

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
