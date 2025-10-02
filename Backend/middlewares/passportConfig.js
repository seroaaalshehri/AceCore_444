const passport = require("passport");
const TwitchStrategy = require("passport-twitch-new").Strategy;
require("dotenv").config();

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new TwitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/api/users/auth/twitch/callback",
      scope: ["user:read:email", "user:read:broadcast"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const user = {
        twitchId: profile.id,
        displayName: profile.display_name,
        email: profile.email,
        profileImage: profile.profile_image_url,
        accessToken,
        refreshToken,
      };
      return done(null, user);
    }
  )
);
