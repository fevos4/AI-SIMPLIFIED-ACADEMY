import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();

  const isAuth = session && (session.role === 'admin' || session.role === 'super_admin');

  if (!isAuth) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#FFFFFF',
              borderRadius: '0px',
              border: '1px solid rgba(25, 21, 16, 0.2)',
              padding: '2.5rem 2rem',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1.5px solid #191510',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#191510',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                አ
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: '700', color: '#191510', margin: 0, letterSpacing: '-0.02em' }}>
                Admin Portal
              </h2>
            </div>
            <p style={{ color: '#55503F', fontSize: '0.92rem', margin: '0 0 1.75rem 0', lineHeight: '1.5', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Sign in with authorized admin credentials to manage platform content and payments.
            </p>

            <form action="/api/auth/login" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <input type="hidden" name="isAdminContext" value="true" />
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  backgroundColor: '#191510',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '0px',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Login to Admin Dashboard
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const categoryCount = await prisma.courseCategory.count();
  const pendingPurchaseCount = await prisma.coursePurchase.count({ where: { status: 'pending_verification' } });

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <main style={{ flex: 1, maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '3.5rem 1.5rem', boxSizing: 'border-box' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid rgba(25, 21, 16, 0.14)', paddingBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#A63A2C', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              ADMINISTRATION
            </span>
            <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '2.2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>Admin Portal</h1>
            <p style={{ margin: '0.35rem 0 0 0', color: '#55503F', fontSize: '0.95rem', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Logged in as <strong>{session.email}</strong> ({session.role})
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              style={{
                padding: '0.65rem 1.25rem',
                backgroundColor: '#191510',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0px',
                fontWeight: '500',
                fontSize: '0.88rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </form>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ padding: '1.75rem', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ margin: 0, color: '#9A9284', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'IBM Plex Sans', sans-serif" }}>Total Categories</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>{categoryCount}</p>
          </div>

          <div style={{ padding: '1.75rem', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px', backgroundColor: '#FFFFFF' }}>
            <h3 style={{ margin: 0, color: '#9A9284', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'IBM Plex Sans', sans-serif" }}>Pending Verification Queue</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0.5rem 0 0 0', color: pendingPurchaseCount > 0 ? '#C98A2E' : '#3F6B4A', fontFamily: "'Space Grotesk', sans-serif" }}>
              {pendingPurchaseCount}
            </p>
          </div>
        </div>

        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>Quick Management Links</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href="/admin/categories"
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: '#191510',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: '0px',
                fontWeight: '500',
                fontSize: '0.95rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>Manage Categories & Curriculum</span>
            </Link>
            <Link
              href="/admin/purchases"
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: '#A63A2C',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: '0px',
                fontWeight: '500',
                fontSize: '0.95rem',
                fontFamily: "'IBM Plex Sans', sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>CBE Purchase Verification Queue ({pendingPurchaseCount})</span>
            </Link>
            {session.role === 'super_admin' && (
              <Link
                href="/admin/manage-admins"
                style={{
                  padding: '0.9rem 1.5rem',
                  backgroundColor: '#191510',
                  color: '#FFFFFF',
                  border: '1px solid #191510',
                  textDecoration: 'none',
                  borderRadius: '0px',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Manage Admin Accounts</span>
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
