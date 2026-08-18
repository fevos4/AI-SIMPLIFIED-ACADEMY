import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ManageAdminsPage() {
  const session = await getSession();
  
  // Super Admin ONLY check
  if (!session || session.role !== 'super_admin') {
    redirect('/admin');
  }

  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['admin', 'super_admin'] },
    },
    orderBy: { created_at: 'desc' },
  });

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <main style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '3.5rem 1.5rem', boxSizing: 'border-box' }}>
        <Link
          href="/admin"
          style={{
            color: '#191510',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '1rem',
            textDecoration: 'none',
            fontWeight: '500',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9rem',
          }}
        >
          ← Admin Dashboard
        </Link>
        <h1 style={{ marginBottom: '2.5rem', fontSize: '2.2rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
          Super Admin: Manage Admin Accounts
        </h1>

        <section style={{ border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px', padding: '2rem', marginBottom: '3rem', backgroundColor: '#FFFFFF' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.3rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
            Create New Admin Account
          </h2>
          <form action="/api/admin/manage-admins" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '450px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#191510', marginBottom: '0.4rem', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Admin Name"
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
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="admin@domain.com"
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
                minLength={8}
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
                Admin Role *
              </label>
              <select
                name="role"
                defaultValue="admin"
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
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
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
              Create Admin Account
            </button>
          </form>
        </section>

        <section>
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
            Existing Admin Accounts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {admins.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px', backgroundColor: '#FFFFFF' }}>
                <div>
                  <strong style={{ color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>{a.name}</strong>{' '}
                  <span style={{ color: '#9A9284', fontSize: '0.9rem' }}>({a.email})</span>
                </div>
                <span style={{ padding: '0.2rem 0.55rem', backgroundColor: '#191510', color: '#FFFFFF', fontSize: '0.72rem', borderRadius: '0px', fontWeight: '500', fontFamily: "'IBM Plex Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {a.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
