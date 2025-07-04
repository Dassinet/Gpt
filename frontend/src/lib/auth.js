import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export const AUTH_TOKENS = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
};

export const setTokens = (accessToken, refreshToken) => {
    console.log('Setting tokens:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
    
    if (accessToken) {
        const accessTokenStr = String(accessToken);
        Cookies.set(AUTH_TOKENS.accessToken, accessTokenStr, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 15/1440, // 15 minutes
            path: '/',
        });
        console.log('Access token set, checking if readable:', !!Cookies.get(AUTH_TOKENS.accessToken));
    }
    if (refreshToken) {
        const refreshTokenStr = String(refreshToken);
        Cookies.set(AUTH_TOKENS.refreshToken, refreshTokenStr, {
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

export const getAccessToken = async () => {
    const token = Cookies.get(AUTH_TOKENS.accessToken);
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp < Date.now() / 1000;
        
        if (isExpired) {
            // Try to refresh the token
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                return Cookies.get(AUTH_TOKENS.accessToken);
            }
            return null;
        }
        
        return token;
    } catch {
        return null;
    }
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
    try {
        const token = Cookies.get(AUTH_TOKENS.accessToken);
        console.log('Getting user role, token exists:', !!token);
        if (!token) return null;

        // Ensure token is a string
        const tokenStr = String(token);
        const decoded = jwtDecode(tokenStr);
        console.log('Decoded token:', decoded);
        return decoded.role || null;
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
            credentials: 'include', // Important for cookies
        });

        if (!response.ok) {
            throw new Error('Refresh token request failed');
        }

        const data = await response.json();
        
        if (!data.success) {
            removeTokens();
            return false;
        }

        // The backend should set the cookies automatically
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

    if (!accessToken || !refreshToken) {
        console.error('Missing tokens in callback');
        return '/auth/sign-in?error=Authentication failed';
    }

    try {
        // Ensure tokens are strings
        const accessTokenStr = String(accessToken);
        const refreshTokenStr = String(refreshToken);
        
        // Set the tokens
        setTokens(accessTokenStr, refreshTokenStr);
        
        // Add a small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify the token is valid before getting the role
        try {
            const decoded = jwtDecode(accessTokenStr);
            if (!decoded || !decoded.role) {
                throw new Error('Invalid token structure');
            }
            console.log('Decoded token:', decoded);
            const role = decoded.role;
            console.log('User role after setting tokens:', role);
            const redirectPath = getRedirectPath(role);
            console.log('Redirecting to:', redirectPath);
            return redirectPath;
        } catch (decodeError) {
            console.error('Error decoding token:', decodeError);
            return '/auth/sign-in?error=Invalid token';
        }
    } catch (error) {
        console.error('Error in handleGoogleCallback:', error);
        return '/auth/sign-in?error=Authentication failed';
    }
}; 