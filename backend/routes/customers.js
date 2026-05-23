const express = require('express');
const Customer = require('../models/Customer');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/api/customers', requireAuth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/customers/update', requireAuth, async (req, res) => {
  try {
    const { id, name, phone, email, pictureUrl, notes } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;
    if (pictureUrl !== undefined) update.pictureUrl = pictureUrl;
    if (notes !== undefined) update.notes = notes;
    const customer = await Customer.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
