import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminSidebar from '@/components/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session && session.role === 'user') {
    redirect('/dashboard');
  }

  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    // Unauthenticated: render login page directly without extra wrapper div
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <AdminSidebar user={{ email: session.email, role: session.role }} />
      <div style={{ flex: 1, minWidth: 0, backgroundColor: '#FFFFFF' }}>
        {children}
      </div>
    </div>
  );
}
