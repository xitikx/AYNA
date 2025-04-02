// LandingPage.js
import React, { useState, useEffect, useCallback } from "react";
import "../styles/LandingPage.css";
import GoogleLogo from "../assets/google.jpg";

const features = [
  {
    id: 1,
    icon: "🍎",
    title: "Calorie Counter",
    description: "Track meals, monitor macros, stay healthy.",
  },
  {
    id: 2,
    icon: "💳",
    title: "Subscriptions",
    description: "Manage, track, and get reminders effortlessly.",
  },
  {
    id: 3,
    icon: "📅",
    title: "Calendar",
    description: "Sync, plan, and set reminders easily.",
  },
  {
    id: 4,
    icon: "📝",
    title: "Diary",
    description: "Securely journal thoughts with search & tags.",
  },
  {
    id: 5,
    icon: "💰",
    title: "Finance",
    description: "Track spending, set goals, and save smart.",
  },
  {
    id: 6,
    icon: "✅",
    title: "To-Do List",
    description: "Prioritize tasks, set deadlines, stay productive.",
  },
];

const LandingPage = () => {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [snowflakes, setSnowflakes] = useState([]);

  const calculateSnowflakes = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = Math.floor((width * height) / 10000);

    return Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * 50,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 5,
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => setSnowflakes(calculateSnowflakes());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [calculateSnowflakes]);

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  const goToPrevFeature = () => {
    setCurrentFeatureIndex((prevIndex) =>
      prevIndex === 0 ? features.length - 1 : prevIndex - 1
    );
  };

  const goToNextFeature = () => {
    setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  const goToFeature = (index) => {
    if (index >= 0 && index < features.length) {
      setCurrentFeatureIndex(index);
    }
  };

  return (
    <div className="landing-page">
      <div className="gradient-background"></div>
      {snowflakes.map((flake, index) => (
        <div
          key={`snowflake-${index}`}
          className="snowflake"
          style={{
            left: `${flake.x}px`,
            bottom: `${flake.y}px`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${5 + flake.speed}s`,
          }}
        />
      ))}

      <main className="main-content">
        <div className="brand-section">
          <h1 className="brand-title">आयना</h1>
          <p className="brand-tagline">Organize your life, effortlessly</p>
        </div>

        <div className="premium-card">
          <div className="carousel-container">
            <div className="feature-carousel">
              <div className="carousel-inner">
                <div
                  className="feature-slide"
                  key={`feature-${currentFeatureIndex}`}
                >
                  <div className="feature-icon-container">
                    <span className="feature-icon">
                      {features[currentFeatureIndex].icon}
                    </span>
                  </div>
                  <h3 className="feature-title">
                    {features[currentFeatureIndex].title}
                  </h3>
                  <p className="feature-description">
                    {features[currentFeatureIndex].description}
                  </p>
                </div>
              </div>

              <div className="carousel-controls">
                <button
                  className="carousel-control prev"
                  onClick={goToPrevFeature}
                  aria-label="Previous feature"
                >
                  <span className="control-icon">←</span>
                </button>
                <div className="carousel-dots">
                  {features.map((_, index) => (
                    <button
                      key={`dot-${index}`}
                      className={`dot ${
                        index === currentFeatureIndex ? "active" : ""
                      }`}
                      onClick={() => goToFeature(index)}
                      aria-label={`Go to feature ${index + 1}`}
                      aria-current={index === currentFeatureIndex}
                    />
                  ))}
                </div>
                <button
                  className="carousel-control next"
                  onClick={goToNextFeature}
                  aria-label="Next feature"
                >
                  <span className="control-icon">→</span>
                </button>
              </div>
            </div>
          </div>

          <div className="login-section">
            <button
              className="google-login-button"
              onClick={handleGoogleLogin}
              aria-label="Continue with Google"
            >
              <img
                src={GoogleLogo}
                alt="Google Logo"
                className="google-logo"
                width="20"
                height="20"
              />
              <span>Continue with Google</span>
            </button>
            <p className="login-hint">Secure one-click access</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
