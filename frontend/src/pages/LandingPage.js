import React, { useState, useEffect, useCallback } from "react";
import "../styles/LandingPage.css";
import GoogleLogo from "../assets/google.jpg";

const features = [
  {
    id: 1,
    icon: "🍎",
    title: "Calorie Counter",
    description:
      "Track your daily nutrition intake with our comprehensive calorie counter that helps you maintain a healthy diet.",
  },
  {
    id: 2,
    icon: "💳",
    title: "Subscriptions",
    description:
      "Manage all your subscriptions in one place and never miss a payment or forget about unused services.",
  },
  {
    id: 3,
    icon: "📅",
    title: "Calendar",
    description:
      "Organize your schedule with our intuitive calendar that syncs across all your devices.",
  },
  {
    id: 4,
    icon: "📝",
    title: "Diary",
    description:
      "Journal your thoughts and memories securely with our private diary feature.",
  },
  {
    id: 5,
    icon: "💰",
    title: "Finance",
    description:
      "Take control of your finances with budgeting tools and expense tracking.",
  },
  {
    id: 6,
    icon: "✅",
    title: "To-Do List",
    description:
      "Stay productive with smart to-do lists that help you prioritize your tasks.",
  },
];

const LandingPage = () => {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [snowflakes, setSnowflakes] = useState([]);

  // Memoized function to calculate snowflakes
  const calculateSnowflakes = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = Math.floor((width * height) / 10000); // Adjust density as needed

    return Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 5,
    }));
  }, []);

  useEffect(() => {
    // Carousel auto-rotate
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Create snowflakes based on screen size
    const handleResize = () => {
      setSnowflakes(calculateSnowflakes());
    };

    // Initial setup
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
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
      {/* Subtle Animated Background */}
      <div className="animated-background"></div>

      {/* Snowflakes */}
      {snowflakes.map((flake, index) => (
        <div
          key={`snowflake-${index}`}
          className="snowflake"
          style={{
            left: `${flake.x}px`,
            top: `${flake.y}px`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${5 + flake.speed}s`,
          }}
        />
      ))}

      {/* Main Content */}
      <main className="main-content">
        {/* Brand Section */}
        <div className="brand-section">
          <h1 className="brand-title">आयना</h1>
          <p className="brand-tagline">Organize your life, effortlessly</p>
        </div>

        {/* Premium Feature Card */}
        <div className="premium-card">
          {/* Feature Carousel */}
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

              <button
                className="carousel-control prev"
                onClick={goToPrevFeature}
                aria-label="Previous feature"
              >
                &lt;
              </button>
              <button
                className="carousel-control next"
                onClick={goToNextFeature}
                aria-label="Next feature"
              >
                &gt;
              </button>
            </div>

            {/* Dots Indicator */}
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
          </div>

          {/* Premium Login Button */}
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
