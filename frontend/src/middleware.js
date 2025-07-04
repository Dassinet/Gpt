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
    
    // Get tokens from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    // If no access token but has refresh token, try to refresh
    if (!accessToken && refreshToken) {
        try {
            // Try to refresh the token
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `refreshToken=${refreshToken}`,
                },
                credentials: 'include',
            });

            const data = await response.json();
            
            if (data.success) {
                // Create response and set the new access token
                const res = NextResponse.next();
                
                // Set the new access token as a regular cookie (not httpOnly)
                res.cookies.set({
                    name: 'accessToken',
                    value: data.accessToken,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 15, // 15 minutes in seconds
                    path: '/'
                });
                
                return res;
            }
            
            // If refresh failed, redirect to login
            const url = new URL('/auth/sign-in', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        } catch (error) {
            // If refresh fails, redirect to login
            const url = new URL('/auth/sign-in', request.url);
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
    }
    
    // If no tokens at all, redirect to login
    if (!accessToken && !refreshToken) {
        const url = new URL('/auth/sign-in', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }
    
    try {
        // Decode the access token
        const decoded = jwtDecode(accessToken);
        const userRole = decoded.role || 'user';
        const isExpired = decoded.exp < Date.now() / 1000;
        
        // If token is expired but has refresh token, try to refresh
        if (isExpired && refreshToken) {
            try {
                // Try to refresh the token
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `refreshToken=${refreshToken}`,
                    },
                    credentials: 'include',
                });
    
                const data = await response.json();
                
                if (data.success) {
                    // Create response and set the new access token
                    const res = NextResponse.next();
                    
                    // Set the new access token as a regular cookie (not httpOnly)
                    res.cookies.set({
                        name: 'accessToken',
                        value: data.accessToken,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 15, // 15 minutes in seconds
                        path: '/'
                    });
                    
                    return res;
                }
                
                // If refresh failed, redirect to login
                const url = new URL('/auth/sign-in', request.url);
                url.searchParams.set('redirect', pathname);
                return NextResponse.redirect(url);
            } catch (error) {
                // If refresh fails, redirect to login
                const url = new URL('/auth/sign-in', request.url);
                url.searchParams.set('redirect', pathname);
                return NextResponse.redirect(url);
            }
        }
        
        // If token is expired and no refresh token, redirect to login
        if (isExpired && !refreshToken) {
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

        if (USER_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
            if (userRole !== 'user') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
        }
        
        // Check user routes access
        if (USER_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
            if (userRole !== 'user' && userRole !== 'admin') {
                return NextResponse.redirect(new URL('/auth/sign-in', request.url));
            }
        }
        
        // Allow the request
        return NextResponse.next();
    } catch (error) {
        // If token is invalid but has refresh token, try to refresh
        if (refreshToken) {
            try {
                // Try to refresh the token
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `refreshToken=${refreshToken}`,
                    },
                    credentials: 'include',
                });
    
                const data = await response.json();
                
                if (data.success) {
                    // Create response and set the new access token
                    const res = NextResponse.next();
                    
                    // Set the new access token as a regular cookie (not httpOnly)
                    res.cookies.set({
                        name: 'accessToken',
                        value: data.accessToken,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 15, // 15 minutes in seconds
                        path: '/'
                    });
                    
                    return res;
                }
                
                // If refresh failed, redirect to login
                const url = new URL('/auth/sign-in', request.url);
                url.searchParams.set('redirect', pathname);
                return NextResponse.redirect(url);
            } catch (error) {
                // If refresh fails, redirect to login
                const url = new URL('/auth/sign-in', request.url);
                url.searchParams.set('redirect', pathname);
                return NextResponse.redirect(url);
            }
        }
        
        // If token is invalid and no refresh token, redirect to login
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