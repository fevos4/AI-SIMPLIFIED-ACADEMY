import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminPurchasesPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/admin');
  }

  const purchases = await prisma.coursePurchase.findMany({
    orderBy: [
      { status: 'asc' }, // pending_verification first
      { created_at: 'desc' },
    ],
    include: {
      user: {
        select: { name: true, email: true },
      },
      category: {
        select: { name: true, price: true },
      },
    },
  });

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'IBM Plex Sans', sans-serif", color: '#191510' }}>
      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '3.5rem 1.5rem', boxSizing: 'border-box' }}>
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
          CBE Payment Verification Queue
        </h1>

        <div style={{ overflowX: 'auto', border: '1px solid rgba(25, 21, 16, 0.14)', borderRadius: '0px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#FFFFFF', textAlign: 'left', fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <thead>
              <tr style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid rgba(25, 21, 16, 0.14)' }}>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Category</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CBE Ref #</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', fontWeight: '600', color: '#191510', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(25, 21, 16, 0.1)' }}>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <strong style={{ color: '#191510', fontFamily: "'Space Grotesk', sans-serif" }}>{p.user.name}</strong><br />
                    <span style={{ fontSize: '0.85rem', color: '#9A9284' }}>{p.user.email}</span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#191510' }}>{p.category.name}</td>
                  <td style={{ padding: '0.9rem 1rem', fontFamily: "'Space Grotesk', monospace", fontWeight: '700', color: '#191510' }}>{p.reference_number}</td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: '700', color: '#A63A2C', fontFamily: "'Space Grotesk', sans-serif" }}>{Number(p.amount_claimed)} ETB</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '0px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        border: p.status === 'verified' ? '1px solid #3F6B4A' : p.status === 'pending_verification' ? '1px solid #C98A2E' : '1px solid #A63A2C',
                        color: p.status === 'verified' ? '#3F6B4A' : p.status === 'pending_verification' ? '#C98A2E' : '#A63A2C',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {p.status === 'pending_verification' ? 'PENDING' : p.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    {p.status === 'pending_verification' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <form action={`/api/admin/purchases/${p.id}`} method="POST">
                          <input type="hidden" name="action" value="approve" />
                          <button type="submit" style={{ padding: '0.4rem 0.85rem', backgroundColor: '#191510', color: '#FFFFFF', border: 'none', borderRadius: '0px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                            Approve
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span style={{ color: '#9A9284', fontSize: '0.85rem' }}>Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
