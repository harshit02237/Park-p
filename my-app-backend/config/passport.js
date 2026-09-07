const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
require('dotenv').config();

const User = mongoose.model('User');

passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

const clientID = (process.env.GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, '').trim();
const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').replace(/^["']|["']$/g, '').trim();
const callbackURL = (
  process.env.GOOGLE_CALLBACK_URL ||
  (process.env.BACKEND_URL ? `${process.env.BACKEND_URL.replace(/\/$/, '')}/api/auth/google/callback` : '/api/auth/google/callback')
).replace(/^["']|["']$/g, '').trim();

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
      proxy: true,
      passReqToCallback: true,
    },


    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let requestedRole = 'customer';

        // 1. Decode role from state parameter if present
        if (req.query && req.query.state) {
          try {
            const parsedState = JSON.parse(Buffer.from(req.query.state, 'base64').toString('ascii'));
            if (parsedState && parsedState.role) {
              requestedRole = parsedState.role;
            }
          } catch (e) {
            // Ignore state parse errors
          }
        }

        // 2. Fallback to session if available
        if (requestedRole === 'customer' && req.session && req.session.googleAuthRole) {
          requestedRole = req.session.googleAuthRole;
        }

        const adminEmails = (process.env.ADMIN_EMAILS || 'dubeyharshit105@gmail.com,admin@zaika.com')
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean);

        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase().trim() : '';

        if (!email) {
          return done(new Error('No email found from Google account.'), null);
        }

        const isAdmin = adminEmails.includes(email) || requestedRole === 'admin';

        let user = await User.findOne({ googleId: profile.id });
        if (!user && email) {
          user = await User.findOne({ email });
        }

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          if (!user.avatar && profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          if (isAdmin && user.role !== 'admin') {
            user.role = 'admin';
          }
          await user.save();

          return done(null, {
            ...user.toObject(),
            selectedRole: user.role === 'admin' ? 'admin' : requestedRole,
          });
        }

        // Create new user
        user = new User({
          googleId: profile.id,
          name: profile.displayName || email.split('@')[0] || 'Customer',
          email,
          avatar: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
          role: isAdmin ? 'admin' : 'customer',
        });
        await user.save();

        return done(null, {
          ...user.toObject(),
          selectedRole: user.role === 'admin' ? 'admin' : 'customer',
        });
      } catch (err) {
        console.error('Google OAuth strategy error:', err);
        return done(err, null);
      }
    }
  )
);

