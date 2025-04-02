const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  eventName: {
    type: String,
    required: true,
    trim: true,
  },
  dateTime: {
    type: Date,
    required: true,
  },
  eventType: {
    type: String,
    enum: ['Personal', 'Work', 'Subscription Billing'],
    required: true,
  },
  recurring: {
    type: String,
    enum: ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'],
    default: 'None',
  },
  notificationReminder: {
    type: String,
    enum: ['None', '5 Minutes Before', '1 Hour Before', '1 Day Before', '1 Week Before'],
    default: 'None',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Event', eventSchema);