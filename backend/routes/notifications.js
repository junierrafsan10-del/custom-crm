const express = require('express');
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/notifications/mark-read', requireAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids && Array.isArray(ids)) {
      await Notification.updateMany({ _id: { $in: ids } }, { unread: false });
    } else {
      await Notification.updateMany({}, { unread: false });
    }
    res.json({ success: true, data: { message: 'Notifications marked as read' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
