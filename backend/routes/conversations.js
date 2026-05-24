const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Conversation = require('../models/Conversation');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const convStatuses = ['New', 'Picked', 'Solved', 'Closed'];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

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
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const filter = {};
    if (req.query.cursor) {
      filter._id = { $lt: req.query.cursor };
    }
    const conversations = await Conversation.find(filter).sort({ updatedAt: -1 }).limit(limit + 1);
    const hasMore = conversations.length > limit;
    const page = hasMore ? conversations.slice(0, limit) : conversations;
    const messages = flattenMessages(page);
    const nextCursor = hasMore ? page[page.length - 1]._id.toString() : null;
    res.json({ success: true, conversations: page, messages, nextCursor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/messages/send', requireAuth, [
  body('recipientId').trim().notEmpty().withMessage('recipientId is required'),
  body('platform').optional().trim(),
  body('text').optional().trim(),
  body('attachment').optional().trim(),
  body('participantName').optional().trim(),
  handleValidation
], async (req, res) => {
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

router.post('/api/conversations/read', requireAuth, [
  body('conversationId').optional().isMongoId().withMessage('Invalid conversationId'),
  body('platform').optional().trim(),
  body('participantId').optional().trim(),
  handleValidation
], async (req, res) => {
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

router.put('/api/conversations/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid conversation ID'),
  body('platform').optional().trim(),
  body('participantId').optional().trim(),
  body('status').optional().isIn(convStatuses).withMessage(`status must be one of: ${convStatuses.join(', ')}`),
  body('agent').optional().trim(),
  body('category').optional().trim(),
  body('notes').optional().trim(),
  body('remarks').optional().trim(),
  body('optAgent').optional().trim(),
  body('referralTitle').optional().trim(),
  body('lastMessage').optional().trim(),
  body('unreadCount').optional().isNumeric().withMessage('unreadCount must be a number'),
  handleValidation
], async (req, res) => {
  try {
    const { platform, participantId, ...updates } = req.body;
    const conversationId = req.params.id;
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

router.delete('/api/conversations/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid conversation ID'),
  body('platform').optional().trim(),
  body('participantId').optional().trim(),
  handleValidation
], async (req, res) => {
  try {
    const { platform, participantId } = req.body;
    const conversationId = req.params.id;
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
