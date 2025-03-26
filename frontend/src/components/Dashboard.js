import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('http://localhost:3000/check-session', {
          withCredentials: true,
        });
        if (response.data.message === 'User is logged in') {
          setUser(response.data.user);
        } else {
          setMessage('You are not logged in');
          window.location.href = '/login';
        }
      } catch (error) {
        setMessage('Error checking session');
        window.location.href = '/login';
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get('http://localhost:3000/logout', { withCredentials: true });
      window.location.href = '/';
    } catch (error) {
      setMessage('Error logging out');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Dashboard</h2>
      {user ? (
        <>
          <p>Welcome, {user.username}!</p>
          <button onClick={handleLogout} style={styles.button}>Logout</button>
        </>
      ) : (
        <p>Loading...</p>
      )}
      {message && <p>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '50px',
  },
  button: {
    margin: '10px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default Dashboard;