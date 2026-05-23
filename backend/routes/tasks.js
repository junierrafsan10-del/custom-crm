const express = require('express');
const Task = require('../models/Task');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { title, desc, priority, status, dueDate, assignee } = req.body;
    const task = await Task.create({ title, desc, priority, status, dueDate, assignee });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: { message: 'Task deleted' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
