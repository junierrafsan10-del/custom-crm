const express = require('express');
const Conversation = require('../models/Conversation');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function flattenMessages(conversations) {
  const messages = [];
  conversations.forEach(c => {
    (c.messages || []).forEach(m => {
      messages.push({
        _id: m._id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        text: m.text,
        platform: m.platform || c.platform,
        timestamp: m.timestamp,
        attachment: m.attachment || ''
      });
    });
  });
  messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  return messages;
}

function findConversation(convs, { participantId, platform }) {
  if (!participantId) return null;
  return convs.find(c =>
    c.participantId === participantId && (!platform || c.platform === platform)
  );
}

async function getOrCreateConversation({ participantId, participantName, platform }) {
  let conv = await Conversation.findOne({ participantId, platform });
  if (!conv) {
    const count = await Conversation.countDocuments();
    conv = await Conversation.create({
      ticketId: 1000 + count + 1,
      participantId,
      participantName: participantName || participantId,
      platform: platform || 'facebook',
      status: 'New',
      messages: []
    });
  }
  return conv;
}

router.get('/api/messages', requireAuth, async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ updatedAt: -1 });
    const messages = flattenMessages(conversations);
    res.json({ success: true, conversations, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/messages/send', requireAuth, async (req, res) => {
  try {
    const { platform, recipientId, text, attachment, participantName } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, error: 'recipientId is required' });
    }
    const conv = await getOrCreateConversation({
      participantId: recipientId,
      participantName: participantName || recipientId,
      platform: platform || 'facebook'
    });
    const message = {
      senderId: 'agent',
      senderName: req.user?.name || 'Agent',
      recipientId,
      text: text || '',
      platform: platform || conv.platform,
      timestamp: Date.now(),
      attachment: attachment || ''
    };
    conv.messages.push(message);
    conv.lastMessage = text || (attachment ? 'Sent an attachment' : '');
    conv.unreadCount = 0;
    await conv.save();
    res.json({ success: true, data: { message } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/conversations/read', requireAuth, async (req, res) => {
  try {
    const { conversationId, platform, participantId } = req.body;
    let conv;
    if (conversationId) {
      conv = await Conversation.findById(conversationId);
    } else if (platform && participantId) {
      conv = await Conversation.findOne({ platform, participantId });
    } else {
      return res.status(400).json({ success: false, error: 'conversationId or platform+participantId required' });
    }
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    conv.unreadCount = 0;
    await conv.save();
    res.json({ success: true, data: conv });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/conversations/update', requireAuth, async (req, res) => {
  try {
    const { conversationId, platform, participantId, ...updates } = req.body;
    let conv;
    if (conversationId) {
      conv = await Conversation.findById(conversationId);
    } else if (platform && participantId) {
      conv = await Conversation.findOne({ platform, participantId });
    } else {
      return res.status(400).json({ success: false, error: 'conversationId or platform+participantId required' });
    }
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    const allowed = ['status', 'agent', 'category', 'labels', 'notes', 'remarks', 'optAgent', 'referralTitle', 'lastMessage', 'unreadCount'];
    Object.keys(updates).forEach(key => {
      if (allowed.includes(key)) {
        conv[key] = updates[key];
      }
    });
    if (updates.unpickBy && updates.unpickReason) {
      conv.unpickHistory = conv.unpickHistory || [];
      conv.unpickHistory.push({
        agent: updates.unpickBy,
        timestamp: new Date(),
        reason: updates.unpickReason
      });
    }
    await conv.save();
    res.json({ success: true, data: conv });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/conversations/delete', requireAuth, async (req, res) => {
  try {
    const { conversationId, platform, participantId } = req.body;
    let conv;
    if (conversationId) {
      conv = await Conversation.findByIdAndDelete(conversationId);
    } else if (platform && participantId) {
      conv = await Conversation.findOneAndDelete({ platform, participantId });
    } else {
      return res.status(400).json({ success: false, error: 'conversationId or platform+participantId required' });
    }
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, data: { message: 'Conversation deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
