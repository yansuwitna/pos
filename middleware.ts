import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

// Peta akses: route => role yang diizinkan
const routePermissions: Record<string, string[]> = {
  '/dashboard':['ADMIN', 'CASHIER', 'WAREHOUSE'],
  '/pos':      ['CASHIER'],
  '/manager/finances': ['ADMIN', 'WAREHOUSE', 'CASHIER'],
  '/manager':  ['WAREHOUSE', 'ADMIN'],
  '/backup':   ['ADMIN'],
  '/reports':  ['ADMIN'],
  '/users':    ['ADMIN'],
  '/customers':['ADMIN', 'CASHIER'],
  '/settings': ['ADMIN', 'CASHIER', 'WAREHOUSE'],
  '/super-admin': ['SUPER_ADMIN'],
};

// Sort by length descending so more specific routes (like /manager/finances) are checked before /manager
const protectedRoutes = Object.keys(routePermissions).sort((a, b) => b.length - a.length);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = request.cookies.get('session')?.value;

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  let baseUrl = request.url;
  if (host) {
    baseUrl = `${protocol}://${host}`;
  }

  // Jika bukan halaman yang dilindungi, lanjutkan
  const isProtected = protectedRoutes.some(route => path.startsWith(route));
  if (!isProtected) {
    // Jika sudah login dan mencoba akses halaman login, redirect ke halaman role
    if (path === '/' && session) {
      try {
        const payload = await decrypt(session);
        return NextResponse.redirect(new URL(getRoleHome(payload.role as string), baseUrl));
      } catch { /* session invalid */ }
    }
    return NextResponse.next();
  }

  // Belum login, redirect ke login
  if (!session) {
    return NextResponse.redirect(new URL('/', baseUrl));
  }

  // Verifikasi token
  let payload: any;
  try {
    payload = await decrypt(session);
  } catch {
    const response = NextResponse.redirect(new URL('/', baseUrl));
    response.cookies.delete('session');
    return response;
  }

  const role = payload.role as string;

  // Cek izin akses per route
  const matchedRoute = protectedRoutes.find(route => path.startsWith(route));
  if (matchedRoute && !routePermissions[matchedRoute].includes(role)) {
    // Redirect ke halaman yang sesuai role-nya
    return NextResponse.redirect(new URL(getRoleHome(role), baseUrl));
  }

  return NextResponse.next();
}

function getRoleHome(role: string): string {
  if (role === 'SUPER_ADMIN') return '/super-admin';
  return '/dashboard';
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
