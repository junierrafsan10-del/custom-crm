const express = require('express');
const { body, param } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { authEvent } = require('../middleware/audit');
const { USER_ROLES } = require('../src/constants');
const { handleValidation } = require('../src/utils/validation');

const router = express.Router();

router.get('/api/users', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const filter = {};
    if (req.query.cursor) {
      filter._id = { $lt: req.query.cursor };
    }
    const users = await User.find(filter).select('-password -loginAttempts -lockoutUntil -tokenVersion').sort({ createdAt: -1 }).limit(limit + 1);
    const hasMore = users.length > limit;
    const page = hasMore ? users.slice(0, limit) : users;
    const safe = page.map(u => u.toSafeObject());
    const nextCursor = hasMore ? page[page.length - 1]._id.toString() : null;
    res.json({ success: true, users: safe, nextCursor });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, error: 'Failed to list users' });
  }
});

router.post('/api/users/create', requireAuth, requireAdmin, [
  body('username').trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim().isLength({ max: 100 }),
  body('role').optional().isIn(USER_ROLES).withMessage(`Role must be one of: ${USER_ROLES.join(', ')}`),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('phone').optional().trim().isLength({ max: 30 }),
  handleValidation
], async (req, res) => {
  try {
    const { username, password, name, role, email, phone } = req.body;
    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }
    const hashed = bcrypt.hashSync(password, 12);
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashed,
      name: name || '',
      role: role || 'Agent',
      email: email || '',
      phone: phone || ''
    });
    authEvent('user_created', req.user.id, `Created user: ${user.username}`);
    res.status(201).json({ success: true, data: user.toSafeObject() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

router.put('/api/users/:id', requireAuth, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('username').optional().trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim().isLength({ max: 100 }),
  body('role').optional().isIn(USER_ROLES),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('phone').optional().trim().isLength({ max: 30 }),
  handleValidation
], async (req, res) => {
  try {
    const { username, password, name, role, email, phone } = req.body;
    const userId = req.params.id;
    const update = {};
    if (name !== undefined) update.name = name;
    if (role !== undefined) update.role = role;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (username !== undefined) {
      update.username = username.toLowerCase();
    }
    if (password) {
      update.password = bcrypt.hashSync(password, 12);
      update.tokenVersion = (await User.findById(userId).select('tokenVersion'))?.tokenVersion + 1 || 1;
    }
    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true }).select('-password -loginAttempts -lockoutUntil -tokenVersion');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    authEvent('user_updated', req.user.id, `Updated user: ${userId}`);
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }
    console.error('Update user error:', err);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

router.delete('/api/users/:id', requireAuth, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  handleValidation
], async (req, res) => {
  try {
    const id = req.params.id;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(403).json({ success: false, error: 'Cannot delete the last admin account' });
      }
    }
    await User.findByIdAndDelete(id);
    authEvent('user_deleted', req.user.id, `Deleted user: ${id}`);
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

module.exports = router;
