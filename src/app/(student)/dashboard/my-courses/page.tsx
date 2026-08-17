import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import CourseCard from '@/components/CourseCard';

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user's verified purchases
  const purchases = await prisma.coursePurchase.findMany({
    where: {
      user_id: session.userId,
      status: 'verified',
    },
    include: {
      category: {
        include: {
          _count: {
            select: { lessons: true },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return (
    <main style={{ padding: '2.5rem 2rem', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: '800',
            color: '#4F46E5',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          STUDENT PORTAL
        </div>
        <h1
          style={{
            fontSize: '2.4rem',
            color: '#0f172a',
            margin: '0 0 0.5rem 0',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: '900',
            letterSpacing: '-0.5px',
          }}
        >
          My Purchased Courses
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '1.05rem' }}>
          Access your unlocked video categories and learning materials anytime.
        </p>
      </header>

      {purchases.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1.5px dashed #cbd5e1',
            maxWidth: '560px',
            margin: '2rem auto',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.75rem 0' }}>
            No purchased courses yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
            You haven't unlocked any course categories yet. Explore our catalog and unlock lifetime access to AI courses.
          </p>
          <Link
            href="/courses"
            style={{
              display: 'inline-block',
              padding: '0.85rem 1.75rem',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            }}
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {purchases.map((purchase, index) => (
            <CourseCard
              key={purchase.id}
              id={purchase.category.id}
              name={purchase.category.name}
              description={purchase.category.description}
              coverImagePath={purchase.category.cover_image_path}
              price={Number(purchase.category.price)}
              lessonCount={purchase.category._count?.lessons || 0}
              position={index + 1}
              isPurchased={true}
              targetUrl={`/courses/${purchase.category.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
}
