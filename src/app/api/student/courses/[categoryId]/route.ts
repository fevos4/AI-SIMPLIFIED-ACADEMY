import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { categoryId } = await params;
    const session = await getSession(req);

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let reference_number = '';
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await req.json();
      reference_number = body.reference_number || '';
    } else {
      const formData = await req.formData();
      reference_number = (formData.get('reference_number') as string) || '';
    }

    if (!reference_number || !reference_number.trim()) {
      return NextResponse.json({ error: 'Reference number is required' }, { status: 400 });
    }

    const trimmedRef = reference_number.trim();

    // 1. Check category exists and is not coming_soon
    const category = await prisma.courseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.coming_soon) {
      return NextResponse.json({ error: 'Category is not available for purchase' }, { status: 400 });
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
        amount_claimed: category.price,
        status: 'pending_verification',
      },
    });

    // Check if form submit (browser redirect) vs API call
    if (contentType.includes('form')) {
      const redirectUrl = new URL(`/courses/${categoryId}`, req.url);
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your payment is under review',
        purchase: newPurchase,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting purchase reference:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Reference number has already been submitted' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit purchase' }, { status: 500 });
  }
}
