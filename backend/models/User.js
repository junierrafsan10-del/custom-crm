const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, default: '', trim: true },
  role: { type: String, enum: ['Admin', 'Agent'], default: 'Agent' },
  avatar: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  loginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date, default: null },
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  obj.id = this._id.toString();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockoutUntil;
  delete obj.tokenVersion;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
