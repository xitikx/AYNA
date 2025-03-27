const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  username: { type: String, default: null }, // Explicitly allow null, no unique constraint
  email: { type: String, unique: true, sparse: true }, // Optional email, sparse index
  name: { type: String }, // Optional display name
});

module.exports = mongoose.model('User', UserSchema);