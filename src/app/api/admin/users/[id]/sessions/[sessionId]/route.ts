import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId, sessionId } = await params;

    await prisma.userSession.deleteMany({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    return NextResponse.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    console.error('Error revoking specific admin user session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}
