const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const RecurringTransaction = require('../models/RecurringTransaction');

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Helper function to calculate the next billing date
const calculateNextBillingDate = (startDate, billingCycle) => {
  const date = new Date(startDate);
  if (billingCycle === '1 Month') {
    date.setMonth(date.getMonth() + 1);
  } else if (billingCycle === '3 Months') {
    date.setMonth(date.getMonth() + 3);
  } else if (billingCycle === '6 Months') {
    date.setMonth(date.getMonth() + 6);
  } else if (billingCycle === '1 Year') {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date;
};

// Helper function to calculate days in billing cycle
const getDaysInBillingCycle = (billingCycle) => {
  if (billingCycle === '1 Month') return 30;
  if (billingCycle === '3 Months') return 90;
  if (billingCycle === '6 Months') return 180;
  if (billingCycle === '1 Year') return 365;
  return 0;
};

// CREATE - Add a new subscription
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { subscriptionName, billingCycle, price, billingStartDate } = req.body;

    // Validation
    if (!subscriptionName || !billingCycle || !price || !billingStartDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!['1 Month', '3 Months', '6 Months', '1 Year'].includes(billingCycle)) {
      return res.status(400).json({ message: 'Invalid billing cycle' });
    }
    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const startDate = new Date(billingStartDate);
    const nextBillingDate = calculateNextBillingDate(startDate, billingCycle);

    const subscription = new Subscription({
      userId: req.user._id,
      subscriptionName,
      billingCycle,
      price,
      billingStartDate: startDate,
      nextBillingDate,
    });

    await subscription.save();

    // Add a recurring transaction to the Finance Tracker
    const recurringTransaction = new RecurringTransaction({
      userId: req.user._id,
      type: 'expense',
      amount: price,
      category: 'Subscriptions',
      description: `Subscription: ${subscriptionName}`,
      frequency: billingCycle === '1 Month' ? 'monthly' : billingCycle === '3 Months' ? 'monthly' : billingCycle === '6 Months' ? 'monthly' : 'yearly',
      startDate,
      endDate: null,
    });

    await recurringTransaction.save();

    res.status(201).json({ message: 'Subscription added', data: subscription });
  } catch (error) {
    console.error('Error adding subscription:', error);
    res.status(500).json({ message: 'Error adding subscription', error: error.message });
  }
});

// READ - Get all subscriptions for a user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Calculate average daily subscription spending
    let totalDailySpending = 0;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'Active');

    activeSubscriptions.forEach(sub => {
      const days = getDaysInBillingCycle(sub.billingCycle);
      const dailyCost = sub.price / days;
      totalDailySpending += dailyCost;
    });

    res.json({
      message: 'Subscriptions retrieved',
      data: {
        subscriptions,
        averageDailySpending: totalDailySpending.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
});

// UPDATE - Edit a subscription by ID
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionName, billingCycle, price, billingStartDate } = req.body;

    const subscription = await Subscription.findOne({ _id: id, userId: req.user._id });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot edit a cancelled subscription' });
    }

    // Update fields
    if (subscriptionName) subscription.subscriptionName = subscriptionName;
    if (billingCycle) subscription.billingCycle = billingCycle;
    if (price) subscription.price = price;
    if (billingStartDate) {
      subscription.billingStartDate = new Date(billingStartDate);
      subscription.nextBillingDate = calculateNextBillingDate(subscription.billingStartDate, subscription.billingCycle);
    }

    // Recalculate next billing date if billing cycle changes
    if (billingCycle) {
      subscription.nextBillingDate = calculateNextBillingDate(subscription.billingStartDate, billingCycle);
    }

    await subscription.save();

    // Update the corresponding recurring transaction
    const recurringTransaction = await RecurringTransaction.findOne({
      userId: req.user._id,
      description: `Subscription: ${subscription.subscriptionName}`,
    });

    if (recurringTransaction) {
      if (subscriptionName) recurringTransaction.description = `Subscription: ${subscriptionName}`;
      if (price) recurringTransaction.amount = price;
      if (billingCycle) {
        recurringTransaction.frequency = billingCycle === '1 Month' ? 'monthly' : billingCycle === '3 Months' ? 'monthly' : billingCycle === '6 Months' ? 'monthly' : 'yearly';
      }
      if (billingStartDate) recurringTransaction.startDate = new Date(billingStartDate);
      await recurringTransaction.save();
    }

    res.json({ message: 'Subscription updated', data: subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Error updating subscription', error: error.message });
  }
});

// DELETE - Cancel a subscription by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationDate } = req.body;

    if (!cancellationDate) {
      return res.status(400).json({ message: 'Cancellation date is required' });
    }

    const subscription = await Subscription.findOne({ _id: id, userId: req.user._id });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status === 'Cancelled') {
      return res.status(400).json({ message: 'Subscription is already cancelled' });
    }

    const cancelDate = new Date(cancellationDate);
    const startDate = new Date(subscription.billingStartDate);
    const nextBillingDate = new Date(subscription.nextBillingDate);

    // Prorated billing logic for monthly subscriptions
    if (subscription.billingCycle === '1 Month') {
      const daysInMonth = 30; // Approximation
      const daysSinceStart = Math.floor((cancelDate - startDate) / (1000 * 60 * 60 * 24));
      const daysUntilNextBilling = Math.floor((nextBillingDate - cancelDate) / (1000 * 60 * 60 * 24));

      if (daysSinceStart < daysInMonth && daysUntilNextBilling > 0) {
        // Charge for the next month as well
        const recurringTransaction = await RecurringTransaction.findOne({
          userId: req.user._id,
          description: `Subscription: ${subscription.subscriptionName}`,
        });

        if (recurringTransaction) {
          // Create a one-time transaction for the next month
          const oneTimeTransaction = new RecurringTransaction({
            userId: req.user._id,
            type: 'expense',
            amount: subscription.price,
            category: 'Subscriptions',
            description: `Final charge for ${subscription.subscriptionName} (prorated cancellation)`,
            frequency: 'monthly',
            startDate: nextBillingDate,
            endDate: nextBillingDate,
          });
          await oneTimeTransaction.save();
        }
      }
    }

    // Update the subscription
    subscription.status = 'Cancelled';
    subscription.cancellationDate = cancelDate;
    await subscription.save();

    // Update the recurring transaction to end
    const recurringTransaction = await RecurringTransaction.findOne({
      userId: req.user._id,
      description: `Subscription: ${subscription.subscriptionName}`,
    });

    if (recurringTransaction) {
      recurringTransaction.endDate = cancelDate;
      await recurringTransaction.save();
    }

    res.json({ message: 'Subscription cancelled', data: subscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Error cancelling subscription', error: error.message });
  }
});

// GET - Get average daily subscription spending (for Finance Tracker integration)
router.get('/daily-spending', isAuthenticated, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id, status: 'Active' });

    let totalDailySpending = 0;
    subscriptions.forEach(sub => {
      const days = getDaysInBillingCycle(sub.billingCycle);
      const dailyCost = sub.price / days;
      totalDailySpending += dailyCost;
    });

    res.json({
      message: 'Daily subscription spending retrieved',
      data: totalDailySpending.toFixed(2),
    });
  } catch (error) {
    console.error('Error calculating daily subscription spending:', error);
    res.status(500).json({ message: 'Error calculating daily subscription spending', error: error.message });
  }
});

module.exports = router;