const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const userEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (!userEmail) {
        return done(new Error("Could not retrieve email from Google."), false);
      }

      let user = await User.findOne({ email: userEmail });

      if (user) {
        if (!user.googleId) {
          user.googleId = profile.id;
          user.isVerified = true;
          await user.save();
        }
        return done(null, user);
      } else {
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: userEmail,
          profilePic: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          isVerified: true,
        });
        await newUser.save();
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, false);
    }
  }
));

module.exports = passport; 