import { prisma } from '@/lib/prisma';
import PreviewGridClient from '@/components/PreviewGridClient';

export const dynamic = 'force-dynamic';

export default async function PreviewPage() {
  const categories = await prisma.courseCategory.findMany({
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

  return <PreviewGridClient categories={plainCategories} />;
}
