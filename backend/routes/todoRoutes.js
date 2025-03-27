const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// CREATE - Add a new to-do
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { task, dueDate } = req.body;
    if (!task) {
      return res.status(400).json({ message: 'Task is required' });
    }
    const todo = new Todo({
      userId: req.user._id,
      task,
      dueDate: dueDate || null,
    });
    await todo.save();
    res.status(201).json({ message: 'To-do added', data: todo });
  } catch (error) {
    console.error('Error saving to-do:', error);
    res.status(500).json({ message: 'Error saving to-do', error: error.message });
  }
});

// READ - Get all to-dos (with optional filters)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { completed, dueDate } = req.query; // e.g., ?completed=true or ?dueDate=2025-03-26
    let query = { userId: req.user._id };
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    if (dueDate) {
      const start = new Date(dueDate);
      const end = new Date(dueDate);
      end.setDate(end.getDate() + 1);
      query.dueDate = { $gte: start, $lt: end };
    }
    const todos = await Todo.find(query).sort({ createdAt: -1 }); // Newest first
    res.json({ message: 'To-dos retrieved', data: todos });
  } catch (error) {
    console.error('Error fetching to-dos:', error);
    res.status(500).json({ message: 'Error fetching to-dos', error: error.message });
  }
});

// UPDATE - Edit a to-do by ID
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { task, completed, dueDate } = req.body;
    const todo = await Todo.findOne({ _id: id, userId: req.user._id });
    if (!todo) {
      return res.status(404).json({ message: 'To-do not found' });
    }
    if (task) todo.task = task;
    if (completed !== undefined) todo.completed = completed;
    if (dueDate !== undefined) todo.dueDate = dueDate || null;
    await todo.save();
    res.json({ message: 'To-do updated', data: todo });
  } catch (error) {
    console.error('Error updating to-do:', error);
    res.status(500).json({ message: 'Error updating to-do', error: error.message });
  }
});

// DELETE - Remove a to-do by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Todo.deleteOne({ _id: id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'To-do not found' });
    }
    res.json({ message: 'To-do deleted' });
  } catch (error) {
    console.error('Error deleting to-do:', error);
    res.status(500).json({ message: 'Error deleting to-do', error: error.message });
  }
});

module.exports = router;