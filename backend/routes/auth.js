const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const { authEvent } = require('../middleware/audit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts, try again in 15 minutes' }
});

const config = require('../utils/env');

const MAX_ATTEMPTS = config.MAX_LOGIN_ATTEMPTS;
const LOCKOUT_MS = config.ACCOUNT_LOCKOUT_MINUTES * 60 * 1000;
const JWT_EXPIRY = config.JWT_EXPIRY;

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, tv: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function setTokenCookie(res, token) {
  res.cookie('crm_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post('/api/users/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remaining = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked. Try again in ${remaining} minute(s)`
      });
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_MS);
        user.loginAttempts = 0;
        await user.save();
        authEvent('account_locked', user._id.toString(), `IP: ${req.ip}`);
        return res.status(429).json({
          success: false,
          error: `Account locked due to too many failed attempts. Try again in ${LOCKOUT_MS / 60000} minute(s)`
        });
      }
      await user.save();
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    user.loginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    const token = signToken(user);
    setTokenCookie(res, token);

    authEvent('login', user._id.toString());

    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.tokenVersion += 1;
      await user.save();
      authEvent('logout', req.user.id);
    }
  } catch (err) {
    // Non-blocking: even if tokenVersion fails, clear the cookie
  }
  res.clearCookie('crm_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ success: true });
});

router.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({ success: false, error: 'New password is too long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const match = bcrypt.compareSync(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = bcrypt.hashSync(newPassword, 12);
    user.tokenVersion += 1;
    await user.save();

    authEvent('password_change', req.user.id);

    const token = signToken(user);
    setTokenCookie(res, token);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

router.get('/api/auth/status', (_req, res) => {
  res.json({ success: true, data: { message: 'Server is running', timestamp: new Date().toISOString() } });
});

router.get('/api/auth/meta-url', (_req, res) => {
  const appId = process.env.FB_APP_ID || '';
  if (!appId) {
    return res.status(500).json({ success: false, error: 'FB_APP_ID not configured' });
  }
  const redirectUri = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/auth/callback';
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_metadata,pages_messaging,pages_read_engagement,pages_show_list,whatsapp_business_messaging,business_management`;
  res.json({ success: true, url });
});

router.delete('/api/auth/disconnect', requireAuth, async (req, res) => {
  try {
    const platform = req.query.platform || req.body?.platform;
    authEvent('disconnect', req.user.id, `Platform: ${platform || 'Meta'}`);
    res.json({ success: true, data: { message: `${platform || 'Meta'} disconnected successfully` } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

const metaCallbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many Meta callback requests' }
});

router.post('/api/auth/meta-callback', requireAuth, metaCallbackLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Authorization code is required' });
    }
    if (typeof code !== 'string' || code.length > 2000) {
      return res.status(400).json({ success: false, error: 'Invalid authorization code' });
    }

    const clientId = process.env.FB_APP_ID;
    const clientSecret = process.env.FB_APP_SECRET;
    const redirectUri = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/auth/callback';

    if (!clientId || !clientSecret) {
      return res.status(500).json({ success: false, error: 'Meta app credentials not configured' });
    }

    const tokenRes = await axios.post('https://graph.facebook.com/v19.0/oauth/access_token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
      },
      timeout: 10000
    });

    const { access_token } = tokenRes.data;

    const pagesRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token },
      timeout: 10000
    });

    const pages = pagesRes.data.data || [];
    const firstPage = pages.length > 0 ? pages[0] : null;

    authEvent('meta_connect', req.user.id, `Page: ${firstPage?.name || 'none'}`);

    res.json({
      success: true,
      data: {
        facebookConnected: !!firstPage,
        facebookPageName: firstPage ? firstPage.name : '',
        facebookPageId: firstPage ? firstPage.id : '',
        facebookPageAccessToken: firstPage ? firstPage.access_token : '',
        whatsappConnected: false,
        whatsappBusinessId: '',
        whatsappName: '',
        whatsappPhone: '',
        accessToken: access_token
      }
    });
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    console.error('Meta OAuth error:', message);
    res.status(500).json({ success: false, error: 'Meta API integration failed' });
  }
});

module.exports = router;
