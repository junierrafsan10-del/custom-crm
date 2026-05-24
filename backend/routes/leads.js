const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

const leadStages = ['Intake', 'Interested', 'Qualified', 'Converted', 'Lost'];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

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
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/leads', requireAuth, [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').optional().trim(),
  body('phone').optional().trim(),
  body('title').optional().trim(),
  body('product').optional().trim(),
  body('stage').optional().isIn(leadStages).withMessage(`stage must be one of: ${leadStages.join(', ')}`),
  body('source').optional().trim(),
  body('value').optional().isNumeric().withMessage('value must be a number'),
  handleValidation
], async (req, res) => {
  try {
    const { name, email, phone, title, product, stage, source, value, followups } = req.body;
    const lead = await Lead.create({ name, email, phone, title, product, stage, source, value, followups });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/leads/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('email').optional().trim(),
  body('phone').optional().trim(),
  body('title').optional().trim(),
  body('product').optional().trim(),
  body('stage').optional().isIn(leadStages).withMessage(`stage must be one of: ${leadStages.join(', ')}`),
  body('source').optional().trim(),
  body('value').optional().isNumeric().withMessage('value must be a number'),
  handleValidation
], async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
