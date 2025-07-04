// frontend/src/lib/auth.js
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import axios from 'axios';

export const AUTH_TOKENS = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
};

export const setTokens = (accessToken, refreshToken) => {
    if (accessToken) {
        Cookies.set(AUTH_TOKENS.accessToken, accessToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 15/1440, // 15 minutes
            path: '/',
        });
    }
    if (refreshToken) {
        Cookies.set(AUTH_TOKENS.refreshToken, refreshToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 7, // 7 days
            path: '/',
        });
    }
};

export const getAccessToken = () => {
    return Cookies.get(AUTH_TOKENS.accessToken);
};

export const getRefreshToken = () => {
    return Cookies.get(AUTH_TOKENS.refreshToken);
};

export const removeTokens = () => {
    Cookies.remove(AUTH_TOKENS.accessToken);
    Cookies.remove(AUTH_TOKENS.refreshToken);
};

export const isAuthenticated = () => {
    const token = getAccessToken();
    if (!token) return false;

    try {
        const decoded = jwtDecode(token);
        return decoded.exp > Date.now() / 1000;
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
        // Set the tokens in cookies
        setTokens(accessToken, refreshToken);
        
        // Wait a moment for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get user role from the token
        const decoded = jwtDecode(accessToken);
        const role = decoded.role || 'user';
        
        console.log('User role from token:', role);
        const redirectPath = getRedirectPath(role);
        console.log('Redirecting to:', redirectPath);
        return redirectPath;
    }
    
    console.error('Missing tokens in callback');
    return '/auth/sign-in?error=Authentication failed';
};

// Create axios instance with interceptors
export const createAuthenticatedAxios = () => {
    const instance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
    });

    instance.interceptors.request.use(
        (config) => {
            const token = getAccessToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // If error is 401 and we haven't tried to refresh token yet
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Try to refresh the token
                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`,
                        {},
                        { withCredentials: true }
                    );

                    if (response.data.success) {
                        setTokens(response.data.accessToken, response.data.refreshToken);
                        
                        // Retry the original request with new token
                        originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
                        return instance(originalRequest);
                    }
                } catch (refreshError) {
                    // If refresh fails, logout user
                    removeTokens();
                    window.location.href = '/auth/sign-in';
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

// Create a singleton instance
export const authenticatedAxios = createAuthenticatedAxios();