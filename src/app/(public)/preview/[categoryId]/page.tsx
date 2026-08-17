import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import CategoryPreviewClient from '@/components/CategoryPreviewClient';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

export default async function CategoryPreviewPage({ params }: RouteParams) {
  const { categoryId } = await params;
  const session = await getSession();

  const category = await prisma.courseCategory.findUnique({
    where: { id: categoryId },
    include: {
      lessons: {
        where: { published: true },
        orderBy: { position: 'asc' },
        include: {
          videos: {
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  const plainCategory = {
    ...category,
    price: Number(category.price),
    created_at: category.created_at.toISOString(),
  };

  return <CategoryPreviewClient category={plainCategory} isLoggedIn={Boolean(session)} />;
}
