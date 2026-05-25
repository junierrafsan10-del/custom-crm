const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ success: false, error: 'Failed to list notifications' });
  }
});

router.post('/api/notifications/mark-read', requireAuth, [
  body('ids').optional().isArray().withMessage('ids must be an array'),
  body('ids.*').optional().isMongoId().withMessage('Invalid notification ID'),
  handleValidation
], async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids && Array.isArray(ids) && ids.length > 0) {
      await Notification.updateMany({ _id: { $in: ids } }, { unread: false });
    } else {
      await Notification.updateMany({}, { unread: false });
    }
    res.json({ success: true, data: { message: 'Notifications marked as read' } });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
  }
});

module.exports = router;
