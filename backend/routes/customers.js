const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.get('/api/customers', requireAuth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (err) {
    console.error('List customers error:', err);
    res.status(500).json({ success: false, error: 'Failed to list customers' });
  }
});

router.post('/api/customers/update', requireAuth, [
  body('id').isMongoId().withMessage('Invalid customer ID'),
  body('name').optional().trim().isLength({ max: 200 }),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('notes').optional().trim().isLength({ max: 2000 }),
  handleValidation
], async (req, res) => {
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
    console.error('Update customer error:', err);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
});

module.exports = router;
