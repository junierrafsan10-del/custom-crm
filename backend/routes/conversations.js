const express = require('express');
const { body, param } = require('express-validator');
const Conversation = require('../models/Conversation');
const requireAuth = require('../middleware/auth');
const { CONVERSATION_STATUSES } = require('../src/constants');
const { handleValidation } = require('../src/utils/validation');

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
    console.error('List messages error:', err);
    res.status(500).json({ success: false, error: 'Failed to list messages' });
  }
});

router.post('/api/messages/send', requireAuth, [
  body('recipientId').trim().notEmpty().withMessage('Recipient ID is required').isLength({ max: 200 }),
  body('platform').optional().trim().isLength({ max: 50 }),
  body('text').optional().trim().isLength({ max: 5000 }),
  body('attachment').optional().trim().isLength({ max: 500 }),
  body('participantName').optional().trim().isLength({ max: 200 }),
  handleValidation
], async (req, res) => {
  try {
    const { platform, recipientId, text, attachment, participantName } = req.body;
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
    res.status(201).json({ success: true, data: { message } });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

router.post('/api/conversations/read', requireAuth, [
  body('conversationId').optional().isMongoId().withMessage('Invalid conversation ID'),
  body('platform').optional().trim().isLength({ max: 50 }),
  body('participantId').optional().trim().isLength({ max: 200 }),
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
    console.error('Mark conversation read error:', err);
    res.status(500).json({ success: false, error: 'Failed to mark conversation as read' });
  }
});

router.put('/api/conversations/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid conversation ID'),
  body('status').optional().isIn(CONVERSATION_STATUSES).withMessage(`Status must be one of: ${CONVERSATION_STATUSES.join(', ')}`),
  body('agent').optional().trim().isLength({ max: 200 }),
  body('category').optional().trim().isLength({ max: 100 }),
  body('labels').optional().isArray().withMessage('Labels must be an array'),
  body('notes').optional().trim().isLength({ max: 2000 }),
  body('remarks').optional().trim().isLength({ max: 1000 }),
  body('optAgent').optional().trim().isLength({ max: 200 }),
  body('referralTitle').optional().trim().isLength({ max: 200 }),
  body('lastMessage').optional().trim().isLength({ max: 1000 }),
  body('unreadCount').optional().isNumeric().withMessage('unreadCount must be a number'),
  handleValidation
], async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    const allowed = ['status', 'agent', 'category', 'labels', 'notes', 'remarks', 'optAgent', 'referralTitle', 'lastMessage', 'unreadCount'];
    Object.keys(req.body).forEach(key => {
      if (allowed.includes(key)) {
        conv[key] = req.body[key];
      }
    });
    if (req.body.unpickBy && req.body.unpickReason) {
      conv.unpickHistory = conv.unpickHistory || [];
      conv.unpickHistory.push({
        agent: req.body.unpickBy,
        timestamp: new Date(),
        reason: req.body.unpickReason
      });
    }
    await conv.save();
    res.json({ success: true, data: conv });
  } catch (err) {
    console.error('Update conversation error:', err);
    res.status(500).json({ success: false, error: 'Failed to update conversation' });
  }
});

router.delete('/api/conversations/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid conversation ID'),
  handleValidation
], async (req, res) => {
  try {
    const conv = await Conversation.findByIdAndDelete(req.params.id);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, data: { message: 'Conversation deleted' } });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete conversation' });
  }
});

module.exports = router;
