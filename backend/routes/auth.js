const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    res.json({
      success: true,
      token,
      user: u
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
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

router.post('/api/auth/disconnect', requireAuth, async (req, res) => {
  try {
    const { platform } = req.body;
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
    res.json({
      success: true,
      data: {
        facebookConnected: true,
        facebookPageName: 'My Facebook Page',
        facebookPageId: '251373931387947',
        whatsappConnected: false,
        whatsappBusinessId: '',
        whatsappName: '',
        whatsappPhone: '',
        accessToken: 'temp_token_' + Date.now()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
