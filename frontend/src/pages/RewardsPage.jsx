import React from 'react';
import { Link } from 'react-router-dom';
import './RewardsPage.css';

export default function RewardsPage({ user }) {
  return (
    <div className="rewards-page">
      <div className="rewards-header">
        <Link to="/" className="back-btn">← Back</Link>
        <h1>🏪 Store</h1>
        <p className="subtitle">Purchase items with your coins and gems</p>
      </div>

      <div className="user-balance">
        <div className="balance-item">
          <span className="balance-icon">🪙</span>
          <span className="balance-value">{user?.coins?.toLocaleString() || 0}</span>
        </div>
        <div className="balance-item">
          <span className="balance-icon">💎</span>
          <span className="balance-value">{user?.gems?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div className="coming-soon">
        <h2>🎁 Coming Soon!</h2>
        <p>Exciting rewards and items will be available here soon.</p>
        <div className="preview-items">
          <div className="preview-item">
            <div className="preview-icon">🎨</div>
            <div className="preview-name">Custom Themes</div>
          </div>
          <div className="preview-item">
            <div className="preview-icon">⚡</div>
            <div className="preview-name">Power Boosts</div>
          </div>
          <div className="preview-item">
            <div className="preview-icon">🏆</div>
            <div className="preview-name">Exclusive Badges</div>
          </div>
          <div className="preview-item">
            <div className="preview-icon">🎯</div>
            <div className="preview-name">Special Items</div>
          </div>
        </div>
      </div>
    </div>
  );
}
