import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const AUTH_TOKENS = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
};

export const setTokens = (accessToken, refreshToken) => {
    console.log('Setting tokens:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
    
    if (accessToken) {
        Cookies.set(AUTH_TOKENS.accessToken, accessToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 15/1440, // 15 minutes
            path: '/',
        });
        console.log('Access token set, checking if readable:', !!Cookies.get(AUTH_TOKENS.accessToken));
    }
    if (refreshToken) {
        Cookies.set(AUTH_TOKENS.refreshToken, refreshToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 7, // 7 days
            path: '/',
        });
        console.log('Refresh token set, checking if readable:', !!Cookies.get(AUTH_TOKENS.refreshToken));
    }
};

export const removeTokens = () => {
    Cookies.remove(AUTH_TOKENS.accessToken);
    Cookies.remove(AUTH_TOKENS.refreshToken);
};

export const getAccessToken = () => {
    return Cookies.get(AUTH_TOKENS.accessToken);
};

export const getRefreshToken = () => {
    return Cookies.get(AUTH_TOKENS.refreshToken);
};

export const isAuthenticated = () => {
    const token = getAccessToken();
    if (!token) return false;

    try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp < Date.now() / 1000;
        
        if (isExpired) {
            return false;
        }
        
        return true;
    } catch {
        return false;
    }
};

export const getUserRole = () => {
    const token = getAccessToken();
    console.log('Getting user role, token exists:', !!token);
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        return decoded.role || 'user';
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

export const getUser = () => {
    const token = getAccessToken();
    if (!token) return null;

    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
};

const REFRESH_TOKEN_THRESHOLD = 60 * 1000; // 1 minute before expiry

export const setupTokenRefresh = () => {
    // Check token expiration periodically
    const checkTokenExpiration = async () => {
        const accessToken = getAccessToken();
        if (!accessToken) return;

        try {
            const decoded = jwtDecode(accessToken);
            const expirationTime = decoded.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeUntilExpiry = expirationTime - currentTime;

            // If token is about to expire within the threshold, refresh it
            if (timeUntilExpiry <= REFRESH_TOKEN_THRESHOLD) {
                const success = await refreshAccessToken();
                if (!success) {
                    // If refresh fails, redirect to login
                    removeTokens();
                    window.location.href = '/auth/sign-in';
                }
            }
        } catch (error) {
            console.error('Token refresh check failed:', error);
            removeTokens();
            window.location.href = '/auth/sign-in';
        }
    };

    // Check every 30 seconds
    const intervalId = setInterval(checkTokenExpiration, 30000);
    
    // Initial check
    checkTokenExpiration();

    // Cleanup on unmount
    return () => clearInterval(intervalId);
};

export const refreshAccessToken = async () => {
    try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return false;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Refresh token request failed');
        }

        const data = await response.json();
        
        if (!data.success) {
            removeTokens();
            return false;
        }

        setTokens(data.accessToken, data.refreshToken); // Update both tokens if provided
        return true;
    } catch (error) {
        console.error('Token refresh failed:', error);
        removeTokens();
        return false;
    }
};

export const getRedirectPath = (role) => {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'user':
            return '/user/dashboard';
        default:
            return '/auth/sign-in';
    }
};

export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};

export const initiateGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
};

export const handleGoogleCallback = async (accessToken, refreshToken) => {
    console.log('Handling Google callback with tokens:', { 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken 
    });

    if (accessToken && refreshToken) {
        setTokens(accessToken, refreshToken);
        
        // Add a small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const role = getUserRole();
        console.log('User role after setting tokens:', role);
        const redirectPath = getRedirectPath(role);
        console.log('Redirecting to:', redirectPath);
        return redirectPath;
    }
    console.log('Missing tokens in callback');
    return '/auth/sign-in?error=Authentication failed';
}; 