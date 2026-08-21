import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getJwtSession, refreshAdminSession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await getJwtSession(req);

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isUserProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/user');
  const isPublicLogin = pathname === '/login';

  // Authenticated admins visiting /login or /dashboard/* -> redirect to /admin
  if (session && (session.role === 'admin' || session.role === 'super_admin')) {
    if (isPublicLogin || pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  // Authenticated users (role = 'user') visiting sub-routes under /admin/* or /api/admin/* -> redirect to /dashboard
  // Note: /admin root is handled directly by /admin/page.tsx which checks database session state.
  if (session && session.role === 'user' && isAdminRoute && pathname !== '/admin') {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Admin route protection for unauthenticated visitors
  if (isAdminRoute) {
    const isApiAdmin = pathname.startsWith('/api/admin');
    if (!session) {
      if (isApiAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // If visiting /admin root while unauthenticated, allow to render /admin login form
      // If visiting sub-routes under /admin (e.g. /admin/categories), redirect to /admin
      if (pathname !== '/admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    } else {
      // Sliding idle timeout refresh for authenticated admin requests
      const res = NextResponse.next();
      return refreshAdminSession(res, session);
    }
  }

  // User protected route protection (/dashboard/* and /api/user/*) for unauthenticated visitors
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
