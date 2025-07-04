// frontend/src/lib/auth.js
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

export const AUTH_TOKENS = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
};

export const getAccessToken = () => {
    return Cookies.get(AUTH_TOKENS.accessToken);
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
    if (accessToken) {
        const role = getUserRole();
        const redirectPath = getRedirectPath(role);
        return redirectPath;
    }
    return '/auth/sign-in?error=Authentication failed';
};