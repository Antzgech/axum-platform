// src/pages/GamePage.jsx
import React, { useState } from 'react';
import GebetaGame from '../games/GebetaGame';
import './GamePage.css';

export default function GamePage({ user }) {
  const [showGebeta, setShowGebeta] = useState(false);

  const games = [
    {
      id: 'gebeta',
      name: 'Gebeta',
      description: 'Traditional Ethiopian board game',
      icon: '🎲',
      reward: '20 coins per win',
      difficulty: 'Medium',
      players: '1 vs Computer'
    },
    {
      id: 'coming1',
      name: 'Gena',
      description: 'Ethiopian Hockey - Coming Soon!',
      icon: '🏑',
      reward: '30 coins per win',
      difficulty: 'Hard',
      players: 'Coming Soon',
      disabled: true
    },
    {
      id: 'coming2',
      name: 'Gugs',
      description: 'Traditional Game - Coming Soon!',
      icon: '🎯',
      reward: '25 coins per win',
      difficulty: 'Easy',
      players: 'Coming Soon',
      disabled: true
    }
  ];

  const handleGameClick = (gameId) => {
    if (gameId === 'gebeta') {
      setShowGebeta(true);
    }
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h1>🎮 Games</h1>
        <p className="subtitle">Play Ethiopian traditional games and earn coins!</p>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <div 
            key={game.id}
            className={`game-card ${game.disabled ? 'disabled' : ''}`}
            onClick={() => !game.disabled && handleGameClick(game.id)}
          >
            <div className="game-icon">{game.icon}</div>
            <h3 className="game-name">{game.name}</h3>
            <p className="game-description">{game.description}</p>
            
            <div className="game-info">
              <div className="info-item">
                <span className="info-label">Reward:</span>
                <span className="info-value">{game.reward}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Difficulty:</span>
                <span className="info-value">{game.difficulty}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Players:</span>
                <span className="info-value">{game.players}</span>
              </div>
            </div>

            <button 
              className="play-btn"
              disabled={game.disabled}
            >
              {game.disabled ? '🔒 Coming Soon' : '🎮 Play Now'}
            </button>
          </div>
        ))}
      </div>

      <div className="game-stats">
        <h2>📊 Your Game Stats</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{user?.games_played || 0}</div>
            <div className="stat-label">Games Played</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{user?.coins || 0}</div>
            <div className="stat-label">Coins Earned</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{user?.current_level || 1}</div>
            <div className="stat-label">Current Level</div>
          </div>
        </div>
      </div>

      {showGebeta && (
        <GebetaGame 
          user={user}
          onClose={() => setShowGebeta(false)}
        />
      )}
    </div>
  );
}
