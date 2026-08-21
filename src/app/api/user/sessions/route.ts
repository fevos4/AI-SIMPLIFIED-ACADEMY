import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSessions = await prisma.userSession.findMany({
      where: {
        user_id: session.userId,
        expires_at: { gt: new Date() },
      },
      select: {
        id: true,
        device_hint: true,
        ip_address: true,
        created_at: true,
        last_used_at: true,
        expires_at: true,
      },
      orderBy: { last_used_at: 'desc' },
    });

    const sessionsWithCurrent = userSessions.map(s => ({
      ...s,
      is_current: s.id === session.sessionId,
    }));

    return NextResponse.json(sessionsWithCurrent);
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.userSession.deleteMany({
      where: {
        user_id: session.userId,
        id: { not: session.sessionId },
      },
    });

    return NextResponse.json({ success: true, message: 'All other sessions logged out' });
  } catch (error) {
    console.error('Error revoking other sessions:', error);
    return NextResponse.json({ error: 'Failed to revoke other sessions' }, { status: 500 });
  }
}
