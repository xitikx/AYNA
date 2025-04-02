// CalorieCounter.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/CalorieCounter.css';
import CalorieTrendChart from '../components/CalorieTrendChart';

const CalorieCounter = () => {
  const [calories, setCalories] = useState([]);
  const [totalToday, setTotalToday] = useState(0);
  const [foodItem, setFoodItem] = useState('');
  const [calorieAmount, setCalorieAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCalories();
    fetchDailyTotal();
  }, []);

  const fetchCalories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/calories', { withCredentials: true });
      const calorieData = response.data.data || [];
      setCalories(calorieData);
    } catch (error) {
      console.error('Error fetching calories:', error.response ? error.response.data : error.message);
      setMessage('Failed to load calorie data.');
    }
  };

  const fetchDailyTotal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`http://localhost:3000/api/calories/daily-totals?startDate=${today}&endDate=${today}`, {
        withCredentials: true,
      });
      const dailyTotals = response.data.data || [];
      const todayTotal = dailyTotals.length > 0 ? dailyTotals[0].totalCalories : 0;
      setTotalToday(todayTotal);
    } catch (error) {
      console.error('Error fetching daily total:', error.response ? error.response.data : error.message);
      setMessage('Failed to load daily total.');
    }
  };

  const handleAddCalorie = async (e) => {
    e.preventDefault();
    if (!foodItem || !calorieAmount) {
      setMessage('Please fill in all fields.');
      return;
    }

    const calories = parseInt(calorieAmount);
    if (isNaN(calories) || calories <= 0) {
      setMessage('Calories must be a positive number.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/calories',
        { food: foodItem, calories: parseInt(calorieAmount), date },
        { withCredentials: true }
      );
      console.log('Add calorie response:', response.data);
      setMessage('Calorie entry added successfully!');
      setFoodItem('');
      setCalorieAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      fetchCalories();
      fetchDailyTotal();
    } catch (error) {
      console.error('Error adding calorie:', error.response ? error.response.data : error.message);
      setMessage('Failed to add calorie entry: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  const handleDeleteCalorie = async (id) => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/calories/${id}`, { withCredentials: true });
      console.log('Delete calorie response:', response.data);
      setMessage('Calorie entry deleted successfully!');
      fetchCalories();
      fetchDailyTotal();
    } catch (error) {
      console.error('Error deleting calorie:', error.response ? error.response.data : error.message);
      setMessage('Failed to delete calorie entry: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  const recentCalories = calories.slice(0, 5);

  return (
    <div className="calorie-container">
      <div className="calorie-gradient"></div>
      <header className="calorie-header">
        <h1>Calorie Counter</h1>
        <div className="calorie-total-today">
          <h2>Today's Total: {totalToday} kcal</h2>
        </div>
      </header>
      <main className="calorie-main">
        <section className="calorie-form-section">
          <h3>Add New Entry</h3>
          <form onSubmit={handleAddCalorie} className="calorie-form">
            <div className="calorie-form-group">
              <label htmlFor="foodItem">Food Item:</label>
              <input
                type="text"
                id="foodItem"
                value={foodItem}
                onChange={(e) => setFoodItem(e.target.value)}
                placeholder="e.g., Apple"
              />
            </div>
            <div className="calorie-form-group">
              <label htmlFor="calorieAmount">Calories (kcal):</label>
              <input
                type="number"
                id="calorieAmount"
                value={calorieAmount}
                onChange={(e) => setCalorieAmount(e.target.value)}
                placeholder="e.g., 95"
              />
            </div>
            <div className="calorie-form-group">
              <label htmlFor="date">Date:</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <button type="submit" className="calorie-add-btn">Add Entry</button>
          </form>
        </section>
        <section className="calorie-list-section">
          <h3>Recent Entries (Last 5)</h3>
          {recentCalories.length > 0 ? (
            <div className="calorie-list">
              {recentCalories.map((entry) => (
                <div key={entry._id} className="calorie-entry">
                  <div className="calorie-entry-details">
                    <p><strong>{entry.food}</strong></p>
                    <p>{entry.calories} kcal</p>
                    <p>{new Date(entry.date).toISOString().split('T')[0]}</p>
                  </div>
                  <button
                    className="calorie-delete-btn"
                    onClick={() => handleDeleteCalorie(entry._id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent entries found.</p>
          )}
        </section>
      </main>
      <section className="calorie-trend-section">
        <h3>Calorie Intake Trend</h3>
        <CalorieTrendChart />
      </section>
      {message && <p className="calorie-message">{message}</p>}
    </div>
  );
};

export default CalorieCounter;