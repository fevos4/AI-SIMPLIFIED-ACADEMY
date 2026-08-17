import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generatePresignedGetUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ videoId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { videoId } = await params;

    const video = await prisma.courseVideo.findUnique({
      where: { id: videoId },
      include: {
        lesson: {
          select: {
            category_id: true,
            published: true,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const session = await getSession(req);
    const isAdmin = session && (session.role === 'admin' || session.role === 'super_admin');

    // Access control check: If parent lesson is NOT published, return 403 unless admin
    if (!video.lesson.published && !isAdmin) {
      return NextResponse.json({ error: 'Lesson is not published' }, { status: 403 });
    }

    const categoryId = video.lesson.category_id;

    // Rule 1: Free videos are playable by anyone if lesson is published
    if (video.is_free) {
      return await respondWithVideoAccess(video);
    }

    // Rule 2: Paid videos require authenticated session
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rule 3: Admin & Super Admin have global access
    if (isAdmin) {
      return await respondWithVideoAccess(video);
    }

    // Rule 4: Check for a verified CoursePurchase for this user & category
    const purchase = await prisma.coursePurchase.findFirst({
      where: {
        user_id: session.userId,
        category_id: categoryId,
        status: 'verified',
      },
    });

    if (!purchase) {
      return NextResponse.json(
        {
          error: 'Purchase required',
          categoryId,
        },
        { status: 403 }
      );
    }

    // Verified purchase user grants access
    return await respondWithVideoAccess(video);
  } catch (error) {
    console.error('Error in video play API:', error);
    return NextResponse.json({ error: 'Failed to access video' }, { status: 500 });
  }
}

async function respondWithVideoAccess(video: any) {
  if (video.source_type === 'embed') {
    return NextResponse.json({
      playable: true,
      embedUrl: video.embed_url,
      format: video.format,
      downloadable: video.downloadable,
    });
  }

  // Self-hosted video: generate 15-minute presigned GET URL
  if (!video.file_path) {
    return NextResponse.json({ error: 'Video file path is missing' }, { status: 404 });
  }

  const presignedUrl = await generatePresignedGetUrl(video.file_path, 15 * 60);

  return NextResponse.json({
    playable: true,
    url: presignedUrl,
    format: video.format,
    downloadable: video.downloadable,
  });
}
