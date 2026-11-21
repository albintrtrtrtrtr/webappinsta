import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Direct root access must always pass through cleanly
    if (pathname === '/') {
      return NextResponse.next();
    }

    // Support /en locale alias by rewriting to root without redirect loop
    if (pathname === '/en') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.rewrite(url);
    }

    if (pathname.startsWith('/en/')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.replace(/^\/en/, '') || '/';
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  } catch (err) {
    console.error('Middleware execution error:', err);
    return NextResponse.next();
  }
}

export const config = {
  // Only match routes that start with /en to prevent intercepting root or standard routes
  matcher: ['/en', '/en/:path*'],
};
