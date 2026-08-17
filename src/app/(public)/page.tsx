import { prisma } from '@/lib/prisma';
import HeroClient from '@/components/HeroClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const categories = await prisma.courseCategory.findMany({
    take: 6,
    orderBy: { position: 'asc' },
    include: {
      _count: {
        select: { lessons: { where: { published: true } } },
      },
    },
  });

  const plainCategories = categories.map((cat) => ({
    ...cat,
    price: Number(cat.price),
    created_at: cat.created_at.toISOString(),
  }));

  return <HeroClient categories={plainCategories} />;
}
