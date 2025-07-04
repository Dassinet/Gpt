import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'token';

export const setToken = (token) => {
    if (token) {
        // Set token in both cookie and localStorage
        Cookies.set(TOKEN_KEY, token, {
            expires: 1, // 1 day
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        localStorage.setItem(TOKEN_KEY, token); // Keep for client-side access
    }
};

export const removeToken = () => {
    Cookies.remove(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
};

export const getToken = () => {
    return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    try {
        const decoded = jwtDecode(token);
        return decoded.exp > Date.now() / 1000;
    } catch {
        return false;
    }
};

export const getUserRole = () => {
    const token = getToken();
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return decoded.role || 'user';
    } catch {
        return null;
    }
};

export const getUser = () => {
    const token = getToken();
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