const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String, // Optional for Google OAuth users
  },
  googleId: {
    type: String, // Store Google ID
    unique: true,
    sparse: true, // Allows null values for non-Google users
  },
});

module.exports = mongoose.model('User', userSchema);