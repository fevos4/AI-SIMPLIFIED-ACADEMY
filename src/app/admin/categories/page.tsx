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
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <main style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '3.5rem 1.5rem', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <Link
              href="/admin"
              style={{
                color: '#191510',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.5rem',
                textDecoration: 'none',
                fontWeight: '500',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.9rem',
              }}
            >
              ← Admin Dashboard
            </Link>
            <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
              Manage Course Categories
            </h1>
          </div>
        </div>

        {/* Create Category Section */}
        <section
          style={{
            border: '1px solid rgba(25, 21, 16, 0.14)',
            borderRadius: '0px',
            padding: '2rem',
            marginBottom: '3rem',
            backgroundColor: '#FFFFFF',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
            Create New Category
          </h2>
          <form action="/api/admin/categories" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '540px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Physics - Grade 12"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '0px',
                  border: '1.5px solid #191510',
                  backgroundColor: '#FFFFFF',
                  color: '#191510',
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Short overview of what students will learn in this category..."
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '0px',
                  border: '1.5px solid #191510',
                  backgroundColor: '#FFFFFF',
                  color: '#191510',
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Price (ETB) *
                </label>
                <input
                  type="number"
                  name="price"
                  defaultValue={500}
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    backgroundColor: '#FFFFFF',
                    color: '#191510',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Position
                </label>
                <input
                  type="number"
                  name="position"
                  defaultValue={categories.length + 1}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0px',
                    border: '1.5px solid #191510',
                    backgroundColor: '#FFFFFF',
                    color: '#191510',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input type="checkbox" name="coming_soon" id="coming_soon" value="true" style={{ width: '18px', height: '18px', accentColor: '#191510' }} />
              <label htmlFor="coming_soon" style={{ fontWeight: '500', fontSize: '0.9rem', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
                Mark as "Coming Soon"
              </label>
            </div>

            <button
              type="submit"
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: '#191510',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0px',
                fontWeight: '500',
                fontSize: '0.95rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Create Category
            </button>
          </form>
        </section>

        {/* Existing Categories List */}
        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
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
                  border: '1px solid rgba(25, 21, 16, 0.14)',
                  borderRadius: '0px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: '#191510' }}>
                    {cat.name}
                    {cat.coming_soon && (
                      <span
                        style={{
                          marginLeft: '0.6rem',
                          padding: '0.15rem 0.5rem',
                          backgroundColor: '#191510',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          borderRadius: '0px',
                          fontWeight: '500',
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Coming Soon
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: 0, color: '#55503F', fontSize: '0.88rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    Price: <strong style={{ color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif" }}>{Number(cat.price)} ETB</strong> | Lessons: {cat._count.lessons} | Position: {cat.position}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link
                    href={`/admin/categories/${cat.id}`}
                    style={{
                      padding: '0.6rem 1.1rem',
                      backgroundColor: '#191510',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      borderRadius: '0px',
                      fontWeight: '500',
                      fontSize: '0.85rem',
                      fontFamily: "'IBM Plex Sans', sans-serif",
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
