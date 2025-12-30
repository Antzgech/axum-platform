// src/components/LoadingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import './LoadingPage.css';

export default function LoadingPage() {
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    // Force fullscreen and top of page
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Animate progress from 0 to 100 over 14 seconds
    const duration = 8000; // 8 seconds
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

    // Handle video end - pause on last frame
    const video = videoRef.current;
    if (video) {
      video.addEventListener('ended', () => {
        // Video stays on last frame (no loop)
      });
    }

    return () => {
      clearInterval(timer);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="loading-page-fullscreen">
      {/* Video Background - Fitted, No Zoom */}
      <video
        ref={videoRef}
        className="loading-video-fitted"
        autoPlay
        muted
        playsInline
        preload="auto"
      >
        <source src="/queen-makeda-video.mp4" type="video/mp4" />
        {/* Fallback to image if video doesn't load */}
        <img src="/queen-makeda.png" alt="Queen Makeda" className="loading-fallback-img" />
      </video>

      {/* Dark overlay for better text readability */}
      <div className="loading-overlay" />

      {/* Bottom Section: Welcome + Progress */}
      <div className="loading-bottom-section">
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
      </div>

      {/* Ethiopian Pattern Decoration */}
      <div className="loading-decoration-top" />
      <div className="loading-decoration-bottom" />
    </div>
  );
}
