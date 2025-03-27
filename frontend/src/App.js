import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import CalorieCounter from './pages/CalorieCounter';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mini-apps/calorie" element={<CalorieCounter />} />
        {/* Placeholder routes for other mini-apps */}
        <Route path="/mini-apps/finance" element={<div>Finance Mini-App (Placeholder)</div>} />
        <Route path="/mini-apps/todo" element={<div>To-Do Mini-App (Placeholder)</div>} />
        <Route path="/mini-apps/diary" element={<div>Diary Mini-App (Placeholder)</div>} />
      </Routes>
    </Router>
  );
};

export default App;