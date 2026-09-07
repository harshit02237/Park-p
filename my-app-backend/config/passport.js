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

        let user = await User.findOne({ googleId: profile.id });
        if (!user && email) {
          user = await User.findOne({ email });
        }

        const isAuthorizedAdmin = adminEmails.includes(email) || (user && user.role === 'admin' && adminEmails.includes(email));

        // If the user requested to log in via Admin Portal but is NOT an authorized admin:
        if (requestedRole === 'admin' && !isAuthorizedAdmin) {
          return done(null, false, {
            message: 'Access Denied: This Google account does not have administrator privileges.',
          });
        }

        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          if (!user.avatar && profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }

          // If their email is not in adminEmails, ensure role is NOT admin (unless they are customer)
          if (adminEmails.includes(email)) {
            user.role = 'admin';
          } else if (user.role === 'admin' && !adminEmails.includes(email)) {
            user.role = 'customer';
          }

          await user.save();

          return done(null, {
            ...user.toObject(),
            selectedRole: user.role === 'admin' ? 'admin' : 'customer',
          });
        }

        // Create new user (only admin if email is in adminEmails)
        const assignedRole = isAuthorizedAdmin ? 'admin' : 'customer';
        user = new User({
          googleId: profile.id,
          name: profile.displayName || email.split('@')[0] || 'Customer',
          email,
          avatar: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
          role: assignedRole,
        });
        await user.save();

        return done(null, {
          ...user.toObject(),
          selectedRole: assignedRole,
        });
      } catch (err) {
        console.error('Google OAuth strategy error:', err);
        return done(err, null);
      }
    }
  )
);

