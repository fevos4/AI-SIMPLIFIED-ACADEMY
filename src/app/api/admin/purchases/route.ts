import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generatePresignedGetUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const where = statusFilter ? { status: statusFilter as any } : {};

    const purchases = await prisma.coursePurchase.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // pending_verification first
        { created_at: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    const purchasesWithUrls = await Promise.all(
      purchases.map(async (p) => {
        let receipt_url: string | null = null;
        if (p.receipt_image_path) {
          try {
            receipt_url = await generatePresignedGetUrl(p.receipt_image_path, 3600);
          } catch (err) {
            console.error(`Failed to generate presigned URL for receipt '${p.receipt_image_path}':`, err);
          }
        }
        return {
          ...p,
          amount_claimed: Number(p.amount_claimed),
          category: {
            ...p.category,
            price: Number(p.category.price),
          },
          receipt_url,
        };
      })
    );

    return NextResponse.json({ purchases: purchasesWithUrls });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}
