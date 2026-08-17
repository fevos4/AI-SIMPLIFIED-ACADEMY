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
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <Link href="/admin" style={{ color: '#0066cc', display: 'inline-block', marginBottom: '1rem' }}>← Admin Dashboard</Link>
      <h1 style={{ marginBottom: '2rem' }}>CBE Payment Verification Queue</h1>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#edf2f7' }}>
              <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e0' }}>Student</th>
              <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e0' }}>Course Category</th>
              <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e0' }}>CBE Ref #</th>
              <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e0' }}>Amount</th>
              <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e0' }}>Status</th>
              <th style={{ padding: '0.75rem', borderBottom: '2px solid #cbd5e0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>
                  <strong>{p.user.name}</strong><br />
                  <span style={{ fontSize: '0.85rem', color: '#718096' }}>{p.user.email}</span>
                </td>
                <td style={{ padding: '0.75rem' }}>{p.category.name}</td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{p.reference_number}</td>
                <td style={{ padding: '0.75rem' }}>{Number(p.amount_claimed)} ETB</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    backgroundColor: p.status === 'verified' ? '#c6f6d5' : p.status === 'pending_verification' ? '#feebc8' : '#fed7d7',
                    color: p.status === 'verified' ? '#22543d' : p.status === 'pending_verification' ? '#744210' : '#742a2a',
                  }}>
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {p.status === 'pending_verification' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <form action={`/api/admin/purchases/${p.id}`} method="POST">
                        <input type="hidden" name="action" value="approve" />
                        <button type="submit" style={{ padding: '0.3rem 0.6rem', backgroundColor: '#38a169', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                          Approve
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span style={{ color: '#a0aec0', fontSize: '0.85rem' }}>Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
