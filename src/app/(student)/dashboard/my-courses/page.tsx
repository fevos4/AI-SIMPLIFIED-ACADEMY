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
    <main style={{ padding: '3.5rem 2.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <header style={{ marginBottom: '3rem' }}>
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: '700',
            color: '#A63A2C',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          MY ENROLLMENTS
        </div>
        <h1
          style={{
            fontSize: '2.5rem',
            color: '#191510',
            margin: '0 0 0.6rem 0',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: '700',
            letterSpacing: '-0.02em',
          }}
        >
          My Purchased Courses
        </h1>
        <p style={{ color: '#55503F', margin: 0, fontSize: '1.05rem', fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: '1.5' }}>
          Access your unlocked video categories and learning materials anytime.
        </p>
      </header>

      {purchases.length === 0 ? (
        <div
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            backgroundColor: '#F7F3EA',
            borderRadius: '0px',
            border: '1px solid rgba(25, 21, 16, 0.14)',
            maxWidth: '560px',
            margin: '2rem auto',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#191510', margin: '0 0 0.75rem 0', fontFamily: "'Space Grotesk', sans-serif" }}>
            No purchased courses yet
          </h3>
          <p style={{ color: '#55503F', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            You haven't unlocked any course categories yet. Explore our catalog and unlock lifetime access to AI courses.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              padding: '0.85rem 1.75rem',
              backgroundColor: '#191510',
              color: '#F7F3EA',
              borderRadius: '0px',
              fontWeight: '600',
              fontSize: '0.95rem',
              textDecoration: 'none',
              fontFamily: "'IBM Plex Sans', sans-serif",
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
