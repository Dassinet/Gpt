const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshTokenAndSetCookie = (res, userId, role) => {
    const refreshToken = jwt.sign(
        { userId, role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return refreshToken;
};

const clearRefreshTokenCookie = (res) => {
    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0)
    });
};

module.exports = { generateAccessToken, generateRefreshTokenAndSetCookie, clearRefreshTokenCookie };
