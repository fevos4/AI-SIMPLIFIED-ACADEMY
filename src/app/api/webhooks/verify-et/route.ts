import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPurchaseApprovalEmail } from '@/lib/email';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/verify-et
 *
 * Handles asynchronous verification results from verify.et for
 * purchases that were queued (Case C) during submission.
 *
 * Webhook payload structure:
 * {
 *   "event": "verification.completed",
 *   "requestId": "...",
 *   "timestamp": "...",
 *   "data": {
 *     "processingStatus": "completed",
 *     "status": "success" | "failed",
 *     "verified": true | false,
 *     "bank": "cbe",
 *     "amount": "1500",
 *     "currency": "ETB",
 *     ...
 *   }
 * }
 */
export async function POST(req: Request) {
  try {
    // ── Webhook signature verification ─────────────────────────
    const webhookSecret = process.env.VERIFY_ET_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('x-webhook-signature') || '';
      const bodyText = await req.text();

      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyText)
        .digest('hex');

      if (!signature || signature !== expectedSignature) {
        console.warn('[webhook/verify-et] Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // Parse the body text as JSON since we already consumed it
      const payload = JSON.parse(bodyText);
      return handleWebhookPayload(payload);
    }

    // No secret configured — parse body directly
    const payload = await req.json();
    return handleWebhookPayload(payload);
  } catch (error) {
    console.error('[webhook/verify-et] Error processing webhook:', error);
    // Always return 200 to prevent verify.et from retrying on our errors
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

async function handleWebhookPayload(payload: any): Promise<NextResponse> {
  const requestId = payload?.requestId;
  const data = payload?.data;

  if (!requestId) {
    console.warn('[webhook/verify-et] Missing requestId in payload');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log(`[webhook/verify-et] Processing webhook for requestId=${requestId}`);

  // 1. Find the purchase by verify_et_request_id
  const purchase = await prisma.coursePurchase.findFirst({
    where: { verify_et_request_id: requestId },
    include: {
      user: { select: { email: true } },
      category: { select: { name: true, price: true } },
    },
  });

  // If not found, return 200 (idempotent — ignore unknown requests)
  if (!purchase) {
    console.log(`[webhook/verify-et] No purchase found for requestId=${requestId}, ignoring`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // If already resolved (not pending), return 200 (idempotent)
  if (purchase.status !== 'pending_verification') {
    console.log(`[webhook/verify-et] Purchase ${purchase.id} already ${purchase.status}, ignoring`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // 2. Extract verification data
  const isVerified = data?.verified === true;
  const responseAmount = data?.amount ? parseFloat(String(data.amount)) : null;
  const categoryPrice = Number(purchase.category.price);

  // settlementAccountMatch may be nested in data or data.settlementAccountMatch
  const settlementMatch = data?.settlementAccountMatch?.matched;

  // 3. Apply Case A / Case B logic

  // ── CASE A: Verified + checks pass ────────────────────────────
  if (isVerified) {
    // Check amount
    if (responseAmount !== null && responseAmount < categoryPrice) {
      const reason = `Amount paid (${responseAmount} ETB) does not match the required amount (${categoryPrice} ETB)`;
      await prisma.coursePurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'rejected',
          verification_status: 'failed',
          rejection_reason: reason,
          auto_verified: false,
        },
      });
      console.log(`[webhook/verify-et] Auto-rejected purchase ${purchase.id}: amount mismatch`);
      return NextResponse.json({ received: true, action: 'rejected' }, { status: 200 });
    }

    // Check settlement account match
    if (settlementMatch === false) {
      const reason = 'Payment was not made to the correct account';
      await prisma.coursePurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'rejected',
          verification_status: 'failed',
          rejection_reason: reason,
          auto_verified: false,
        },
      });
      console.log(`[webhook/verify-et] Auto-rejected purchase ${purchase.id}: settlement mismatch`);
      return NextResponse.json({ received: true, action: 'rejected' }, { status: 200 });
    }

    // All checks passed — auto-approve
    await prisma.coursePurchase.update({
      where: { id: purchase.id },
      data: {
        status: 'verified',
        auto_verified: true,
        verification_status: 'success',
        reviewed_at: new Date(),
      },
    });

    // Send approval email (non-blocking)
    if (purchase.user.email) {
      sendPurchaseApprovalEmail(purchase.user.email, purchase.category.name).catch((err) =>
        console.error('[webhook/verify-et] Failed to send approval email:', err)
      );
    }

    console.log(`[webhook/verify-et] Auto-approved purchase ${purchase.id}`);
    return NextResponse.json({ received: true, action: 'approved' }, { status: 200 });
  }

  // ── CASE B: verified: false ───────────────────────────────────
  const reason = 'Transaction not found or could not be verified';
  await prisma.coursePurchase.update({
    where: { id: purchase.id },
    data: {
      status: 'rejected',
      verification_status: 'failed',
      rejection_reason: reason,
      auto_verified: false,
    },
  });

  console.log(`[webhook/verify-et] Auto-rejected purchase ${purchase.id}: not verified`);
  return NextResponse.json({ received: true, action: 'rejected' }, { status: 200 });
}
