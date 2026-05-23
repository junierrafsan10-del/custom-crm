const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, default: '' },
  senderName: { type: String, default: '' },
  recipientId: { type: String, default: '' },
  text: { type: String, default: '' },
  platform: { type: String, default: 'facebook' },
  timestamp: { type: Number, default: Date.now },
  attachment: { type: String, default: '' }
}, { _id: true });

const unpickEntrySchema = new mongoose.Schema({
  agent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  reason: { type: String, default: '' }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  ticketId: { type: Number, unique: true },
  participantName: { type: String, default: '' },
  participantId: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  status: {
    type: String,
    enum: ['New', 'Picked', 'Solved', 'Closed'],
    default: 'New'
  },
  platform: { type: String, default: 'facebook' },
  agent: { type: String, default: null },
  category: { type: String, default: '' },
  labels: [{ type: String }],
  notes: { type: String, default: '' },
  remarks: { type: String, default: '' },
  optAgent: { type: String, default: '' },
  referralTitle: { type: String, default: '' },
  lastMessage: { type: String, default: '' },
  unreadCount: { type: Number, default: 0 },
  unpickHistory: [unpickEntrySchema],
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
