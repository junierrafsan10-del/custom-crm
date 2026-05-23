const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/api/users', requireAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const safe = users.map(u => ({ ...u.toObject(), id: u._id.toString() }));
    res.json({ success: true, users: safe });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/users/create', requireAuth, async (req, res) => {
  try {
    const { username, password, name, role, avatar, email, phone } = req.body;
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }
    const hashed = bcrypt.hashSync(password || 'password123', 10);
    const user = await User.create({ username, password: hashed, name, role, avatar, email, phone });
    const u = { ...user.toObject(), id: user._id.toString() };
    delete u.password;
    res.json({ success: true, data: u });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/users/update', requireAuth, async (req, res) => {
  try {
    const { id, _id, username, password, name, role, avatar, email, phone } = req.body;
    const userId = id || _id;
    const update = {};
    if (name !== undefined) update.name = name;
    if (role !== undefined) update.role = role;
    if (avatar !== undefined) update.avatar = avatar;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (password) {
      update.password = bcrypt.hashSync(password, 10);
    }
    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const u = { ...user.toObject(), id: user._id.toString() };
    res.json({ success: true, user: u });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/users/delete', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.role === 'Admin') {
      return res.status(403).json({ success: false, error: 'Cannot delete an admin user' });
    }
    await User.findByIdAndDelete(id);
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
