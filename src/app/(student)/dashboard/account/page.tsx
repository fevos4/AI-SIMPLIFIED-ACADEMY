import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import AccountClient from '@/components/AccountClient';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    redirect('/login');
  }

  const purchases = await prisma.coursePurchase.findMany({
    where: { user_id: session.userId },
    include: {
      category: { select: { name: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  const formattedPurchases = purchases.map((p) => ({
    id: p.id,
    categoryName: p.category.name,
    amountClaimed: Number(p.amount_claimed),
    status: p.status,
    rejectionReason: p.rejection_reason,
    createdAt: p.created_at.toISOString(),
  }));

  return <AccountClient user={user} purchases={formattedPurchases} />;
}
