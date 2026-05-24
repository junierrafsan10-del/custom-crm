const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/api/users/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const u = { ...user.toObject(), id: user._id.toString() };
    delete u.password;
    res.cookie('crm_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({
      success: true,
      user: u
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/auth/logout', (req, res) => {
  res.clearCookie('crm_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.json({ success: true });
});

router.get('/api/auth/status', (req, res) => {
  res.json({ success: true, data: { message: 'Server is running', timestamp: new Date().toISOString() } });
});

router.get('/api/auth/meta-url', (req, res) => {
  const appId = process.env.FB_APP_ID || 'YOUR_APP_ID';
  const redirectUri = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL + '/auth/callback'
    : 'http://localhost:5173/auth/callback';
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_metadata,pages_messaging,pages_read_engagement,pages_show_list,whatsapp_business_messaging,business_management`;
  res.json({ success: true, url });
});

router.delete('/api/auth/disconnect', requireAuth, async (req, res) => {
  try {
    const platform = req.query.platform || req.body?.platform;
    res.json({ success: true, data: { message: `${platform || 'Meta'} disconnected successfully` } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/auth/meta-callback', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Authorization code is required' });
    }

    const clientId = process.env.FB_APP_ID;
    const clientSecret = process.env.FB_APP_SECRET;
    const redirectUri = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/auth/callback';

    if (!clientId || !clientSecret) {
      return res.status(500).json({ success: false, error: 'Meta app credentials (FB_APP_ID, FB_APP_SECRET) not configured on the server' });
    }

    const tokenRes = await axios.post('https://graph.facebook.com/v19.0/oauth/access_token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
      }
    });

    const { access_token } = tokenRes.data;

    const pagesRes = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token }
    });

    const pages = pagesRes.data.data || [];
    const firstPage = pages.length > 0 ? pages[0] : null;

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
    res.status(500).json({ success: false, error: `Meta API error: ${message}` });
  }
});

module.exports = router;
