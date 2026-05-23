const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  role: { type: String, enum: ['Admin', 'Agent'], default: 'Agent' },
  avatar: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
