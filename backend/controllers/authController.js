const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const { sendVerificationEmail, sendResetPasswordEmail, sendPasswordResetSuccessEmail, sendInvitationEmail, sendWelcomeEmail } = require("../mail/email");
const { generateAccessToken, generateRefreshTokenAndSetCookie, clearRefreshTokenCookie } = require("../lib/utils");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

const SignUp = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
            profilePic: req.file ? `/uploads/profilePics/${req.file.filename}` : undefined,
        });

        await newUser.save();
        await sendVerificationEmail(email, verificationToken);

        return res.status(201).json({
            success: true,
            message: 'Signup successful. Please verify your email.',
            userId: newUser._id
        });
    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const verifyEmail = async (req, res) => {
    const { code } = req.params;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();


        return res.status(200).json({
            success: true,
            message: 'Email verified successfully. Welcome to the app!',
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error('Error verifying email:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying email',
            error: error.message,
        });
    }
};

const signIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.password) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshTokenAndSetCookie(res, user._id, user.role);

        user.lastActive = new Date();
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePic: user.profilePic,
                isVerified: user.isVerified,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'No refresh token found' });
        }
        clearRefreshTokenCookie(res);
        return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getMe = async (req, res) => {
    try {
        if(!req.user){
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const user = req.user;
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error getting user:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const forgetPassword = async (req, res) => {
    const { email } = req.body;

    try {

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;
        await user.save();

        const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        await sendResetPasswordEmail(email, resetURL);

        return res.status(200).json({
            success: true,
            message: 'Reset password email sent successfully',
        });

    } catch (error) {
        console.error('Error during forget password:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during forget password',
            error: error.message,
        });
    }
}

const resetpassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        await sendPasswordResetSuccessEmail(user.email);

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });

    } catch (error) {
        console.error('Error during reset password:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during reset password',
            error: error.message,
        });
    }
};

const refreshTokenController = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token not found' });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshTokenAndSetCookie(res, user._id, user.role);

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: {
                _id: user._id,
                role: user.role,
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        clearRefreshTokenCookie(res);
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
};


const resendVerification = async (req, res) => {
    const { email, verificationToken } = req.body;

    try {
        let user;

        if (email) {
            user = await User.findOne({ email, isVerified: false });
        } else if (verificationToken) {
            user = await User.findOne({
                $or: [
                    { verificationToken: verificationToken },
                    { email: email }
                ],
                isVerified: false
            });
        }

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found or already verified'
            });
        }

        const now = Date.now();
        const lastResent = user.lastVerificationResent || 0;
        const timeDiff = now - lastResent;
        const oneMinute = 60 * 1000; // 1 minute in milliseconds

        if (timeDiff < oneMinute) {
            return res.status(429).json({
                success: false,
                message: 'Please wait at least 1 minute before requesting another verification code'
            });
        }

        const newVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        user.verificationToken = newVerificationToken;
        user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        user.lastVerificationResent = now;

        await user.save();

        await sendVerificationEmail(user.email, newVerificationToken);

        return res.status(200).json({
            success: true,
            message: 'Verification code resent successfully',
            email: user.email
        });

    } catch (error) {
        console.error('Error resending verification:', error);
        return res.status(500).json({
            success: false,
            message: 'Error resending verification code',
            error: error.message,
        });
    }
};

const getTeams = async (req, res) => {

    try {
        if (req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const teams = await User.find({ role: 'user' });
        return res.status(200).json({
            success: true,
            teams
        });
    } catch (error) {
        console.error('Error getting teams:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting teams',
            error: error.message,
        });
    }
}

const deleteUser = async (req, res) => {
    try{
        const { id } = req.params;
        const user = await User.findById(id);
        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if(user.role === 'admin'){
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin user'
            });
        }
        await user.deleteOne();
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({       
            success: false,
            message: 'Error deleting user',
            error: error.message,
        });
    }
}

