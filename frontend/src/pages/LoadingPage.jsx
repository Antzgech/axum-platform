import React from 'react';
import './LoadingPage.css';

export default function LoadingPage() {
  return (
    <div className="loading-page">
      <div className="loading-content">
        <div className="axum-logo">⚜️</div>
        <h1 className="loading-title">Queen Makeda's Quest</h1>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p className="loading-text">Loading your adventure...</p>
      </div>
    </div>
  );
}
