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
    '/auth/social-callback',
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
    
    // Get token from localStorage - Note: In middleware we need to get it from request headers or cookies
    const token = request.cookies.get('token')?.value;
    
    // If no token, redirect to login
    if (!token) {
        const url = new URL('/auth/sign-in', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }
    
    try {
        // Decode and verify the token
        const decoded = jwtDecode(token);
        const userRole = decoded.role || 'user';
        const isExpired = decoded.exp < Date.now() / 1000;
        
        // If token is expired, redirect to login
        if (isExpired) {
            const url = new URL('/auth/sign-in', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
        
        // Check admin routes access
        if (ADMIN_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
            if (userRole !== 'admin') {
                return NextResponse.redirect(new URL('/user/dashboard', request.url));
            }
        }

        // Check user routes access
        if (USER_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
            if (userRole !== 'user') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
        }
        
        // Allow the request
        return NextResponse.next();
    } catch (error) {
        console.error('Token verification error:', error);
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
        '/((?!api|_next/static|_next/image|favicon.png|public/horizontal.png).*)',
    ],
}; 