const inviteUser = async (req, res) => {
    try {
        const { email, role } = req.body;
        if(!email || !role){
            return res.status(400).json({
                success: false,
                message: 'Email and role are required'
            });
        }
        
        if(req.user.role !== 'admin'){
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        const user = await User.findOne({ email });
        if(user){
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationTokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; 
        
        const newUser = new User({
            email, 
            role, 
            invitationToken,
            invitationTokenExpiresAt,
            isVerified: false
        });

        const invitationURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/accept-invitation/${invitationToken}`;

        await sendInvitationEmail(email, invitationURL);
        await newUser.save();

        return res.status(200).json({
            success: true,
            message: 'User invited successfully'
        });
    } catch (error) {
        console.error('Error inviting user:', error);
        return res.status(500).json({
            success: false,
            message: 'Error inviting user',
            error: error.message,
        });
    }
}

const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const { name, password } = req.body;
        
        if (!name || !password) {
            return res.status(400).json({
                success: false, 
                message: 'Name and password are required'
            });
        }
        
        const user = await User.findOne({
            invitationToken: token,
            invitationTokenExpiresAt: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired invitation token'
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        user.name = name;
        user.password = hashedPassword;
        user.isVerified = true;
        user.invitationToken = undefined;
        user.invitationTokenExpiresAt = undefined;
        
        await user.save();
        
        await sendWelcomeEmail(user.email, user.name);
        
        return res.status(200).json({
            success: true,
            message: 'Account setup successful. You can now log in.',
            email: user.email,
            role: user.role 
        });
        
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Error accepting invitation',
            error: error.message
        });
    }
};

const validateInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No invitation token provided'
      });
    }
    
    const user = await User.findOne({
      invitationToken: token,
      invitationTokenExpiresAt: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation token'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Invitation token is valid',
      email: user.email,
      role: user.role
    });
    
  } catch (error) {
    console.error('Error validating invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating invitation',
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
    try {
        const { name, department } = req.body;
        const userId = req.user._id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name is required' 
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                name: name.trim(), 
                department: department?.trim() || 'Not Assigned' 
            },
            { new: true, runValidators: true }
        ).select('-password -apiKeys');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while updating profile' 
        });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedNewPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while updating password' 
        });
    }
};

const updateApiKeys = async (req, res) => {
    try {
        const { apiKeys } = req.body;
        const userId = req.user._id;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only admin users can update API keys' 
            });
        }

        if (!apiKeys || typeof apiKeys !== 'object') {
            return res.status(400).json({ 
                success: false, 
                message: 'API keys object is required' 
            });
        }

        const validatedKeys = {};
        
        if (apiKeys.openai && apiKeys.openai.key && apiKeys.openai.key.trim()) {
            if (!apiKeys.openai.key.startsWith('sk-')) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid OpenAI API key format' 
                });
            }
            validatedKeys.openai = {
                key: apiKeys.openai.key.trim(),
                name: apiKeys.openai.name || 'OpenAI API Key',
                createdAt: apiKeys.openai.createdAt || new Date(),
                updatedAt: new Date()
            };
        }

        if (apiKeys.claude && apiKeys.claude.key && apiKeys.claude.key.trim()) {
            if (!apiKeys.claude.key.startsWith('sk-ant-')) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid Anthropic Claude API key format' 
                });
            }
            validatedKeys.claude = {
                key: apiKeys.claude.key.trim(),
                name: apiKeys.claude.name || 'Anthropic Claude API Key',
                createdAt: apiKeys.claude.createdAt || new Date(),
                updatedAt: new Date()
            };
        }

        if (apiKeys.gemini && apiKeys.gemini.key && apiKeys.gemini.key.trim()) {
            validatedKeys.gemini = {
                key: apiKeys.gemini.key.trim(),
                name: apiKeys.gemini.name || 'Google Gemini API Key',
                createdAt: apiKeys.gemini.createdAt || new Date(),
                updatedAt: new Date()
            };
        }

        if (apiKeys.llama && apiKeys.llama.key && apiKeys.llama.key.trim()) {
            validatedKeys.llama = {
                key: apiKeys.llama.key.trim(),
                name: apiKeys.llama.name || 'Meta Llama API Key',
                createdAt: apiKeys.llama.createdAt || new Date(),
                updatedAt: new Date()
            };
        }

        if (apiKeys.openrouter && apiKeys.openrouter.key && apiKeys.openrouter.key.trim()) {
            if (!apiKeys.openrouter.key.startsWith('sk-or-')) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid OpenRouter API key format' 
                });
            }
            validatedKeys.openrouter = {
                key: apiKeys.openrouter.key.trim(),
                name: apiKeys.openrouter.name || 'OpenRouter API Key',
                createdAt: apiKeys.openrouter.createdAt || new Date(),
                updatedAt: new Date()
            };
        }

        if (apiKeys.tavily && apiKeys.tavily.key && apiKeys.tavily.key.trim()) {
            if (!apiKeys.tavily.key.startsWith('tvly-')) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid Tavily Search API key format' 
                });
            }
            validatedKeys.tavily = {
                key: apiKeys.tavily.key.trim(),
                name: apiKeys.tavily.name || 'Tavily Search API Key',
                createdAt: apiKeys.tavily.createdAt || new Date(),
                updatedAt: new Date()
            };
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { apiKeys: validatedKeys },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'API keys updated successfully',
            apiKeys: user.apiKeys
        });
    } catch (error) {
        console.error('Error updating API keys:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error while updating API keys' 
        });
    }
};

const handleGoogleCallback = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=Google authentication failed`);
        }

        const accessToken = generateAccessToken(req.user._id, req.user.role);
        const refreshToken = generateRefreshTokenAndSetCookie(res, req.user._id, req.user.role);

        // Redirect to frontend with tokens
        const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/google/callback`);
        redirectUrl.searchParams.set('accessToken', accessToken);
        redirectUrl.searchParams.set('refreshToken', refreshToken);
        
        return res.redirect(redirectUrl.toString());
    } catch (error) {
        console.error('Google callback error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/auth/sign-in?error=Server error`);
    }
};

module.exports = {
    SignUp,
    verifyEmail,
    signIn,
    logout,
    getMe,
    updateProfile,
    updatePassword,
    updateApiKeys,
    forgetPassword,
    resetpassword,
    refreshTokenController,
    resendVerification,
    getTeams,
    deleteUser,
    inviteUser,
    acceptInvitation,
    validateInvitation,
    handleGoogleCallback
};