import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  if (!resend) {
    console.warn(`[Resend Email] API key not configured. OTP for ${to} is: ${otp}`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'AI Simplified Academy <onboarding@resend.dev>',
      to: [to],
      subject: 'Your Verification OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Verification Code</h2>
          <p>Your one-time password (OTP) code is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Note: This OTP code expires in 10 minutes. If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error(`[Resend Email Error] Failed to send OTP email to ${to}:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[Resend Email Exception] Error sending OTP to ${to}:`, err);
    return false;
  }
}

export async function sendPurchaseApprovalEmail(to: string, categoryName: string): Promise<boolean> {
  if (!resend) {
    console.warn(`[Resend Email] API key not configured. Purchase approval notification for ${to} (${categoryName}) skipped.`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'AI Simplified Academy <onboarding@resend.dev>',
      to: [to],
      subject: `Course Purchase Approved: ${categoryName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #10b981;">Payment Verified & Access Granted!</h2>
          <p>Your CBE bank transfer for <strong>${categoryName}</strong> has been approved.</p>
          <p>You now have <strong>LIFETIME ACCESS</strong> to all video lessons inside this course category.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/courses" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Start Learning Now
          </a>
        </div>
      `,
    });

    if (error) {
      console.error(`[Resend Email Error] Failed to send approval email to ${to}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Resend Email Exception] Error sending approval email to ${to}:`, err);
    return false;
  }
}

export async function sendPurchaseRejectionEmail(to: string, categoryName: string, reason: string): Promise<boolean> {
  if (!resend) {
    console.warn(`[Resend Email] API key not configured. Purchase rejection notification for ${to} (${categoryName}) skipped.`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: 'AI Simplified Academy <onboarding@resend.dev>',
      to: [to],
      subject: `Update on Course Purchase: ${categoryName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #ef4444;">Payment Submission Not Approved</h2>
          <p>Your payment submission for <strong>${categoryName}</strong> was not approved.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please review your CBE transaction reference number and submit your payment again.</p>
        </div>
      `,
    });

    if (error) {
      console.error(`[Resend Email Error] Failed to send rejection email to ${to}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Resend Email Exception] Error sending rejection email to ${to}:`, err);
    return false;
  }
}
