import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CalorieCounter from './pages/CalorieCounter';
import ToDoList from './pages/ToDoList';
import Diary from './pages/Diary';
import Finance from './pages/Finance';
import SubscriptionManager from './components/SubscriptionManager';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mini-apps/calorie" element={<CalorieCounter />} />
        <Route path="/mini-apps/finance" element={<Finance />} />
        <Route path="/mini-apps/todo" element={<ToDoList />} />
        <Route path="/mini-apps/diary" element={<Diary />} />
        <Route path="/mini-apps/subscriptions" element={<SubscriptionManager />} />
      </Routes>
    </Router>
  );
};

export default App;