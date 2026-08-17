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
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <Link href="/admin" style={{ color: '#0066cc', display: 'inline-block', marginBottom: '1rem' }}>← Admin Dashboard</Link>
      <h1 style={{ marginBottom: '2rem' }}>Super Admin: Manage Admin Accounts</h1>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', marginBottom: '2.5rem', backgroundColor: '#f7fafc' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Create New Admin Account</h2>
        <form action="/api/admin/manage-admins" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '450px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Full Name</label>
            <input type="text" name="name" required placeholder="Admin Name" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Email Address</label>
            <input type="email" name="email" required placeholder="admin@domain.com" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Password</label>
            <input type="password" name="password" required minLength={8} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>Admin Role</label>
            <select name="role" defaultValue="admin" style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#805ad5', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Create Admin Account
          </button>
        </form>
      </section>

      <section>
        <h2>Existing Admin Accounts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {admins.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div>
                <strong>{a.name}</strong> ({a.email})
              </div>
              <span style={{ padding: '0.2rem 0.5rem', backgroundColor: a.role === 'super_admin' ? '#805ad5' : '#319795', color: '#fff', fontSize: '0.8rem', borderRadius: '4px', fontWeight: 'bold' }}>
                {a.role.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
