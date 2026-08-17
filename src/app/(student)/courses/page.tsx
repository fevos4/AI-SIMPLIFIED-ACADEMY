import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function StudentBrowseCoursesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });

  const categories = await prisma.courseCategory.findMany({
    orderBy: { position: 'asc' },
    include: {
      _count: {
        select: { lessons: { where: { published: true } } },
      },
    },
  });

  const userPurchases = await prisma.coursePurchase.findMany({
    where: {
      user_id: session.userId,
    },
    select: { category_id: true, status: true },
  });

  const verifiedCategoryIds = new Set(
    userPurchases.filter((p) => p.status === 'verified').map((p) => p.category_id)
  );
  const pendingCategoryIds = new Set(
    userPurchases.filter((p) => p.status === 'pending_verification').map((p) => p.category_id)
  );

  const categoryCards = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    cover_image_path: cat.cover_image_path,
    price: Number(cat.price),
    coming_soon: cat.coming_soon,
    lessonCount: cat._count.lessons,
    isPurchased: verifiedCategoryIds.has(cat.id),
    isPending: pendingCategoryIds.has(cat.id),
  }));

  const userName = user?.name || session.email.split('@')[0];

  return <DashboardClient categories={categoryCards} userName={userName} />;
}
