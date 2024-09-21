import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const currentUser = request.cookies.get('id')?.value
    const url = request.nextUrl

    // If not authenticated and trying to access a protected route, redirect to login
    if (!currentUser && !['/login', '/register'].includes(url.pathname)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

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
