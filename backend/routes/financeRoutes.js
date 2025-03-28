const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const RecurringTransaction = require('../models/RecurringTransaction'); // Moved to top
const cron = require('node-cron');

// Function to process recurring transactions
const processRecurringTransactions = async () => {
  try {
    const now = new Date();
    const recurringTransactions = await RecurringTransaction.find();

    for (const rt of recurringTransactions) {
      try {
        const { userId, type, amount, category, description, frequency, startDate, endDate, lastProcessed } = rt;

        // Skip if the recurrence has ended
        if (endDate && new Date(endDate) < now) {
          continue;
        }

        // Determine the next occurrence
        let nextOccurrence = new Date(startDate);
        if (lastProcessed) {
          nextOccurrence = new Date(lastProcessed);
        }

        const addTime = (date, unit, value) => {
          const newDate = new Date(date);
          if (unit === 'day') newDate.setDate(newDate.getDate() + value);
          if (unit === 'week') newDate.setDate(newDate.getDate() + value * 7);
          if (unit === 'month') newDate.setMonth(newDate.getMonth() + value);
          if (unit === 'year') newDate.setFullYear(newDate.getFullYear() + value);
          return newDate;
        };

        let intervalUnit, intervalValue;
        switch (frequency) {
          case 'daily':
            intervalUnit = 'day';
            intervalValue = 1;
            break;
          case 'weekly':
            intervalUnit = 'week';
            intervalValue = 1;
            break;
          case 'monthly':
            intervalUnit = 'month';
            intervalValue = 1;
            break;
          case 'yearly':
            intervalUnit = 'year';
            intervalValue = 1;
            break;
        }

        // Move to the next occurrence after the last processed date
        while (nextOccurrence <= now) {
          if (nextOccurrence >= new Date(startDate) && (!endDate || nextOccurrence <= new Date(endDate))) {
            // Create a new transaction
            const transaction = new Transaction({
              userId,
              type,
              amount,
              category,
              description,
              date: nextOccurrence,
            });

            await updateUserBalance(userId, type, amount);
            await transaction.save();
          }
          nextOccurrence = addTime(nextOccurrence, intervalUnit, intervalValue);
        }

        // Update lastProcessed
        rt.lastProcessed = now;
        await rt.save();
      } catch (error) {
        console.error(`Error processing recurring transaction ${rt._id}:`, error.message);
        // Continue processing other recurring transactions
      }
    }
  } catch (error) {
    console.error('Error in processRecurringTransactions:', error);
  }
};

// Schedule the process to run daily at midnight
cron.schedule('0 0 * * *', processRecurringTransactions);

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Helper function to update user balance
const updateUserBalance = async (userId, type, amount, isDeletion = false, isUpdate = false, oldType = null, oldAmount = null) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // If this is an update, reverse the effect of the old transaction
  if (isUpdate && oldType && oldAmount) {
    if (oldType === 'income') {
      user.balance -= oldAmount;
    } else if (oldType === 'expense') {
      user.balance += oldAmount;
    } else if (oldType === 'savings') {
      user.balance += oldAmount;
      user.totalSavings -= oldAmount;
    } else if (oldType === 'investment') {
      user.balance += oldAmount;
      user.totalInvestments -= oldAmount;
    }
  }

  // Apply the new effect (or reverse if deleting)
  const multiplier = isDeletion ? -1 : 1;

  if (type === 'income') {
    user.balance += amount * multiplier;
  } else if (type === 'expense') {
    user.balance -= amount * multiplier;
  } else if (type === 'savings') {
    user.balance -= amount * multiplier;
    user.totalSavings += amount * multiplier;
  } else if (type === 'investment') {
    user.balance -= amount * multiplier;
    user.totalInvestments += amount * multiplier;
  }

  // Ensure balance doesn't go negative
  if (user.balance < 0) {
    throw new Error('Insufficient balance for this transaction');
  }

  await user.save();
};

