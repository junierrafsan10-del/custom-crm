const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  desc: { type: String, default: '' },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Blocked', 'Closed'], default: 'Open' },
  dueDate: { type: String, default: '' },
  assignee: { type: String, default: 'Support Member A' }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
