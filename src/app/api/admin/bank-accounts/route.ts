import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllBankAccounts } from '@/lib/bank-accounts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const accounts = await getAllBankAccounts();
    return NextResponse.json({ bankAccounts: accounts });
  } catch (error: any) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ error: 'Failed to load bank accounts' }, { status: 500 });
  }
}
