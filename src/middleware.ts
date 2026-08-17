import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, refreshAdminSession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await getSession(req);

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isUserProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/user');

  // Admin route protection (/admin/* and /api/admin/*)
  if (isAdminRoute) {
    const isApiAdmin = pathname.startsWith('/api/admin');
    
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      if (isApiAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // For page routes under /admin (except root /admin which serves login form/dashboard)
      if (pathname !== '/admin') {
        const loginUrl = new URL('/admin', req.url);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      // Sliding idle timeout refresh for authenticated admin requests
      const res = NextResponse.next();
      return refreshAdminSession(res, session);
    }
  }

  // User protected route protection (/dashboard/* and /api/user/*)
  if (isUserProtectedRoute) {
    const isApiUser = pathname.startsWith('/api/user');

    if (!session) {
      if (isApiUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
