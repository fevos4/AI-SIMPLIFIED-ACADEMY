import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import AdminCurriculumBuilderClient from '@/components/AdminCurriculumBuilderClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCategoryCurriculumPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/admin');
  }

  const category = await prisma.courseCategory.findUnique({
    where: { id },
    include: {
      lessons: {
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

  const clientCategory = {
    id: category.id,
    name: category.name,
    price: Number(category.price),
    position: category.position,
    lessons: category.lessons.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      published: l.published,
      position: l.position,
      videos: l.videos.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        source_type: v.source_type,
        file_path: v.file_path,
        embed_url: v.embed_url,
        thumbnail_path: v.thumbnail_path,
        format: v.format,
        is_free: v.is_free,
        downloadable: v.downloadable,
        position: v.position,
        duration_seconds: v.duration_seconds,
      })),
    })),
  };

  return <AdminCurriculumBuilderClient category={clientCategory} />;
}
