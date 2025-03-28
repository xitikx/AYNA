import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [diaryCount, setDiaryCount] = useState(0);
  const [todoCount, setTodoCount] = useState(0);
  const [calorieToday, setCalorieToday] = useState(0);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/check-session', {
          withCredentials: true,
        });
        if (response.data.message === 'User is logged in') {
          setUser(response.data.user);
          fetchSummaries();
        } else {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Session check error:', error);
        window.location.href = '/';
      }
    };
    checkSession();
  }, []);

  const fetchSummaries = async () => {
    try {
      const [diaryRes, todoRes, calorieRes, subscriptionsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/subscriptions', { withCredentials: true }),
        axios.get('http://localhost:3000/api/diary', { withCredentials: true }),
        axios.get('http://localhost:3000/api/todos?completed=false', { withCredentials: true }),
        axios.get(`http://localhost:3000/api/calories?date=${new Date().toISOString().split('T')[0]}`, {
          withCredentials: true,
        }),
      ]);
      setSubscriptionsCount(subscriptionsRes.data.data.length);
      setDiaryCount(diaryRes.data.data.length);
      setTodoCount(todoRes.data.data.length);
      setCalorieToday(calorieRes.data.data.reduce((sum, entry) => sum + entry.calories, 0));

    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:3000/logout', { withCredentials: true });
      window.location.href = '/';
    } catch (error) {
      setMessage('Error logging out');
    }
  };

  const openMiniApp = (appName) => {
    const miniAppRoutes = {
      Finance: '/mini-apps/finance',
      Calorie: '/mini-apps/calorie',
      'To-Do': '/mini-apps/todo',
      Diary: '/mini-apps/diary',
      Subscriptions: '/mini-apps/subscriptions',
    };
    const url = miniAppRoutes[appName];
    window.open(url, '_blank'); // Open the route in a new tab
  };

  const miniApps = [
    { name: 'Finance', summary: 'Total Spent: $150', icon: 'fa-wallet' },
    { name: 'Calorie', summary: `Today: ${calorieToday} kcal`, icon: 'fa-apple-alt' },
    { name: 'To-Do', summary: `Pending: ${todoCount}`, icon: 'fa-check-square' },
    { name: 'Diary', summary: `Entries: ${diaryCount}`, icon: 'fa-book' },
    { name: 'Subscriptions', summary: `Entries: ${subscriptionsCount}`, icon: 'fa-book' },
  ];

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Welcome, {user.name || user.username.split('@')[0]}</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main className="main-content">
        <div className="grid-container">
          <div className="mini-app-grid">
            {miniApps.map((app) => (
              <div key={app.name} className="mini-app-card">
                <div className="icon-container">
                  <i className={`fas ${app.icon}`}></i>
                </div>
                <div className="card-content">
                  <h2>{app.name}</h2>
                  <p>{app.summary}</p>
                  <button
                    className="launch-btn"
                    onClick={() => openMiniApp(app.name)}
                  >
                    Launch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Dashboard;