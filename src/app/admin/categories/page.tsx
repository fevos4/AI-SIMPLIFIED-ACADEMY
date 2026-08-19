import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminCategoriesClient from '@/components/AdminCategoriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/admin');
  }

  const categories = await prisma.courseCategory.findMany({
    orderBy: { position: 'asc' },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });

  const plainCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    price: Number(cat.price),
    position: cat.position,
    coming_soon: cat.coming_soon,
    cover_image_path: cat.cover_image_path,
    _count: cat._count,
  }));

  return <AdminCategoriesClient initialCategories={plainCategories} />;
}
