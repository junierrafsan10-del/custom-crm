const express = require('express');
const { body, param } = require('express-validator');
const Lead = require('../models/Lead');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { LEAD_STAGES } = require('../src/constants');
const { handleValidation } = require('../src/utils/validation');

const router = express.Router();

router.get('/api/leads', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const filter = {};
    if (req.query.cursor) {
      filter._id = { $lt: req.query.cursor };
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
    const hasMore = leads.length > limit;
    const data = hasMore ? leads.slice(0, limit) : leads;
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;
    res.json({ success: true, data, nextCursor });
  } catch (err) {
    console.error('List leads error:', err);
    res.status(500).json({ success: false, error: 'Failed to list leads' });
  }
});

router.post('/api/leads', requireAuth, [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('title').optional().trim().isLength({ max: 200 }),
  body('product').optional().trim().isLength({ max: 200 }),
  body('stage').optional().isIn(LEAD_STAGES).withMessage(`Stage must be one of: ${LEAD_STAGES.join(', ')}`),
  body('source').optional().trim().isLength({ max: 100 }),
  body('value').optional().isNumeric().withMessage('Value must be a number'),
  handleValidation
], async (req, res) => {
  try {
    const { name, email, phone, title, product, stage, source, value, followups } = req.body;
    const lead = await Lead.create({ name, email, phone, title, product, stage, source, value, followups });
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ success: false, error: 'Failed to create lead' });
  }
});

router.put('/api/leads/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('title').optional().trim().isLength({ max: 200 }),
  body('product').optional().trim().isLength({ max: 200 }),
  body('stage').optional().isIn(LEAD_STAGES).withMessage(`Stage must be one of: ${LEAD_STAGES.join(', ')}`),
  body('source').optional().trim().isLength({ max: 100 }),
  body('value').optional().isNumeric().withMessage('Value must be a number'),
  handleValidation
], async (req, res) => {
  try {
    const allowed = ['name', 'email', 'phone', 'title', 'product', 'stage', 'source', 'value', 'followups'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }
    const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

router.delete('/api/leads/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: { message: 'Lead deleted' } });
  } catch (err) {
    console.error('Delete lead error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

module.exports = router;
