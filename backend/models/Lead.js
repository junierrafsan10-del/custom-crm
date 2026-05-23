const mongoose = require('mongoose');

const followupSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  note: { type: String, default: '' },
  completed: { type: Boolean, default: false }
}, { _id: true });

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  title: { type: String, default: '' },
  product: { type: String, default: '' },
  stage: {
    type: String,
    enum: ['Intake', 'Interested', 'Qualified', 'Converted', 'Lost'],
    default: 'Intake'
  },
  source: { type: String, default: 'Facebook' },
  value: { type: Number, default: 0 },
  followups: [followupSchema]
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
