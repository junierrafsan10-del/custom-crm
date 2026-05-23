const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true },
  pictureUrl: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
