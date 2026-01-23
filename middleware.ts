import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isProtectedRoute = path.startsWith('/dashboard');
  const isPublicRoute = ['/login', '/forgot-password', '/reset-password'].includes(path);
  const token = request.cookies.get('session_token')?.value;

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

// 7. THE MATCHER: This tells Next.js which files to ignore (images, etc.)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};