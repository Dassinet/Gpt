const express = require("express");
const router = express.Router();
const { SignUp, verifyEmail, signIn, logout, forgetPassword, resetpassword, resendVerification, getTeams, deleteUser, inviteUser, acceptInvitation, validateInvitation, getMe, updateProfile, updatePassword, updateApiKeys, googleAuth, googleAuthCallback, updateUserRole } = require("../controllers/authController");
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");
const passport = require('passport');


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
router.get("/teams", protectRoute, getTeams);
router.delete("/delete-user/:id", protectRoute, restrictTo('admin'), deleteUser);
router.post("/invite-user", protectRoute, restrictTo('admin'), inviteUser);
router.post("/accept-invitation/:token", acceptInvitation);
router.get("/validate-invitation/:token", validateInvitation);
router.get('/google', googleAuth);
router.get(
    '/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', session: false }), 
    googleAuthCallback
);
router.put("/update-role/:id", protectRoute, restrictTo('admin'), updateUserRole);

module.exports = router;