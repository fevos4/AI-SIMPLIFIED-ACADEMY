import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    await prisma.userSession.deleteMany({
      where: {
        id: sessionId,
        user_id: session.userId,
      },
    });

    return NextResponse.json({ success: true, message: 'Session logged out' });
  } catch (error) {
    console.error('Error logging out specific session:', error);
    return NextResponse.json({ error: 'Failed to log out session' }, { status: 500 });
  }
}
