import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const currentUser = request.cookies.get('id')?.value
    const isAdmin = request.cookies.get('admin')?.value === 'true';
    const url = request.nextUrl

    // If not authenticated and trying to access a protected route, redirect to login
    if (!currentUser && !['/login', '/register', '/about'].includes(url.pathname)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If not an admin and trying to access /admin, redirect to /home
    if (url.pathname === '/admin' && !isAdmin) {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    // Handle the root path separately
    if (url.pathname === '/') {
        if (!currentUser) {
            return NextResponse.redirect(new URL('/login', request.url));
        } else {
            return NextResponse.redirect(new URL('/home', request.url));
        }
    }

    // Continue with the request for all other cases
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
