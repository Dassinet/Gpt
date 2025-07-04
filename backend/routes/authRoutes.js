const express = require("express");
const router = express.Router();
const { SignUp, verifyEmail, signIn, logout, forgetPassword, resetpassword, refreshTokenController, resendVerification, getTeams, deleteUser, inviteUser, acceptInvitation, validateInvitation, getMe, updateProfile, updatePassword, updateApiKeys, handleGoogleCallback } = require("../controllers/authController");
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const passport = require('../lib/passport');


router.post("/signup", SignUp);
router.post("/verify-email/:code", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/signin", signIn);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);
router.put("/profile", protectRoute, updateProfile);
router.put("/password", protectRoute, updatePassword);
router.put("/api-keys", protectRoute, restrictTo('admin'), updateApiKeys);
router.post("/forgot-password", forgetPassword);
router.post("/reset-password/:token", resetpassword);
router.post("/refresh-token", refreshTokenController);
router.get("/teams", protectRoute, restrictTo('admin'), getTeams);
router.delete("/delete-user/:id", protectRoute, restrictTo('admin'), deleteUser);
router.post("/invite-user", protectRoute, restrictTo('admin'), inviteUser);
router.post("/accept-invitation/:token", acceptInvitation);
router.get("/validate-invitation/:token", validateInvitation);
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        session: false,
        failureRedirect: '/auth/sign-in?error=Google authentication failed' 
    }),
    handleGoogleCallback
);

module.exports = router;