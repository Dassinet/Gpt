const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { generateAccessToken, generateRefreshTokenAndSetCookie } = require('../lib/utils');

const protectRoute = async (req, res, next) => {
    try {
        let token = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        // If no access token but has refresh token, try to refresh
        if (!token && refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                const user = await User.findById(decoded.userId);

                if (user) {
                    // Generate new access token and set in cookie
                    token = generateAccessToken(user._id, user.role);
                    res.cookie('accessToken', token, {
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 15 * 60 * 1000, // 15 minutes
                        path: '/',
                    });
                }
            } catch (error) {
                console.error('Refresh token verification failed:', error.message);
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Please log in to access this resource'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

module.exports = { protectRoute, restrictTo };
