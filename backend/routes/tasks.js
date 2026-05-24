const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Task = require('../models/Task');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const taskPriorities = ['High', 'Medium', 'Low'];
const taskStatuses = ['Open', 'In Progress', 'Blocked', 'Closed'];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const filter = {};
    if (req.query.cursor) {
      filter._id = { $lt: req.query.cursor };
    }
    const tasks = await Task.find(filter).sort({ createdAt: -1 }).limit(limit + 1).populate('assignee', 'name username role avatar');
    const hasMore = tasks.length > limit;
    const data = hasMore ? tasks.slice(0, limit) : tasks;
    const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;
    res.json({ success: true, data, nextCursor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/tasks', requireAuth, [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('desc').optional().trim(),
  body('priority').optional().isIn(taskPriorities).withMessage(`priority must be one of: ${taskPriorities.join(', ')}`),
  body('status').optional().isIn(taskStatuses).withMessage(`status must be one of: ${taskStatuses.join(', ')}`),
  body('dueDate').optional().trim(),
  body('assignee').optional().isMongoId().withMessage('assignee must be a valid user ID'),
  handleValidation
], async (req, res) => {
  try {
    const { title, desc, priority, status, dueDate, assignee } = req.body;
    const task = await Task.create({ title, desc, priority, status, dueDate, assignee });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/tasks/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title').optional().trim().notEmpty().withMessage('title cannot be empty'),
  body('desc').optional().trim(),
  body('priority').optional().isIn(taskPriorities).withMessage(`priority must be one of: ${taskPriorities.join(', ')}`),
  body('status').optional().isIn(taskStatuses).withMessage(`status must be one of: ${taskStatuses.join(', ')}`),
  body('dueDate').optional().trim(),
  body('assignee').optional().isMongoId().withMessage('assignee must be a valid user ID'),
  handleValidation
], async (req, res) => {
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
