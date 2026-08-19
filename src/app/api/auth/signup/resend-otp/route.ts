import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user || user.email_verified) {
      return NextResponse.json({ error: 'Unable to resend OTP code' }, { status: 400 });
    }

    // Rate limiting: check if otp_expires_at was set less than 9 minutes ago (< 60s since generation)
    if (user.otp_expires_at) {
      const now = new Date();
      const expiresAt = new Date(user.otp_expires_at);
      const diffMs = expiresAt.getTime() - now.getTime();
      // Original expiry was 10 mins (600s). If diffMs > 540s (9 mins remaining), less than 60s has passed.
      if (diffMs > 9 * 60 * 1000) {
        return NextResponse.json({ error: 'Please wait before requesting a new code' }, { status: 429 });
      }
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp_code_hash: otpHash,
        otp_expires_at: otpExpiresAt,
      },
    });

    await sendOtpEmail(trimmedEmail, rawOtp);

    return NextResponse.json({ success: true, message: 'New OTP code sent to email' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return NextResponse.json({ error: 'Failed to resend OTP' }, { status: 500 });
  }
}
