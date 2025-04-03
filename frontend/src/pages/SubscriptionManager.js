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
  const [message, setMessage] = useState('');

  const subscriptionOptions = [
    { name: 'Amazon Prime', price: 149 },
    { name: 'Netflix', price: 190 },
    { name: 'Sony Liv', price: 299 },
    { name: 'Spotify', price: 119 },
    { name: 'GPT Plus', price: 1650 },
    { name: 'Other', price: 0 },
  ];

  useEffect(() => {
    fetchSubscriptions();
    fetchDailySpending();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/subscriptions', {
        withCredentials: true,
      });
      setSubscriptions(response.data.data.subscriptions || []);
      setAverageDailySpending(response.data.data.averageDailySpending || 0);
      setMessage('');
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setMessage('Failed to fetch subscriptions. Please try again.');
    }
  };

  const fetchDailySpending = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/subscriptions/daily-spending', {
        withCredentials: true,
      });
      setAverageDailySpending(response.data.data || 0);
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
      setMessage('Subscription added successfully!');
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
      setMessage('Failed to add subscription. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/subscriptions/${currentSubscription._id}`, formData, {
        withCredentials: true,
      });
      setMessage('Subscription updated successfully!');
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
      setMessage('Failed to update subscription. Please try again.');
    }
  };

  const handleCancelSubmit = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/subscriptions/${currentSubscription._id}`, {
        data: { cancellationDate: cancellationDate.toISOString().split('T')[0] },
        withCredentials: true,
      });
      setMessage('Subscription cancelled successfully!');
      setIsCancelModalOpen(false);
      setCurrentSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setMessage('Failed to cancel subscription. Please try again.');
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
    <div className="sub-manager">
      <div className="sub-gradient"></div>
      <header className="sub-header">
        <h1>Subscription Manager</h1>
      </header>
      <main className="sub-main">
        <div className="sub-controls">
          <button onClick={() => setIsAddModalOpen(true)} className="sub-add-btn">
            Add Subscription
          </button>
          <div className="sub-daily-spending">
            Average Daily Spending: ₹{parseFloat(averageDailySpending).toFixed(2)}
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <p className="sub-empty">No subscriptions found. Add one to get started!</p>
        ) : (
          <div className="sub-list">
            {subscriptions.map((subscription) => (
              <div key={subscription._id} className="sub-item">
                <div className="sub-details">
                  <h3 className="sub-name">{subscription.subscriptionName}</h3>
                  <p className="sub-cycle">Cycle: {subscription.billingCycle}</p>
                  <p className="sub-price">₹{subscription.price}</p>
                  <p className="sub-start">
                    Start: {new Date(subscription.billingStartDate).toLocaleDateString()}
                  </p>
                  <p className="sub-next">
                    Next: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="sub-actions">
                  {subscription.status === 'Active' && (
                    <>
                      <button onClick={() => openEditModal(subscription)} className="sub-edit-btn">
                        Edit
                      </button>
                      <button onClick={() => openCancelModal(subscription)} className="sub-cancel-btn">
                        Cancel
                      </button>
                    </>
                  )}
                  {subscription.status === 'Cancelled' && (
                    <span className="sub-cancelled">
                      Cancelled on {new Date(subscription.cancellationDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={() => setIsAddModalOpen(false)}
        className="sub-modal"
        overlayClassName="sub-modal-overlay"
      >
        <div className="sub-modal-header">
          <h3>Add Subscription</h3>
          <button className="sub-modal-close" onClick={() => setIsAddModalOpen(false)}>
            ×
          </button>
        </div>
        <form onSubmit={handleAddSubmit} className="sub-add-form">
          <div className="sub-form-grid">
            <div className="sub-form-field">
              <label htmlFor="sub-name-input">Subscription Name</label>
              <select
                id="sub-name-input"
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
            <div className="sub-form-field">
              <label htmlFor="sub-cycle-input">Billing Cycle</label>
              <select
                id="sub-cycle-input"
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
            <div className="sub-form-field">
              <label htmlFor="sub-price-input">Price (₹)</label>
              <input
                id="sub-price-input"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="sub-form-field">
              <label htmlFor="sub-start-date-input">Billing Start Date</label>
              <input
                id="sub-start-date-input"
                type="date"
                name="billingStartDate"
                value={formData.billingStartDate.toISOString().split('T')[0]}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="sub-modal-actions">
            <button type="submit" className="sub-add-btn">
              Add
            </button>
            <button type="button" className="sub-cancel-btn" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        className="sub-modal"
        overlayClassName="sub-modal-overlay"
      >
        <div className="sub-modal-header">
          <h3>Edit Subscription</h3>
          <button className="sub-modal-close" onClick={() => setIsEditModalOpen(false)}>
            ×
          </button>
        </div>
        <form onSubmit={handleEditSubmit} className="sub-add-form">
          <div className="sub-form-grid">
            <div className="sub-form-field">
              <label htmlFor="sub-name-input">Subscription Name</label>
              <select
                id="sub-name-input"
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
            <div className="sub-form-field">
              <label htmlFor="sub-cycle-input">Billing Cycle</label>
              <select
                id="sub-cycle-input"
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
            <div className="sub-form-field">
              <label htmlFor="sub-price-input">Price (₹)</label>
              <input
                id="sub-price-input"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="sub-form-field">
              <label htmlFor="sub-start-date-input">Billing Start Date</label>
              <input
                id="sub-start-date-input"
                type="date"
                name="billingStartDate"
                value={formData.billingStartDate.toISOString().split('T')[0]}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="sub-modal-actions">
            <button type="submit" className="sub-update-btn">
              Update
            </button>
            <button type="button" className="sub-cancel-btn" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCancelModalOpen}
        onRequestClose={() => setIsCancelModalOpen(false)}
        className="sub-modal"
        overlayClassName="sub-modal-overlay"
      >
        <div className="sub-modal-header">
          <h3>Cancel Subscription</h3>
          <button className="sub-modal-close" onClick={() => setIsCancelModalOpen(false)}>
            ×
          </button>
        </div>
        <div className="sub-cancel-content">
          <p>Are you sure you want to cancel {currentSubscription?.subscriptionName}?</p>
          <div className="sub-form-field">
            <label htmlFor="sub-cancel-date-input">Cancellation Date</label>
            <input
              id="sub-cancel-date-input"
              type="date"
              value={cancellationDate.toISOString().split('T')[0]}
              onChange={handleCancellationDateChange}
              required
            />
          </div>
        </div>
        <div className="sub-modal-actions">
          <button onClick={handleCancelSubmit} className="sub-delete-btn">
            Confirm Cancel
          </button>
          <button type="button" className="sub-cancel-btn" onClick={() => setIsCancelModalOpen(false)}>
            Close
          </button>
        </div>
      </Modal>

      {message && (
        <p className={`sub-message ${message.includes('Failed') ? 'error' : ''}`}>{message}</p>
      )}
    </div>
  );
};

export default SubscriptionManager;