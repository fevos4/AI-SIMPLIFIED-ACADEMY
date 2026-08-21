import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getClientIp, checkRateLimit } from '@/lib/rateLimit';
import { verifyPayment, isValidBankCode, isBankAvailable, BANK_CONFIG, type BankCode } from '@/lib/verify-et';
import { sendPurchaseApprovalEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(req);
    const rate = checkRateLimit(`payment_sub_${clientIp}`, 3, 600);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rate.retryAfterSeconds,
          message: 'Too many attempts. Please try again in 10 minutes.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        }
      );
    }

    const { categoryId } = await params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    let bank = '';
    let reference_number = '';
    let phone_number = '';
    let amount_paid = '';
    let receipt_image_path: string | undefined;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      bank = body.bank || '';
      reference_number = body.reference_number || '';
      phone_number = body.phone_number || '';
      amount_paid = body.amount_paid || '';
      receipt_image_path = body.receipt_image_path || undefined;
    } else {
      const formData = await req.formData();
      bank = (formData.get('bank') as string) || '';
      reference_number = (formData.get('reference_number') as string) || '';
      phone_number = (formData.get('phone_number') as string) || '';
      amount_paid = (formData.get('amount_paid') as string) || '';
      receipt_image_path = (formData.get('receipt_image_path') as string) || undefined;
    }

    // ── Validate inputs ──────────────────────────────────────────

    if (!bank || !isValidBankCode(bank)) {
      return NextResponse.json({ error: 'Please select a valid bank' }, { status: 400 });
    }

    if (!isBankAvailable(bank)) {
      return NextResponse.json(
        { error: BANK_CONFIG[bank].unavailableMessage || 'This bank is currently unavailable for verification' },
        { status: 400 }
      );
    }

    if (!reference_number || !reference_number.trim()) {
      return NextResponse.json({ error: 'Reference/transaction number is required' }, { status: 400 });
    }

    const trimmedRef = reference_number.trim();

    // CBE Birr requires phone number
    const bankConfig = BANK_CONFIG[bank];
    if (bankConfig.requiresPhone && (!phone_number || !phone_number.trim())) {
      return NextResponse.json({ error: 'Phone number is required for CBE Birr' }, { status: 400 });
    }

    // 1. Check category exists and is not coming_soon
    const category = await prisma.courseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.coming_soon) {
      return NextResponse.json({ error: 'Category is not available for purchase' }, { status: 400 });
    }

    // Validate amount (if provided)
    const categoryPrice = Number(category.price);
    const claimedAmount = amount_paid ? parseFloat(amount_paid) : categoryPrice;

    if (claimedAmount < categoryPrice) {
      return NextResponse.json(
        { error: `Amount paid (${claimedAmount} ETB) is less than the required amount (${categoryPrice} ETB)` },
        { status: 400 }
      );
    }

    // 2. Check if user already owns or has pending purchase
    const existingUserPurchase = await prisma.coursePurchase.findFirst({
      where: {
        user_id: session.userId,
        category_id: category.id,
      },
    });

    if (existingUserPurchase) {
      if (existingUserPurchase.status === 'verified') {
        return NextResponse.json({ error: 'You already own this course category' }, { status: 400 });
      }
      if (existingUserPurchase.status === 'pending_verification') {
        return NextResponse.json({ error: 'You already have a payment under review' }, { status: 400 });
      }
      // If rejected, allow resubmission — delete the old rejected record
      if (existingUserPurchase.status === 'rejected') {
        await prisma.coursePurchase.delete({
          where: { id: existingUserPurchase.id },
        });
      }
    }

    // 3. Check reference_number uniqueness across all purchases
    const existingRef = await prisma.coursePurchase.findUnique({
      where: { reference_number: trimmedRef },
    });

    if (existingRef) {
      return NextResponse.json({ error: 'Reference number has already been submitted' }, { status: 400 });
    }

    // 4. Create purchase record with pending_verification
    const newPurchase = await prisma.coursePurchase.create({
      data: {
        user_id: session.userId,
        category_id: category.id,
        reference_number: trimmedRef,
        amount_claimed: claimedAmount,
        receipt_image_path: receipt_image_path || null,
        status: 'pending_verification',
        bank: bank,
        phone_number: phone_number.trim() || null,
        verify_et_request_id: null,
        auto_verified: false,
        verification_status: null,
      },
    });

    // 5. Call verify.et API (server-side only)
    let verifyResult;
    try {
      verifyResult = await verifyPayment(
        bank as BankCode,
        trimmedRef,
        {
          phone: phone_number.trim() || undefined,
          idempotencyKey: newPurchase.id,
          expectedAmount: categoryPrice,
        }
      );
    } catch (err) {
      console.error('[purchase] verify.et call failed unexpectedly:', err);
      verifyResult = { apiSuccess: false, verified: false, status: 'error' as const };
    }

    // 6. Handle the three response cases

    // ── CASE A: Verified successfully ────────────────────────────
    if (verifyResult.status === 'success' && verifyResult.verified) {
      await prisma.coursePurchase.update({
        where: { id: newPurchase.id },
        data: {
          status: 'verified',
          auto_verified: true,
          verify_et_request_id: verifyResult.requestId || null,
          verification_status: 'success',
          reviewed_at: new Date(),
        },
      });

      // Send approval email (non-blocking)
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      });
      if (user) {
        sendPurchaseApprovalEmail(user.email, category.name).catch((err) =>
          console.error('[purchase] Failed to send approval email:', err)
        );
      }

      return NextResponse.json(
        {
          success: true,
          autoApproved: true,
          message: 'Payment verified! Your course access has been unlocked.',
        },
        { status: 200 }
      );
    }

    // ── CASE B: Auto-rejected ────────────────────────────────────
    if (verifyResult.status === 'failed' && verifyResult.apiSuccess) {
      const rejectionReason = verifyResult.rejectionReason || 'Transaction not found or could not be verified';

      await prisma.coursePurchase.update({
        where: { id: newPurchase.id },
        data: {
          status: 'rejected',
          verify_et_request_id: verifyResult.requestId || null,
          verification_status: 'failed',
          rejection_reason: rejectionReason,
          auto_verified: false,
        },
      });

      return NextResponse.json(
        {
          success: false,
          autoRejected: true,
          reason: rejectionReason,
        },
        { status: 200 }
      );
    }

    // ── CASE C: Queued or error — fall back to manual review ─────
    await prisma.coursePurchase.update({
      where: { id: newPurchase.id },
      data: {
        verify_et_request_id: verifyResult.requestId || null,
        verification_status: verifyResult.status === 'queued' ? 'queued' : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        autoApproved: false,
        message: 'Payment submitted for review. You will be notified when it is verified.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting purchase reference:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Reference number has already been submitted' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit purchase' }, { status: 500 });
  }
}
