const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0, // User's available money
  },
  totalSavings: {
    type: Number,
    default: 0, // Total amount in savings
  },
  totalInvestments: {
    type: Number,
    default: 0, // Total amount in investments
  },
});

module.exports = mongoose.model('User', UserSchema);