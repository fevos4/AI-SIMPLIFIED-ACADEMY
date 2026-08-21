import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    const userSessions = await prisma.userSession.findMany({
      where: {
        user_id: userId,
        expires_at: { gt: new Date() },
      },
      select: {
        id: true,
        user_id: true,
        device_hint: true,
        ip_address: true,
        created_at: true,
        last_used_at: true,
        expires_at: true,
      },
      orderBy: { last_used_at: 'desc' },
    });

    return NextResponse.json(userSessions);
  } catch (error) {
    console.error('Error fetching admin user sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    await prisma.userSession.deleteMany({
      where: { user_id: userId },
    });

    return NextResponse.json({ success: true, message: 'All sessions revoked for user' });
  } catch (error) {
    console.error('Error revoking admin user sessions:', error);
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }
}
