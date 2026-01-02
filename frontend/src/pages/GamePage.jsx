// src/pages/GamePage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './GamePage.css';
import GebetaGame from '../games/GebetaGame';

export default function GamePage({ user }) {
  const [showGebeta, setShowGebeta] = useState(false);

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>🎮 Games</h1>
        <p className="subtitle">Play traditional Ethiopian games and earn rewards!</p>
      </div>

      <div className="games-grid">
        {/* Gebeta Game Card */}
        <div className="game-card" onClick={() => setShowGebeta(true)}>
          <div className="game-card-header">
            <span className="game-icon">🎲</span>
            <h2>Gebeta</h2>
          </div>
          <p className="game-description">
            Traditional Ethiopian strategy game. Capture seeds and outsmart your opponent!
          </p>
          <div className="game-rewards">
            <span className="reward-item">🪙 20 coins per win</span>
          </div>
          <button className="play-btn">
            Play Now
          </button>
        </div>

        {/* Coming Soon Cards */}
        <div className="game-card coming-soon">
          <div className="game-card-header">
            <span className="game-icon">🏃</span>
            <h2>Genna</h2>
          </div>
          <p className="game-description">
            Traditional Ethiopian hockey game. Score goals and win prizes!
          </p>
          <div className="coming-soon-badge">Coming Soon</div>
        </div>

        <div className="game-card coming-soon">
          <div className="game-card-header">
            <span className="game-icon">♟️</span>
            <h2>Senterej</h2>
          </div>
          <p className="game-description">
            Ethiopian chess variant. Test your strategic thinking!
          </p>
          <div className="coming-soon-badge">Coming Soon</div>
        </div>

        <div className="game-card coming-soon">
          <div className="game-card-header">
            <span className="game-icon">🎯</span>
            <h2>Gugs</h2>
          </div>
          <p className="game-description">
            Traditional marble game. Aim, shoot, and collect rewards!
          </p>
          <div className="coming-soon-badge">Coming Soon</div>
        </div>
      </div>

      {/* User Stats */}
      <div className="game-stats">
        <h3>Your Stats</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-icon">🎮</span>
            <div className="stat-info">
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{user?.games_played || 0}</span>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">🪙</span>
            <div className="stat-info">
              <span className="stat-label">Total Coins</span>
              <span className="stat-value">{user?.coins || 0}</span>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">💎</span>
            <div className="stat-info">
              <span className="stat-label">Total Gems</span>
              <span className="stat-value">{user?.gems || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Dashboard */}
      <Link to="/" className="back-btn">
        ← Back to Dashboard
      </Link>

      {/* Gebeta Game Modal */}
      {showGebeta && (
        <GebetaGame 
          user={user} 
          onClose={() => setShowGebeta(false)} 
        />
      )}
    </div>
  );
}