// CREATE - Add a new transaction
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    // Validation
    if (!type || !amount) {
      return res.status(400).json({ message: 'Type and amount are required' });
    }
    if (!['income', 'expense', 'savings', 'investment'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    // Validate category
    if (category) {
      const predefinedCategories = {
        income: ['Salary', 'Freelance', 'Bonus', 'Gift', 'Other'],
        expense: ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Other'],
        savings: ['Emergency Fund', 'Vacation', 'Retirement', 'Education', 'Other'],
        investment: ['Stocks', 'Mutual Funds', 'Real Estate', 'Crypto', 'Other'],
      };
      const allowedCategories = predefinedCategories[type] || [];
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category for type ${type}. Allowed categories: ${allowedCategories.join(', ')}`,
        });
      }
    }

    const transaction = new Transaction({
      userId: req.user._id,
      type,
      amount,
      category: category || null,
      description: description || null,
      date: date || Date.now(),
    });

    await updateUserBalance(req.user._id, type, amount);
    await transaction.save();
    res.status(201).json({ message: 'Transaction added', data: transaction });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ message: 'Error adding transaction', error: error.message });
  }
});

// READ - Get all transactions (with optional filters)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    let query = { userId: req.user._id };

    if (type) {
      query.type = type;
    }
    if (category) {
      query.category = category;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Include the end date
        query.date.$lt = end;
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }); // Newest first
    const user = await User.findById(req.user._id);

    res.json({
      message: 'Transactions retrieved',
      data: {
        transactions,
        balance: user.balance,
        totalSavings: user.totalSavings,
        totalInvestments: user.totalInvestments,
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

// GET - Get available categories for each transaction type
router.get('/categories', isAuthenticated, async (req, res) => {
  try {
    const categories = {
      income: ['Salary', 'Freelance', 'Bonus', 'Gift', 'Other'],
      expense: ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Other'],
      savings: ['Emergency Fund', 'Vacation', 'Retirement', 'Education', 'Other'],
      investment: ['Stocks', 'Mutual Funds', 'Real Estate', 'Crypto', 'Other'],
    };
    res.json({ message: 'Categories retrieved', data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// GET - Get financial summary/statistics
// GET - Get financial summary/statistics
router.get('/summary', isAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Include the end date
        query.date.$lt = end;
      }
    }

    const transactions = await Transaction.find(query);

    // Calculate totals
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      totalInvestments: 0,
      netSavings: 0, // Income - Expenses - Investments
      categories: {}, // Breakdown by category
      averageDailySubscriptionSpending: 0, // Add subscription spending
    };

    transactions.forEach((transaction) => {
      const amount = transaction.amount;
      const category = transaction.category || 'Uncategorized';

      // Initialize category breakdown
      if (!summary.categories[transaction.type]) {
        summary.categories[transaction.type] = {};
      }
      if (!summary.categories[transaction.type][category]) {
        summary.categories[transaction.type][category] = 0;
      }
      summary.categories[transaction.type][category] += amount;

      // Update totals
      if (transaction.type === 'income') {
        summary.totalIncome += amount;
      } else if (transaction.type === 'expense') {
        summary.totalExpenses += amount;
      } else if (transaction.type === 'savings') {
        summary.totalSavings += amount;
      } else if (transaction.type === 'investment') {
        summary.totalInvestments += amount;
      }
    });

    // Calculate net savings
    summary.netSavings = summary.totalIncome - summary.totalExpenses - summary.totalInvestments;

    // Fetch average daily subscription spending
    const subscriptionResponse = await axios.get('http://localhost:3000/api/subscriptions/daily-spending', {
      headers: { Cookie: `connect.sid=${req.sessionID}` },
    });
    summary.averageDailySubscriptionSpending = parseFloat(subscriptionResponse.data.data);

    const user = await User.findById(req.user._id);
    summary.currentBalance = user.balance;
    summary.currentSavings = user.totalSavings;
    summary.currentInvestments = user.totalInvestments;

    res.json({ message: 'Summary retrieved', data: summary });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
});

// UPDATE - Edit a transaction by ID
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, date } = req.body;

    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const oldType = transaction.type;
    const oldAmount = transaction.amount;

    // Validate category if provided
    if (category !== undefined) {
      const predefinedCategories = {
        income: ['Salary', 'Freelance', 'Bonus', 'Gift', 'Other'],
        expense: ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Other'],
        savings: ['Emergency Fund', 'Vacation', 'Retirement', 'Education', 'Other'],
        investment: ['Stocks', 'Mutual Funds', 'Real Estate', 'Crypto', 'Other'],
      };
      const targetType = type || transaction.type; // Use new type if provided, else old type
      const allowedCategories = predefinedCategories[targetType] || [];
      if (category && !allowedCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category for type ${targetType}. Allowed categories: ${allowedCategories.join(', ')}`,
        });
      }
    }

    if (type) transaction.type = type;
    if (amount) transaction.amount = amount;
    if (category !== undefined) transaction.category = category || null;
    if (description !== undefined) transaction.description = description || null;
    if (date) transaction.date = date;

    await updateUserBalance(req.user._id, transaction.type, transaction.amount, false, true, oldType, oldAmount);
    await transaction.save();
    res.json({ message: 'Transaction updated', data: transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Error updating transaction', error: error.message });
  }
});

