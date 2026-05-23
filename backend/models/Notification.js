const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  type: { type: String, default: 'General' },
  time: { type: String, default: '' },
  unread: { type: Boolean, default: true },
  targetTab: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
