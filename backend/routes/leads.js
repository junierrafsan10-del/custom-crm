const express = require('express');
const Lead = require('../models/Lead');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/api/leads', requireAuth, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/leads', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, title, product, stage, source, value, followups } = req.body;
    const lead = await Lead.create({ name, email, phone, title, product, stage, source, value, followups });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/leads/:id', requireAuth, async (req, res) => {
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

router.delete('/api/leads/:id', requireAuth, async (req, res) => {
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