// DELETE - Remove a transaction by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Reverse the effect of the transaction on the balance
    await updateUserBalance(req.user._id, transaction.type, transaction.amount, true);

    await Transaction.deleteOne({ _id: id });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
});

// CREATE - Add a new recurring transaction
router.post('/recurring', isAuthenticated, async (req, res) => {
  try {
    const { type, amount, category, description, frequency, startDate, endDate } = req.body;

    // Validation
    if (!type || !amount || !frequency || !startDate) {
      return res.status(400).json({ message: 'Type, amount, frequency, and start date are required' });
    }
    if (!['income', 'expense', 'savings', 'investment'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ message: 'Invalid frequency' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    const start = new Date(startDate);
    const now = new Date();
    if (start < now && frequency !== 'daily') {
      return res.status(400).json({ message: 'Start date cannot be in the past for non-daily recurring transactions' });
    }
    if (category) {
      const predefinedCategories = {
        income: ['Salary', 'Freelance', 'Bonus', 'Gift', 'Other'],
        expense: ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Other'],
        savings: ['Emergency Fund', 'Vacation', 'Retirement', 'Education', 'Other'],
        investment: ['Stocks', 'Mutual Funds', 'Real Estate', 'Crypto', 'Other'],
      };
      const allowedCategories = predefinedCategories[type] || [];
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category for type ${type}. Allowed categories: ${allowedCategories.join(', ')}`,
        });
      }
    }

    const recurringTransaction = new RecurringTransaction({
      userId: req.user._id,
      type,
      amount,
      category: category || null,
      description: description || null,
      frequency,
      startDate,
      endDate: endDate || null,
    });

    await recurringTransaction.save();
    res.status(201).json({ message: 'Recurring transaction added', data: recurringTransaction });
  } catch (error) {
    console.error('Error adding recurring transaction:', error);
    res.status(500).json({ message: 'Error adding recurring transaction', error: error.message });
  }
});

// READ - Get all recurring transactions
router.get('/recurring', isAuthenticated, async (req, res) => {
  try {
    const recurringTransactions = await RecurringTransaction.find({ userId: req.user._id }).sort({ startDate: -1 }); // Sort by startDate
    res.json({ message: 'Recurring transactions retrieved', data: recurringTransactions });
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    res.status(500).json({ message: 'Error fetching recurring transactions', error: error.message });
  }
});

// UPDATE - Edit a recurring transaction by ID
router.put('/recurring/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, description, frequency, startDate, endDate } = req.body;

    const recurringTransaction = await RecurringTransaction.findOne({ _id: id, userId: req.user._id });
    if (!recurringTransaction) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }

    // Validate category if provided
    if (category !== undefined) {
      const predefinedCategories = {
        income: ['Salary', 'Freelance', 'Bonus', 'Gift', 'Other'],
        expense: ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Other'],
        savings: ['Emergency Fund', 'Vacation', 'Retirement', 'Education', 'Other'],
        investment: ['Stocks', 'Mutual Funds', 'Real Estate', 'Crypto', 'Other'],
      };
      const targetType = type || recurringTransaction.type;
      const allowedCategories = predefinedCategories[targetType] || [];
      if (category && !allowedCategories.includes(category)) {
        return res.status(400).json({
          message: `Invalid category for type ${targetType}. Allowed categories: ${allowedCategories.join(', ')}`,
        });
      }
    }

    // Validate startDate if provided
    if (startDate) {
      const start = new Date(startDate);
      const now = new Date();
      const targetFrequency = frequency || recurringTransaction.frequency;
      if (start < now && targetFrequency !== 'daily') {
        return res.status(400).json({ message: 'Start date cannot be in the past for non-daily recurring transactions' });
      }
    }

    if (type) recurringTransaction.type = type;
    if (amount) recurringTransaction.amount = amount;
    if (category !== undefined) recurringTransaction.category = category || null;
    if (description !== undefined) recurringTransaction.description = description || null;
    if (frequency) recurringTransaction.frequency = frequency;
    if (startDate) recurringTransaction.startDate = startDate;
    if (endDate !== undefined) recurringTransaction.endDate = endDate || null;

    await recurringTransaction.save();
    res.json({ message: 'Recurring transaction updated', data: recurringTransaction });
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    res.status(500).json({ message: 'Error updating recurring transaction', error: error.message });
  }
});

// DELETE - Remove a recurring transaction by ID
router.delete('/recurring/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await RecurringTransaction.deleteOne({ _id: id, userId: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    res.json({ message: 'Recurring transaction deleted' });
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    res.status(500).json({ message: 'Error deleting recurring transaction', error: error.message });
  }
});

module.exports = router;