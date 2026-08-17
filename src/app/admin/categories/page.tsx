import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

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

  return (
    <div style={{ backgroundColor: '#fdf9f2', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#24201a', padding: '2.5rem 2rem' }}>
      <main style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <Link
              href="/admin"
              style={{
                color: '#e94f6b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.5rem',
                textDecoration: 'none',
                fontWeight: '700',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.9rem',
              }}
            >
              ← Admin Dashboard
            </Link>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>
              Manage Course Categories
            </h1>
          </div>
        </div>

        {/* Create Category Section */}
        <section
          style={{
            border: '1px solid #ecdfc4',
            borderRadius: '14px',
            padding: '2rem',
            marginBottom: '2.5rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.25rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem' }}>
            Create New Category
          </h2>
          <form action="/api/admin/categories" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '540px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Physics - Grade 12"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Short overview of what students will learn in this category..."
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #ecdfc4',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                  Price (ETB) *
                </label>
                <input
                  type="number"
                  name="price"
                  defaultValue={500}
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #ecdfc4',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                  Position
                </label>
                <input
                  type="number"
                  name="position"
                  defaultValue={categories.length + 1}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #ecdfc4',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input type="checkbox" name="coming_soon" id="coming_soon" value="true" style={{ width: '18px', height: '18px', accentColor: '#e94f6b' }} />
              <label htmlFor="coming_soon" style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
                Mark as "Coming Soon"
              </label>
            </div>

            <button
              type="submit"
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: '#e94f6b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.95rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                textTransform: 'uppercase',
                alignSelf: 'flex-start',
              }}
            >
              Create Category
            </button>
          </form>
        </section>

        {/* Existing Categories List */}
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem' }}>
            Existing Categories ({categories.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  border: '1px solid #ecdfc4',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#24201a' }}>
                    {cat.name}
                    {cat.coming_soon && (
                      <span
                        style={{
                          marginLeft: '0.6rem',
                          padding: '0.15rem 0.5rem',
                          backgroundColor: '#ffd166',
                          color: '#24201a',
                          fontSize: '0.75rem',
                          borderRadius: '4px',
                          fontWeight: '700',
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        Coming Soon
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: 0, color: '#6b6151', fontSize: '0.88rem' }}>
                    Price: <strong style={{ color: '#e94f6b' }}>{Number(cat.price)} ETB</strong> | Lessons: {cat._count.lessons} | Position: {cat.position}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link
                    href={`/admin/categories/${cat.id}`}
                    style={{
                      padding: '0.6rem 1.1rem',
                      backgroundColor: '#24201a',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    Manage Curriculum ({cat._count.lessons})
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
