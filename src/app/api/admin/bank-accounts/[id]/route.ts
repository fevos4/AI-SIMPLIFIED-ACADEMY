import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      account_name,
      account_number,
      phone_number,
      instructions,
      is_active,
    } = body;

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: {
        ...(account_name !== undefined ? { account_name: String(account_name).trim() } : {}),
        ...(account_number !== undefined ? { account_number: String(account_number).trim() } : {}),
        ...(phone_number !== undefined ? { phone_number: phone_number ? String(phone_number).trim() : null } : {}),
        ...(instructions !== undefined ? { instructions: instructions ? String(instructions).trim() : null } : {}),
        ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
      },
    });

    return NextResponse.json({ success: true, bankAccount: updated });
  } catch (error: any) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: error.message || 'Failed to update bank account' }, { status: 500 });
  }
}
