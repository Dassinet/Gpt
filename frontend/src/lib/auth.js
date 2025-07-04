import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const AUTH_TOKENS = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
};

export const setTokens = (accessToken, refreshToken) => {
    if (accessToken) {
        Cookies.set(AUTH_TOKENS.accessToken, accessToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 15/1440, // 15 minutes expressed as fraction of days
        });
    }
    if (refreshToken) {
        Cookies.set(AUTH_TOKENS.refreshToken, refreshToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 7, // 7 days
        });
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
            // Token is expired, try to refresh it
            return false;
        }
        
        return true;
    } catch {
        return false;
    }
};

export const getUserRole = () => {
    const token = getAccessToken();
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return decoded.role || 'user';
    } catch {
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

export const refreshAccessToken = async () => {
    try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return false;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        const data = await response.json();
        
        if (!data.success) {
            removeTokens();
            return false;
        }

        setTokens(data.accessToken, null); // Only update access token
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