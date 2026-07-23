import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

// Peta akses: route => role yang diizinkan
const routePermissions: Record<string, string[]> = {
  '/dashboard':['ADMIN', 'CASHIER', 'WAREHOUSE'],
  '/pos':      ['CASHIER'],
  '/manager':  ['WAREHOUSE'],
  '/backup':   ['ADMIN'],
  '/reports':  ['ADMIN'],
  '/users':    ['ADMIN'],
  '/settings': ['ADMIN', 'CASHIER', 'WAREHOUSE'],
};

const protectedRoutes = Object.keys(routePermissions);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = request.cookies.get('session')?.value;

  // Jika bukan halaman yang dilindungi, lanjutkan
  const isProtected = protectedRoutes.some(route => path.startsWith(route));
  if (!isProtected) {
    // Jika sudah login dan mencoba akses halaman login, redirect ke halaman role
    if (path === '/' && session) {
      try {
        const payload = await decrypt(session);
        return NextResponse.redirect(new URL(getRoleHome(payload.role as string), request.url));
      } catch { /* session invalid */ }
    }
    return NextResponse.next();
  }

  // Belum login, redirect ke login
  if (!session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verifikasi token
  let payload: any;
  try {
    payload = await decrypt(session);
  } catch {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('session');
    return response;
  }

  const role = payload.role as string;

  // Cek izin akses per route
  const matchedRoute = protectedRoutes.find(route => path.startsWith(route));
  if (matchedRoute && !routePermissions[matchedRoute].includes(role)) {
    // Redirect ke halaman yang sesuai role-nya
    return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  }

  return NextResponse.next();
}

function getRoleHome(role: string): string {
  // Semua role sekarang punya dashboard
  return '/dashboard';
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
