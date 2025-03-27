const express = require('express');
const router = express.Router();
const Calorie = require('../models/Calorie');

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// CREATE - Add a new calorie entry
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { food, calories } = req.body;
    if (!food || calories === undefined) {
      return res.status(400).json({ message: 'Food and calories are required' });
    }
    const calorie = new Calorie({
      userId: req.user._id,
      food,
      calories,
    });
    await calorie.save();
    res.status(201).json({ message: 'Calorie entry added', data: calorie });
  } catch (error) {
    console.error('Error saving calorie:', error);
    res.status(500).json({ message: 'Error saving calorie entry', error: error.message });
  }
});

// READ - Get all calorie entries (with optional date filter)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { date } = req.query; // e.g., ?date=2025-03-26
    let query = { userId: req.user._id };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1); // End of day
      query.date = { $gte: start, $lt: end };
    }
    const calories = await Calorie.find(query).sort({ date: -1 }); // Newest first
    res.json({ message: 'Calorie entries retrieved', data: calories });
  } catch (error) {
    console.error('Error fetching calories:', error);
    res.status(500).json({ message: 'Error fetching calorie data', error: error.message });
  }
});

// UPDATE - Edit a calorie entry by ID
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { food, calories } = req.body;
    const calorie = await Calorie.findOne({ _id: id, userId: req.user._id });
    if (!calorie) {
      return res.status(404).json({ message: 'Calorie entry not found' });
    }
    if (food) calorie.food = food;
    if (calories !== undefined) calorie.calories = calories;
    await calorie.save();
    res.json({ message: 'Calorie entry updated', data: calorie });
  } catch (error) {
    console.error('Error updating calorie:', error);
    res.status(500).json({ message: 'Error updating calorie entry', error: error.message });
  }
});

// DELETE - Remove a calorie entry by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Calorie.deleteOne({ _id: id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Calorie entry not found' });
    }
    res.json({ message: 'Calorie entry deleted' });
  } catch (error) {
    console.error('Error deleting calorie:', error);
    res.status(500).json({ message: 'Error deleting calorie entry', error: error.message });
  }
});

module.exports = router;