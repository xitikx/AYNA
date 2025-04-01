import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import '../styles/SubscriptionManager.css';

// Bind modal to the app element for accessibility
Modal.setAppElement('#root');

const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [averageDailySpending, setAverageDailySpending] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [formData, setFormData] = useState({
    subscriptionName: '',
    billingCycle: '1 Month',
    price: 0,
    billingStartDate: new Date(),
  });
  const [cancellationDate, setCancellationDate] = useState(new Date());

  // Predefined subscription prices (in INR)
  const subscriptionOptions = [
    { name: 'Amazon Prime', price: 149 },
    { name: 'Netflix', price: 190 },
    { name: 'Sony Liv', price: 299 },
    { name: 'Spotify', price: 119 },
    { name: 'GPT Plus', price: 1650 },
    { name: 'Other', price: 0 },
  ];

  // Fetch subscriptions and daily spending on mount
  useEffect(() => {
    fetchSubscriptions();
    fetchDailySpending();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/subscriptions', {
        withCredentials: true,
      });
      setSubscriptions(response.data.data.subscriptions);
      setAverageDailySpending(response.data.data.averageDailySpending);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      alert('Failed to fetch subscriptions. Please try again.');
    }
  };

  const fetchDailySpending = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/subscriptions/daily-spending', {
        withCredentials: true,
      });
      setAverageDailySpending(response.data.data);
    } catch (error) {
      console.error('Error fetching daily spending:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subscriptionName') {
      const selectedOption = subscriptionOptions.find((option) => option.name === value);
      setFormData({
        ...formData,
        subscriptionName: value,
        price: selectedOption.price,
      });
    } else if (name === 'billingStartDate') {
      setFormData({ ...formData, billingStartDate: new Date(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCancellationDateChange = (e) => {
    setCancellationDate(new Date(e.target.value));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/subscriptions', formData, {
        withCredentials: true,
      });
      setIsAddModalOpen(false);
      setFormData({
        subscriptionName: '',
        billingCycle: '1 Month',
        price: 0,
        billingStartDate: new Date(),
      });
      fetchSubscriptions();
    } catch (error) {
      console.error('Error adding subscription:', error);
      alert('Failed to add subscription. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/subscriptions/${currentSubscription._id}`, formData, {
        withCredentials: true,
      });
      setIsEditModalOpen(false);
      setCurrentSubscription(null);
      setFormData({
        subscriptionName: '',
        billingCycle: '1 Month',
        price: 0,
        billingStartDate: new Date(),
      });
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription. Please try again.');
    }
  };

  const handleCancelSubmit = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/subscriptions/${currentSubscription._id}`, {
        data: { cancellationDate: cancellationDate.toISOString().split('T')[0] },
        withCredentials: true,
      });
      setIsCancelModalOpen(false);
      setCurrentSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  const openEditModal = (subscription) => {
    setCurrentSubscription(subscription);
    setFormData({
      subscriptionName: subscription.subscriptionName,
      billingCycle: subscription.billingCycle,
      price: subscription.price,
      billingStartDate: new Date(subscription.billingStartDate),
    });
    setIsEditModalOpen(true);
  };

  const openCancelModal = (subscription) => {
    setCurrentSubscription(subscription);
    setCancellationDate(new Date());
    setIsCancelModalOpen(true);
  };

  return (
    <div className="subscription-manager">
      <h2>Subscription Manager</h2>
      <div className="subscription-header">
        <button onClick={() => setIsAddModalOpen(true)} className="add-button">
          Add Subscription
        </button>
        <div className="daily-spending">
          Average Daily Spending: ₹{parseFloat(averageDailySpending).toFixed(2)}
        </div>
      </div>

      {/* Subscription List */}
      {subscriptions.length === 0 ? (
        <p>No subscriptions found. Add a subscription to get started!</p>
      ) : (
        <table className="subscription-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Billing Cycle</th>
              <th>Price (₹)</th>
              <th>Start Date</th>
              <th>Next Billing</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription._id}>
                <td>{subscription.subscriptionName}</td>
                <td>{subscription.billingCycle}</td>
                <td>{subscription.price}</td>
                <td>{new Date(subscription.billingStartDate).toLocaleDateString()}</td>
                <td>{new Date(subscription.nextBillingDate).toLocaleDateString()}</td>
                <td>
                  {subscription.status === 'Active' && (
                    <>
                      <button onClick={() => openEditModal(subscription)} className="edit-button">
                        Edit
                      </button>
                      <button onClick={() => openCancelModal(subscription)} className="cancel-button">
                        Cancel
                      </button>
                    </>
                  )}
                  {subscription.status === 'Cancelled' && (
                    <span>Cancelled on {new Date(subscription.cancellationDate).toLocaleDateString()}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Subscription Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={() => setIsAddModalOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h3>Add Subscription</h3>
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label>Subscription Name:</label>
            <select
              name="subscriptionName"
              value={formData.subscriptionName}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a subscription</option>
              {subscriptionOptions.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Billing Cycle:</label>
            <select
              name="billingCycle"
              value={formData.billingCycle}
              onChange={handleInputChange}
              required
            >
              <option value="1 Month">1 Month</option>
              <option value="3 Months">3 Months</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Year">1 Year</option>
            </select>
          </div>
          <div className="form-group">
            <label>Price (₹):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Billing Start Date:</label>
            <input
              type="date"
              name="billingStartDate"
              value={formData.billingStartDate.toISOString().split('T')[0]}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="modal-buttons">
            <button type="submit">Add</button>
            <button type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Subscription Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h3>Edit Subscription</h3>
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label>Subscription Name:</label>
            <select
              name="subscriptionName"
              value={formData.subscriptionName}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a subscription</option>
              {subscriptionOptions.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Billing Cycle:</label>
            <select
              name="billingCycle"
              value={formData.billingCycle}
              onChange={handleInputChange}
              required
            >
              <option value="1 Month">1 Month</option>
              <option value="3 Months">3 Months</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Year">1 Year</option>
            </select>
          </div>
          <div className="form-group">
            <label>Price (₹):</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Billing Start Date:</label>
            <input
              type="date"
              name="billingStartDate"
              value={formData.billingStartDate.toISOString().split('T')[0]}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="modal-buttons">
            <button type="submit">Update</button>
            <button type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onRequestClose={() => setIsCancelModalOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h3>Cancel Subscription</h3>
        <p>Are you sure you want to cancel {currentSubscription?.subscriptionName}?</p>
        <div className="form-group">
          <label>Cancellation Date:</label>
          <input
            type="date"
            value={cancellationDate.toISOString().split('T')[0]}
            onChange={handleCancellationDateChange}
            required
          />
        </div>
        <div className="modal-buttons">
          <button onClick={handleCancelSubmit}>Confirm Cancel</button>
          <button onClick={() => setIsCancelModalOpen(false)}>Close</button>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionManager;