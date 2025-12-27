import React from 'react';
import './LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-icon">⚜️</div>
      <p className="loading-text">Preparing your journey...</p>
    </div>
  );
}

export default LoadingScreen;
