import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generatePresignedGetUrl } from '@/lib/storage';
import { redirect } from 'next/navigation';
import AdminPurchasesClient from '@/components/AdminPurchasesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPurchasesPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/admin');
  }

  const purchases = await prisma.coursePurchase.findMany({
    orderBy: [
      { status: 'asc' }, // pending_verification first
      { created_at: 'desc' },
    ],
    include: {
      user: {
        select: { name: true, email: true },
      },
      category: {
        select: { name: true, price: true },
      },
    },
  });

  const purchasesWithPresignedUrls = await Promise.all(
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
        id: p.id,
        status: p.status,
        reference_number: p.reference_number,
        amount_claimed: Number(p.amount_claimed),
        receipt_image_path: p.receipt_image_path,
        receipt_url,
        rejection_reason: p.rejection_reason,
        created_at: p.created_at.toISOString(),
        user: p.user,
        category: {
          name: p.category.name,
          price: Number(p.category.price),
        },
      };
    })
  );

  return <AdminPurchasesClient initialPurchases={purchasesWithPresignedUrls} />;
}
