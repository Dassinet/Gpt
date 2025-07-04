const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { generateAccessToken, generateRefreshTokenAndSetCookie } = require('../lib/utils');

const protectRoute = async (req, res, next) => {
    let token = req.cookies.accessToken;

    if (!token) {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed: No tokens provided.'
            });
        }
        
        try {
            // If no access token, try to refresh immediately
            const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await User.findById(decodedRefresh.userId);

            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
            }

            token = generateAccessToken(user._id, user.role);
            res.cookie('accessToken', token, {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
                path: '/',
            });
            
            req.user = user;
            return next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed: Invalid refresh token.'
            });
        }
    }

    try {
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
        if (error.name === 'TokenExpiredError') {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed: Token expired and no refresh token.'
                });
            }

            try {
                const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                const user = await User.findById(decodedRefresh.userId);

                if (!user) {
                    return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
                }

                const newAccessToken = generateAccessToken(user._id, user.role);
                res.cookie('accessToken', newAccessToken, {
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 15 * 60 * 1000,
                    path: '/',
                });

                req.user = user;
                return next();
            } catch (refreshError) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed: Could not refresh token.'
                });
            }
        }

        return res.status(401).json({
            success: false,
            message: 'Authentication failed: Invalid token.'
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
