const mongoose = require('mongoose');

const DailyCalorieTotalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // Store as YYYY-MM-DD
    required: true,
  },
  totalCalories: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique combination of userId and date
DailyCalorieTotalSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCalorieTotal', DailyCalorieTotalSchema);