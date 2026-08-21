import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAllBankAccounts } from '@/lib/bank-accounts';
import AdminBankAccountsClient from '@/components/AdminBankAccountsClient';

export const dynamic = 'force-dynamic';

export default async function AdminBankAccountsPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    redirect('/admin');
  }

  const bankAccounts = await getAllBankAccounts();

  return <AdminBankAccountsClient initialBankAccounts={bankAccounts} />;
}
