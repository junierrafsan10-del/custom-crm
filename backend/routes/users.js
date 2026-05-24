const express = require('express');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

const userRoles = ['Admin', 'Agent'];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.get('/api/users', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const filter = {};
    if (req.query.cursor) {
      filter._id = { $lt: req.query.cursor };
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).limit(limit + 1);
    const hasMore = users.length > limit;
    const page = hasMore ? users.slice(0, limit) : users;
    const safe = page.map(u => ({ ...u.toObject(), id: u._id.toString() }));
    const nextCursor = hasMore ? page[page.length - 1]._id.toString() : null;
    res.json({ success: true, users: safe, nextCursor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/users/create', requireAuth, requireAdmin, [
  body('username').trim().notEmpty().withMessage('username is required'),
  body('password').notEmpty().withMessage('password is required').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('name').optional().trim(),
  body('role').optional().isIn(userRoles).withMessage(`role must be one of: ${userRoles.join(', ')}`),
  body('avatar').optional().trim(),
  body('email').optional().trim(),
  body('phone').optional().trim(),
  handleValidation
], async (req, res) => {
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

router.put('/api/users/:id', requireAuth, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('username').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('name').optional().trim(),
  body('role').optional().isIn(userRoles).withMessage(`role must be one of: ${userRoles.join(', ')}`),
  body('avatar').optional().trim(),
  body('email').optional().trim(),
  body('phone').optional().trim(),
  handleValidation
], async (req, res) => {
  try {
    const { username, password, name, role, avatar, email, phone } = req.body;
    const userId = req.params.id;
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

router.delete('/api/users/:id', requireAuth, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  handleValidation
], async (req, res) => {
  try {
    const id = req.params.id;
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
