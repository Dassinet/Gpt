import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/verify-email',
    '/auth/reset-password',
    '/auth/forgot-password',
    '/auth/accept-invitation',
    '/auth/google/callback',
    '/',
];

// Define admin-only paths
const ADMIN_PATHS = [
    '/admin/dashboard',
    '/admin/collections',
    '/admin/history',
    '/admin/settings',
    '/admin/teams',
];

// Define user-only paths
const USER_PATHS = [
    '/user/dashboard',
    '/user/settings',
    '/user/collections',
    '/user/history',
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    
    // Allow public paths
    if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
        return NextResponse.next();
    }
    
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
        const url = new URL('/auth/sign-in', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }
    
    try {
        const decoded = jwtDecode(accessToken);
        const userRole = decoded.role || 'user';
        
        // Check admin routes access
        if (ADMIN_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
            if (userRole !== 'admin') {
                return NextResponse.redirect(new URL('/user/dashboard', request.url));
            }
        }

        // Check user routes access
        if (USER_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
            if (userRole !== 'user' && userRole !== 'admin') {
                return NextResponse.redirect(new URL('/auth/sign-in', request.url));
            }
        }
        
        return NextResponse.next();
    } catch (error) {
        const url = new URL('/auth/sign-in', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }
}

export const config = {
    matcher: [
        /*
         * Match all paths except static files and API routes
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
    ],
}; 