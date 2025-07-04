const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const clearToken = (res) => {
    res.clearCookie('token');
};

module.exports = { generateToken, clearToken };
