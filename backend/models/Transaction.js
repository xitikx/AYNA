const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'savings', 'investment'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function (value) {
        if (!value) return true; // Allow null/undefined (no category)
        const predefinedCategories = {
          income: ['Salary', 'Freelance', 'Bonus', 'Gift', 'Other'],
          expense: ['Groceries', 'Rent', 'Utilities', 'Entertainment', 'Travel', 'Other'],
          savings: ['Emergency Fund', 'Vacation', 'Retirement', 'Education', 'Other'],
          investment: ['Stocks', 'Mutual Funds', 'Real Estate', 'Crypto', 'Other'],
        };
        const allowedCategories = predefinedCategories[this.type] || [];
        return allowedCategories.includes(value) || value === 'Other'; // Allow predefined or 'Other'
      },
      message: props => `${props.value} is not a valid category for ${props.path} with type ${props.instance.type}`,
    },
  },
  description: {
    type: String,
    trim: true,
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', TransactionSchema);