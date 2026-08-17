import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();

  const isAuth = session && (session.role === 'admin' || session.role === 'super_admin');

  if (!isAuth) {
    return (
      <div style={{ backgroundColor: '#fdf9f2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', fontFamily: "'Inter', sans-serif", color: '#24201a' }}>
        <main
          style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #ecdfc4',
            boxShadow: '0 8px 24px rgba(36, 32, 26, 0.06)',
            padding: '2.5rem 2rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e94f6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '1.1rem' }}>
              🛡️
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: '700', color: '#24201a', margin: 0 }}>
              Admin Portal
            </h2>
          </div>
          <p style={{ color: '#6b6151', fontSize: '0.92rem', margin: '0 0 1.75rem 0' }}>
            Sign in with authorized admin credentials to manage platform content and payments.
          </p>

          <form action="/api/auth/login" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <input type="hidden" name="isAdminContext" value="true" />
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#24201a', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                Admin Email *
              </label>
              <input
                type="email"
                name="email"
                required
                defaultValue="admin@elearning.com"
                placeholder="admin@elearning.com"
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
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                defaultValue="AdminPassword123!"
                placeholder="Enter password"
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
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.9rem',
                backgroundColor: '#e94f6b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.95rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: 'pointer',
                textTransform: 'uppercase',
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                marginTop: '0.5rem',
              }}
            >
              Login to Admin Dashboard
            </button>
          </form>
        </main>
      </div>
    );
  }

  const categoryCount = await prisma.courseCategory.count();
  const pendingPurchaseCount = await prisma.coursePurchase.count({ where: { status: 'pending_verification' } });

  return (
    <div style={{ backgroundColor: '#fdf9f2', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#24201a', padding: '2.5rem 2rem' }}>
      <main style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #ecdfc4', paddingBottom: '1.25rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>Admin Portal</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#6b6151', fontSize: '0.95rem' }}>
              Logged in as <strong>{session.email}</strong> ({session.role})
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#24201a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.88rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </form>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ padding: '1.75rem', border: '1px solid #ecdfc4', borderRadius: '14px', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)' }}>
            <h3 style={{ margin: 0, color: '#6b6151', fontSize: '0.95rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>Total Categories</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#24201a', fontFamily: "'Space Grotesk', sans-serif" }}>{categoryCount}</p>
          </div>

          <div style={{ padding: '1.75rem', border: '1px solid #ecdfc4', borderRadius: '14px', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)' }}>
            <h3 style={{ margin: 0, color: '#6b6151', fontSize: '0.95rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif" }}>Pending Verification Queue</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: pendingPurchaseCount > 0 ? '#e94f6b' : '#05b98a', fontFamily: "'Space Grotesk', sans-serif" }}>
              {pendingPurchaseCount}
            </p>
          </div>
        </div>

        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem' }}>Quick Management Links</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href="/admin/categories"
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: '#24201a',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.95rem',
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              }}
            >
              📁 Manage Categories & Curriculum
            </Link>
            <Link
              href="/admin/purchases"
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: '#e94f6b',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.95rem',
                fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
              }}
            >
              💳 CBE Purchase Verification Queue ({pendingPurchaseCount})
            </Link>
            {session.role === 'super_admin' && (
              <Link
                href="/admin/manage-admins"
                style={{
                  padding: '0.9rem 1.5rem',
                  backgroundColor: '#05b98a',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  boxShadow: '0 1px 2px rgba(36, 32, 26, 0.04)',
                }}
              >
                👑 Manage Admin Accounts
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
