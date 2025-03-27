import React from 'react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const handleGoogleLogin = () => {
    // Full backend URL for OAuth
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="landing-page">
      <header className="app-header">
        <div className="title-container">
          <h1 className="main-title">AYNA</h1>
          <span className="hindi-subscript">आयना</span>
        </div>
        <p className="tagline">Your Life, Reflected.</p>
      </header>
      <main className="main-content">
        <p className="app-description">
          AYNA shows who you truly are—a mirror to your money, meals, tasks, and thoughts. One app, endless clarity.
        </p>
        <button className="login-button" onClick={handleGoogleLogin}>
          Continue with Google
        </button>
      </main>
    </div>
  );
};

export default LandingPage;