const express = require('express');
const router = express.Router();
const Diary = require('../models/Diary');

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// CREATE - Add a new diary entry
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, content, mood } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const diary = new Diary({
      userId: req.user._id,
      title,
      content,
      mood: mood || null,
    });
    await diary.save();
    res.status(201).json({ message: 'Diary entry added', data: diary });
  } catch (error) {
    console.error('Error saving diary entry:', error);
    res.status(500).json({ message: 'Error saving diary entry', error: error.message });
  }
});

// READ - Get all diary entries (with optional filters)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { mood, date } = req.query; // e.g., ?mood=happy or ?date=2025-03-26
    let query = { userId: req.user._id };
    if (mood) {
      query.mood = mood;
    }
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }
    const entries = await Diary.find(query).sort({ createdAt: -1 }); // Newest first
    res.json({ message: 'Diary entries retrieved', data: entries });
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    res.status(500).json({ message: 'Error fetching diary entries', error: error.message });
  }
});

// UPDATE - Edit a diary entry by ID
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood } = req.body;
    const diary = await Diary.findOne({ _id: id, userId: req.user._id });
    if (!diary) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }
    if (title) diary.title = title;
    if (content) diary.content = content;
    if (mood !== undefined) diary.mood = mood || null;
    await diary.save();
    res.json({ message: 'Diary entry updated', data: diary });
  } catch (error) {
    console.error('Error updating diary entry:', error);
    res.status(500).json({ message: 'Error updating diary entry', error: error.message });
  }
});

// DELETE - Remove a diary entry by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Diary.deleteOne({ _id: id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Diary entry not found' });
    }
    res.json({ message: 'Diary entry deleted' });
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    res.status(500).json({ message: 'Error deleting diary entry', error: error.message });
  }
});

module.exports = router;