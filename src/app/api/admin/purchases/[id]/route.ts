import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendPurchaseApprovalEmail, sendPurchaseRejectionEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Resolve active admin user in DB
    let user = session.userId ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
    if (!user && session.email) {
      user = await prisma.user.findUnique({ where: { email: session.email } });
    }

    if (!user) {
      return NextResponse.json({ error: 'Admin account not found in database. Please log in again.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let action = '';
    let rejection_reason = '';

    if (isJson) {
      const body = await req.json();
      action = body.action || '';
      rejection_reason = body.rejection_reason || '';
    } else {
      const formData = await req.formData();
      action = (formData.get('action') as string) || '';
      rejection_reason = (formData.get('rejection_reason') as string) || '';
    }

    if (!action || (action !== 'approve' && action !== 'reject')) {
      if (!isJson) {
        return NextResponse.redirect(new URL('/admin/purchases?error=Invalid+action', req.url), 303);
      }
      return NextResponse.json({ error: "Action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const purchase = await prisma.coursePurchase.findUnique({
      where: { id },
      include: {
        user: true,
        category: true,
      },
    });

    if (!purchase) {
      if (!isJson) {
        return NextResponse.redirect(new URL('/admin/purchases?error=Purchase+not+found', req.url), 303);
      }
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const updated = await prisma.coursePurchase.update({
        where: { id },
        data: {
          status: 'verified',
          reviewed_by: user.id,
          reviewed_at: new Date(),
        },
      });

      // Send non-blocking approval email notification
      await sendPurchaseApprovalEmail(purchase.user.email, purchase.category.name);

      if (!isJson) {
        return NextResponse.redirect(new URL('/admin/purchases', req.url), 303);
      }

      return NextResponse.json({ success: true, purchase: updated });
    }

    // Reject action
    if (!rejection_reason || !rejection_reason.trim()) {
      if (!isJson) {
        return NextResponse.redirect(new URL('/admin/purchases?error=Rejection+reason+required', req.url), 303);
      }
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const updated = await prisma.coursePurchase.update({
      where: { id },
      data: {
        status: 'rejected',
        rejection_reason: rejection_reason.trim(),
        reviewed_by: user.id,
        reviewed_at: new Date(),
      },
    });

    // Send non-blocking rejection email notification
    await sendPurchaseRejectionEmail(purchase.user.email, purchase.category.name, rejection_reason.trim());

    if (!isJson) {
      return NextResponse.redirect(new URL('/admin/purchases', req.url), 303);
    }

    return NextResponse.json({ success: true, purchase: updated });
  } catch (error) {
    console.error('Error reviewing purchase:', error);
    return NextResponse.json({ error: 'Failed to review purchase' }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteParams) {
  return PATCH(req, context);
}
