import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Finance.css';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [balance, setBalance] = useState(0); // Renamed to "Income" in UI
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });
  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [newRecurringTransaction, setNewRecurringTransaction] = useState({
    type: 'income',
    amount: '',
    category: '',
    description: '',
    frequency: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [editTransaction, setEditTransaction] = useState(null);
  const [editRecurringTransaction, setEditRecurringTransaction] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
    fetchRecurringTransactions();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/finance/categories', { withCredentials: true });
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await axios.get(`http://localhost:3000/api/finance?${query}`, { withCredentials: true });
      setTransactions(response.data.data.transactions);
      setBalance(response.data.data.balance); // Represents Income
      setTotalSavings(response.data.data.totalSavings);
      setTotalInvestments(response.data.data.totalInvestments);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchRecurringTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/finance/recurring', { withCredentials: true });
      setRecurringTransactions(response.data.data);
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/finance', newTransaction, { withCredentials: true });
      setNewTransaction({
        type: 'income',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert(error.response?.data?.message || 'Error adding transaction');
    }
  };

  const handleEditTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/finance/${editTransaction._id}`, editTransaction, { withCredentials: true });
      setEditTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert(error.response?.data?.message || 'Error updating transaction');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`http://localhost:3000/api/finance/${id}`, { withCredentials: true });
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleAddRecurringTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/finance/recurring', newRecurringTransaction, { withCredentials: true });
      setNewRecurringTransaction({
        type: 'income',
        amount: '',
        category: '',
        description: '',
        frequency: 'daily',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Error adding recurring transaction:', error);
      alert(error.response?.data?.message || 'Error adding recurring transaction');
    }
  };

  const handleEditRecurringTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/finance/recurring/${editRecurringTransaction._id}`, editRecurringTransaction, { withCredentials: true });
      setEditRecurringTransaction(null);
      fetchRecurringTransactions();
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      alert(error.response?.data?.message || 'Error updating recurring transaction');
    }
  };

  const handleDeleteRecurringTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      try {
        await axios.delete(`http://localhost:3000/api/finance/recurring/${id}`, { withCredentials: true });
        fetchRecurringTransactions();
      } catch (error) {
        console.error('Error deleting recurring transaction:', error);
      }
    }
  };

  const applyFilters = () => {
    fetchTransactions();
  };

  return (
    <div className="fin-container">
      <div className="fin-gradient"></div>
      <header className="fin-header">
        <h2>Finance Manager</h2>
      </header>
      <div className="fin-tabs">
        <button className={activeTab === 'overview' ? 'fin-tab-active' : 'fin-tab'} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={activeTab === 'transactions' ? 'fin-tab-active' : 'fin-tab'} onClick={() => setActiveTab('transactions')}>
          Transactions
        </button>
        <button className={activeTab === 'recurring' ? 'fin-tab-active' : 'fin-tab'} onClick={() => setActiveTab('recurring')}>
          Recurring Transactions
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="fin-overview">
          <h3>Financial Overview</h3>
          <div className="fin-summary-cards">
            <div className="fin-card">
              <h4>Income</h4>
              <p>${balance.toFixed(2)}</p>
            </div>
            <div className="fin-card">
              <h4>Savings</h4>
              <p>${totalSavings.toFixed(2)}</p>
            </div>
            <div className="fin-card">
              <h4>Investments</h4>
              <p>${totalInvestments.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="fin-transactions">
          <h3>Transactions</h3>
          <form onSubmit={handleAddTransaction} className="fin-transaction-form">
            <select
              value={newTransaction.type}
              onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value, category: '' })}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              required
            />
            <select
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories[newTransaction.type]?.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
            />
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
            />
            <button type="submit" className="fin-add-btn">Add Transaction</button>
          </form>

          <div className="fin-filters">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
            <button onClick={applyFilters} className="fin-filter-btn">Apply Filters</button>
          </div>

          <div className="fin-transaction-list">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="fin-transaction-item">
                <div>
                  <p><strong>Type:</strong> {transaction.type}</p>
                  <p><strong>Amount:</strong> ${transaction.amount.toFixed(2)}</p>
                  <p><strong>Category:</strong> {transaction.category || 'N/A'}</p>
                  <p><strong>Description:</strong> {transaction.description || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <div className="fin-transaction-actions">
                  <button className="fin-edit-btn" onClick={() => setEditTransaction(transaction)}>Edit</button>
                  <button className="fin-delete-btn" onClick={() => handleDeleteTransaction(transaction._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {editTransaction && (
            <div className="fin-modal">
              <div className="fin-modal-content">
                <h3>Edit Transaction</h3>
                <form onSubmit={handleEditTransaction}>
                  <select
                    value={editTransaction.type}
                    onChange={(e) => setEditTransaction({ ...editTransaction, type: e.target.value, category: '' })}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="savings">Savings</option>
                    <option value="investment">Investment</option>
                  </select>
                  <input
                    type="number"
                    value={editTransaction.amount}
                    onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                    required
                  />
                  <select
                    value={editTransaction.category || ''}
                    onChange={(e) => setEditTransaction({ ...editTransaction, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories[editTransaction.type]?.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editTransaction.description || ''}
                    onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })}
                  />
                  <input
                    type="date"
                    value={new Date(editTransaction.date).toISOString().split('T')[0]}
                    onChange={(e) => setEditTransaction({ ...editTransaction, date: e.target.value })}
                  />
                  <button type="submit" className="fin-update-btn">Update</button>
                  <button type="button" className="fin-cancel-btn" onClick={() => setEditTransaction(null)}>Cancel</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recurring' && (
        <div className="fin-recurring-transactions">
          <h3>Recurring Transactions</h3>
          <form onSubmit={handleAddRecurringTransaction} className="fin-recurring-transaction-form">
            <select
              value={newRecurringTransaction.type}
              onChange={(e) => setNewRecurringTransaction({ ...newRecurringTransaction, type: e.target.value, category: '' })}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={newRecurringTransaction.amount}
              onChange={(e) => setNewRecurringTransaction({ ...newRecurringTransaction, amount: e.target.value })}
              required
            />
            <select
              value={newRecurringTransaction.category}
              onChange={(e) => setNewRecurringTransaction({ ...newRecurringTransaction, category: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories[newRecurringTransaction.type]?.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description"
              value={newRecurringTransaction.description}
              onChange={(e) => setNewRecurringTransaction({ ...newRecurringTransaction, description: e.target.value })}
            />
            <select
              value={newRecurringTransaction.frequency}
              onChange={(e) => setNewRecurringTransaction({ ...newRecurringTransaction, frequency: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="date"
              value={newRecurringTransaction.startDate}
              onChange={(e) => setNewRecurringTransaction({ ...newRecurringTransaction, startDate: e.target.value })}
            />
            <input
              type="date"
              value={newRecurringTransaction.endDate}
              onChange={(e) => setNewRecurringTransaction({ ...newRecurringTransaction, endDate: e.target.value })}
            />
            <button type="submit" className="fin-add-btn">Add Recurring Transaction</button>
          </form>

          <div className="fin-recurring-transaction-list">
            {recurringTransactions.map((rt) => (
              <div key={rt._id} className="fin-recurring-transaction-item">
                <div>
                  <p><strong>Type:</strong> {rt.type}</p>
                  <p><strong>Amount:</strong> ${rt.amount.toFixed(2)}</p>
                  <p><strong>Category:</strong> {rt.category || 'N/A'}</p>
                  <p><strong>Description:</strong> {rt.description || 'N/A'}</p>
                  <p><strong>Frequency:</strong> {rt.frequency}</p>
                  <p><strong>Start Date:</strong> {new Date(rt.startDate).toLocaleDateString()}</p>
                  <p><strong>End Date:</strong> {rt.endDate ? new Date(rt.endDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="fin-recurring-transaction-actions">
                  <button className="fin-edit-btn" onClick={() => setEditRecurringTransaction(rt)}>Edit</button>
                  <button className="fin-delete-btn" onClick={() => handleDeleteRecurringTransaction(rt._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {editRecurringTransaction && (
            <div className="fin-modal">
              <div className="fin-modal-content">
                <h3>Edit Recurring Transaction</h3>
                <form onSubmit={handleEditRecurringTransaction}>
                  <select
                    value={editRecurringTransaction.type}
                    onChange={(e) => setEditRecurringTransaction({ ...editRecurringTransaction, type: e.target.value, category: '' })}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="savings">Savings</option>
                    <option value="investment">Investment</option>
                  </select>
                  <input
                    type="number"
                    value={editRecurringTransaction.amount}
                    onChange={(e) => setEditRecurringTransaction({ ...editRecurringTransaction, amount: e.target.value })}
                    required
                  />
                  <select
                    value={editRecurringTransaction.category || ''}
                    onChange={(e) => setEditRecurringTransaction({ ...editRecurringTransaction, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories[editRecurringTransaction.type]?.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editRecurringTransaction.description || ''}
                    onChange={(e) => setEditRecurringTransaction({ ...editRecurringTransaction, description: e.target.value })}
                  />
                  <select
                    value={editRecurringTransaction.frequency}
                    onChange={(e) => setEditRecurringTransaction({ ...editRecurringTransaction, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <input
                    type="date"
                    value={new Date(editRecurringTransaction.startDate).toISOString().split('T')[0]}
                    onChange={(e) => setEditRecurringTransaction({ ...editRecurringTransaction, startDate: e.target.value })}
                  />
                  <input
                    type="date"
                    value={editRecurringTransaction.endDate ? new Date(editRecurringTransaction.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditRecurringTransaction({ ...editRecurringTransaction, endDate: e.target.value })}
                  />
                  <button type="submit" className="fin-update-btn">Update</button>
                  <button type="button" className="fin-cancel-btn" onClick={() => setEditRecurringTransaction(null)}>Cancel</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Finance;