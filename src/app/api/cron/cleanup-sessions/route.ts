import { NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await cleanupExpiredSessions();
    return NextResponse.json({ success: true, deletedCount: count });
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return NextResponse.json({ error: 'Failed to cleanup sessions' }, { status: 500 });
  }
}
