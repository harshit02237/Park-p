const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Restaurant = require('../models/restaurant');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

const generateAuthResponse = (user) => {
  const token = jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    process.env.JWT_SECRET || 'zaika_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  };
};

// 1. Customer Registration (Email + Password)
router.post('/customer/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      role: 'customer',
    });
    user.setPassword(password);
    await user.save();

    const authData = generateAuthResponse(user);
    res.status(201).json(authData);
  } catch (err) {
    console.error('Customer register error:', err);
    res.status(500).json({ message: err.message || 'Server error during registration' });
  }
});

// 2. Customer Login (Email + Password)
router.post('/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const authData = generateAuthResponse(user);
    res.json(authData);
  } catch (err) {
    console.error('Customer login error:', err);
    res.status(500).json({ message: err.message || 'Server error during login' });
  }
});

// 3. Admin Login (Email + Password)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Admin email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    // Auto-provision initial default admin if database is new
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@zaika.com,dubeyharshit105@gmail.com')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdminConfigured = adminEmails.includes(normalizedEmail) || normalizedEmail.includes('admin');

    if (!user && isAdminConfigured) {
      user = new User({
        name: 'Restaurant Admin',
        email: normalizedEmail,
        role: 'admin',
      });
      user.setPassword(password);
      await user.save();
      return res.json(generateAuthResponse(user));
    }

    if (!user) {
      return res.status(401).json({ message: 'Admin account not found' });
    }

    // Verify admin role
    if (user.role !== 'admin' && !adminEmails.includes(normalizedEmail)) {
      return res.status(403).json({ message: 'Access denied: not an administrator account' });
    }

    if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    if (user.password && !user.validatePassword(password)) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    } else if (!user.password) {
      user.setPassword(password);
      await user.save();
    }

    const authData = generateAuthResponse(user);
    res.json(authData);
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: err.message || 'Server error during admin login' });
  }
});

// 4. Google OAuth Initiator
router.get('/google', (req, res, next) => {
  const { role, origin, frontend_origin, redirect_url } = req.query;
  const roleValue = role === 'admin' ? 'admin' : 'customer';

  let detectedOrigin = origin || frontend_origin || redirect_url;
  if (!detectedOrigin && req.headers.referer) {
    try {
      detectedOrigin = new URL(req.headers.referer).origin;
    } catch (e) {}
  }
  if (!detectedOrigin) {
    detectedOrigin = process.env.FRONTEND_URL || process.env.PROD_URL || process.env.CLIENT_URL || 'http://localhost:3000';
  }

  detectedOrigin = String(detectedOrigin).replace(/\/$/, '');

  if (req.session) {
    req.session.googleAuthRole = roleValue;
    req.session.frontendOrigin = detectedOrigin;
  }

  const statePayload = Buffer.from(
    JSON.stringify({
      role: roleValue,
      origin: detectedOrigin,
    })
  ).toString('base64');

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: statePayload,
    prompt: 'select_account',
  })(req, res, next);
});

// 5. Google OAuth Callback
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      let targetOrigin =
        process.env.FRONTEND_URL ||
        process.env.PROD_URL ||
        process.env.CLIENT_URL ||
        'http://localhost:3000';

      let selectedRole = 'customer';

      if (req.query && req.query.state) {
        try {
          const parsed = JSON.parse(Buffer.from(req.query.state, 'base64').toString('ascii'));
          if (parsed && parsed.role) {
            selectedRole = parsed.role;
          }
          if (parsed && parsed.origin) {
            targetOrigin = parsed.origin;
          }
        } catch (e) {}
      }

      if (user && (user.selectedRole || user.role)) {
        selectedRole = user.selectedRole || user.role;
      }

      targetOrigin = String(targetOrigin).replace(/\/$/, '');

      if (err || !user) {
        console.error('Google OAuth Authentication Error:', err || info);
        const errorMsg = encodeURIComponent(
          err?.message || (typeof info === 'string' ? info : 'Google authentication failed. Please try again.')
        );
        return res.redirect(`${targetOrigin}/login?error=${errorMsg}`);
      }

      try {
        const role = user.role === 'admin' ? 'admin' : selectedRole;

        const token = jwt.sign(
          {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: role,
            avatar: user.avatar,
          },
          process.env.JWT_SECRET || 'zaika_secret_jwt_key_2026',
          { expiresIn: '30d' }
        );

        if (role === 'admin') {
          return res.redirect(`${targetOrigin}/admin?token=${token}`);
        } else {
          return res.redirect(`${targetOrigin}/?token=${token}`);
        }
      } catch (tokenErr) {
        console.error('Google OAuth token creation error:', tokenErr);
        return res.redirect(`${targetOrigin}/login?error=token_failed`);
      }
    })(req, res, next);
  }
);

// 7. Get Current Logged-in User
router.get('/current_user', protect, (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
  });
});

router.get('/me', protect, (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
  });
});

// 8. Update User Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const authData = generateAuthResponse(user);
    res.json(authData);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: err.message || 'Error updating profile' });
  }
});

module.exports = router;



