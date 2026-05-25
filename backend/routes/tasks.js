const express = require('express');
const { body, param } = require('express-validator');
const Task = require('../models/Task');
const requireAuth = require('../middleware/auth');
const { TASK_PRIORITIES, TASK_STATUSES } = require('../src/constants');
const { handleValidation } = require('../src/utils/validation');

const router = express.Router();

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
    console.error('List tasks error:', err);
    res.status(500).json({ success: false, error: 'Failed to list tasks' });
  }
});

router.post('/api/tasks', requireAuth, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('desc').optional().trim().isLength({ max: 2000 }),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`),
  body('status').optional().isIn(TASK_STATUSES).withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
  body('dueDate').optional().trim().isLength({ max: 50 }),
  body('assignee').optional().isMongoId().withMessage('Assignee must be a valid user ID'),
  handleValidation
], async (req, res) => {
  try {
    const { title, desc, priority, status, dueDate, assignee } = req.body;
    const task = await Task.create({ title, desc, priority, status, dueDate, assignee });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

router.put('/api/tasks/:id', requireAuth, [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }),
  body('desc').optional().trim().isLength({ max: 2000 }),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`),
  body('status').optional().isIn(TASK_STATUSES).withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
  body('dueDate').optional().trim().isLength({ max: 50 }),
  body('assignee').optional().isMongoId().withMessage('Assignee must be a valid user ID'),
  handleValidation
], async (req, res) => {
  try {
    const allowed = ['title', 'desc', 'priority', 'status', 'dueDate', 'assignee'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ success: false, error: 'Failed to update task' });
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
    console.error('Delete task error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

module.exports = router;
