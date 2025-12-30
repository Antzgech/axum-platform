// src/components/LoadingPage.jsx
import React, { useState, useEffect } from 'react';
import './LoadingPage.css';

export default function LoadingPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress from 0 to 100 over 7 seconds
    const duration = 10000; // 10 seconds
    const interval = 50; // Update every 50ms
    const steps = duration / interval;
    const increment = 100 / steps;

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(timer);
      }
      setProgress(currentProgress);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-page-fullscreen">
      {/* Video Background */}
      <video
        className="loading-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/queen-makeda-video.mp4" type="video/mp4" />
        {/* Fallback to image if video doesn't load */}
        <img src="/queen-makeda.png" alt="Queen Makeda" className="loading-fallback-img" />
      </video>

      {/* Dark overlay for better text readability */}
      <div className="loading-overlay" />

      {/* Welcome Message Popup */}
      <div className="loading-welcome-popup">
        <div className="welcome-text">
          Hi, I Am Queen Of Saba.
          <br />
          Welcome to My Castle.
          <br />
          Are you wise and smart?
          <br />
          We'll see...
        </div>
      </div>

      {/* Progress Bar */}
      <div className="loading-progress-container">
        <div className="loading-progress-bar">
          <div 
            className="loading-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="loading-progress-text">
          {Math.round(progress)}%
        </div>
      </div>

      {/* Ethiopian Pattern Decoration */}
      <div className="loading-decoration-top" />
      <div className="loading-decoration-bottom" />
    </div>
  );
}
