const express = require('express');
const router = express.Router();
const Calorie = require('../models/Calorie');
const DailyCalorieTotal = require('../models/DailyCalorieTotal');

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Helper function to update daily total
const updateDailyTotal = async (userId, dateStr) => {
  try {
    // Fetch all calorie entries for the user on this date
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setDate(end.getDate() + 1);
    const calories = await Calorie.find({
      userId,
      date: { $gte: start, $lt: end },
    });

    // Calculate total
    const totalCalories = calories.reduce((sum, entry) => sum + entry.calories, 0);

    // Update or create the daily total
    await DailyCalorieTotal.findOneAndUpdate(
      { userId, date: dateStr },
      { totalCalories, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error updating daily total:', error);
  }
};

// CREATE - Add a new calorie entry
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { food, calories, date } = req.body; // Allow date in the request
    if (!food || calories === undefined) {
      return res.status(400).json({ message: 'Food and calories are required' });
    }
    const calorie = new Calorie({
      userId: req.user._id,
      food,
      calories,
      date: date ? new Date(date) : new Date(), // Use provided date or current timestamp
    });
    await calorie.save();

    // Update daily total
    const dateStr = new Date(calorie.date).toISOString().split('T')[0];
    await updateDailyTotal(req.user._id, dateStr);

    res.status(201).json({ message: 'Calorie entry added', data: calorie });
  } catch (error) {
    console.error('Error saving calorie:', error);
    res.status(500).json({ message: 'Error saving calorie entry', error: error.message });
  }
});

// READ - Get all calorie entries (with optional date filter)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { date } = req.query;
    let query = { userId: req.user._id };
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }
    const calories = await Calorie.find(query).sort({ date: -1 });
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
    const { food, calories, date } = req.body;
    const calorie = await Calorie.findOne({ _id: id, userId: req.user._id });
    if (!calorie) {
      return res.status(404).json({ message: 'Calorie entry not found' });
    }

    // Store old date for updating daily total
    const oldDateStr = new Date(calorie.date).toISOString().split('T')[0];

    if (food) calorie.food = food;
    if (calories !== undefined) calorie.calories = calories;
    if (date) calorie.date = new Date(date);
    await calorie.save();

    // Update daily totals for old and new dates
    const newDateStr = new Date(calorie.date).toISOString().split('T')[0];
    await updateDailyTotal(req.user._id, oldDateStr);
    if (oldDateStr !== newDateStr) {
      await updateDailyTotal(req.user._id, newDateStr);
    }

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
    const calorie = await Calorie.findOne({ _id: id, userId: req.user._id });
    if (!calorie) {
      return res.status(404).json({ message: 'Calorie entry not found' });
    }

    // Update daily total before deleting
    const dateStr = new Date(calorie.date).toISOString().split('T')[0];
    await Calorie.deleteOne({ _id: id, userId: req.user._id });
    await updateDailyTotal(req.user._id, dateStr);

    res.json({ message: 'Calorie entry deleted' });
  } catch (error) {
    console.error('Error deleting calorie:', error);
    res.status(500).json({ message: 'Error deleting calorie entry', error: error.message });
  }
});

// READ - Get daily calorie totals (with optional date range)
router.get('/daily-totals', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // e.g., ?startDate=2025-03-01&endDate=2025-03-31
    let query = { userId: req.user._id };
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    const dailyTotals = await DailyCalorieTotal.find(query).sort({ date: 1 });
    res.json({ message: 'Daily calorie totals retrieved', data: dailyTotals });
  } catch (error) {
    console.error('Error fetching daily totals:', error);
    res.status(500).json({ message: 'Error fetching daily totals', error: error.message });
  }
});

module.exports = router;