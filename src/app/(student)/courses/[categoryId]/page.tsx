import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getActiveBankAccounts } from '@/lib/bank-accounts';
import CourseViewClient from '@/components/CourseViewClient';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

export default async function StudentCategoryViewPage({ params }: RouteParams) {
  const { categoryId } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/courses/${categoryId}`)}`);
  }

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

  // Check user purchase status for this category
  const purchase = await prisma.coursePurchase.findFirst({
    where: {
      user_id: session.userId,
      category_id: category.id,
    },
  });

  let userAccessStatus: 'purchased' | 'pending' | 'rejected' | 'none' = 'none';
  let rejectionReason: string | null = null;

  if (session.role === 'admin' || session.role === 'super_admin') {
    userAccessStatus = 'purchased';
  } else if (purchase) {
    if (purchase.status === 'verified') userAccessStatus = 'purchased';
    else if (purchase.status === 'pending_verification') userAccessStatus = 'pending';
    else if (purchase.status === 'rejected') {
      userAccessStatus = 'rejected';
      rejectionReason = purchase.rejection_reason;
    }
  }

  const bankAccounts = await getActiveBankAccounts();

  const cbeAccountName = process.env.CBE_ACCOUNT_NAME || 'AI Simplified Academy';
  const cbeAccountNumber = process.env.CBE_ACCOUNT_NUMBER || '1000123456789';

  const clientCategory = {
    id: category.id,
    name: category.name,
    description: category.description,
    price: Number(category.price),
    coming_soon: category.coming_soon,
    cover_image_path: category.cover_image_path,
    lessons: category.lessons.map((lesson) => ({
      id: lesson.id,
      name: lesson.name,
      description: lesson.description,
      position: lesson.position,
      videos: lesson.videos.map((vid) => ({
        id: vid.id,
        title: vid.title,
        description: vid.description,
        source_type: vid.source_type,
        file_path: vid.file_path,
        embed_url: vid.embed_url,
        thumbnail_path: vid.thumbnail_path,
        format: vid.format,
        is_free: vid.is_free,
        downloadable: vid.downloadable,
        duration_seconds: vid.duration_seconds,
      })),
    })),
  };

  return (
    <CourseViewClient
      category={clientCategory}
      userAccessStatus={userAccessStatus}
      cbeAccountName={cbeAccountName}
      cbeAccountNumber={cbeAccountNumber}
      rejectionReason={rejectionReason}
      bankAccounts={bankAccounts}
    />
  );
}
