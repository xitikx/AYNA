const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscriptionName: {
    type: String,
    required: true,
    trim: true,
  },
  billingCycle: {
    type: String,
    enum: ['1 Month', '3 Months', '6 Months', '1 Year'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  billingStartDate: {
    type: Date,
    required: true,
  },
  nextBillingDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Cancelled'],
    default: 'Active',
  },
  cancellationDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);