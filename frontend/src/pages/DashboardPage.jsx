// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

// Assets (ensure these exist in src/assets/)
import queenMakeda from '../assets/queen-makeda.png';
import iconCoin from '../assets/icon-coin.png';
import iconGem from '../assets/icon-gem.png';
import iconGlobe from '../assets/icon-globe.png';
import iconStore from '../assets/icon-store.png';
import iconBoosts from '../assets/icon-boosts.png';
import iconFriends from '../assets/icon-friends.png';
import iconEarnCoins from '../assets/icon-earn-coins.png';

export default function DashboardPage({ user = {} }) {
  const { language, changeLanguage, t } = useLanguage();

  // UI state
  const [tapCount, setTapCount] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState('');

  // Use user's Telegram avatar path from DB if available
  const avatarSrc = user.avatarUrl || queenMakeda;

  // Example: level requirements and user progress
  // In real app, replace with real data from API / props
  const levelRequirements = {
    1: [
      { id: 'collect_coins', label: 'Collect 10,000 coins', amount: 10000 },
      { id: 'win_battles', label: 'Win 3 battles', amount: 3 },
      { id: 'complete_tasks', label: 'Complete 5 tasks', amount: 5 },
    ],
    2: [
      { id: 'collect_coins', label: 'Collect 25,000 coins', amount: 25000 },
      { id: 'win_battles', label: 'Win 8 battles', amount: 8 },
      { id: 'complete_tasks', label: 'Complete 12 tasks', amount: 12 },
    ],
  };

  // Example user progress (replace with real user.progress)
  const userProgress = user.progress || {
    collect_coins: user.coins ?? 27020,
    win_battles: user.wins ?? 1,
    complete_tasks: user.tasksCompleted ?? 2,
  };

  const currentLevel = user.currentLevel ?? user.current_level ?? 1;

  // Compute remaining requirements for current level
  function computeRemaining(level) {
    const reqs = levelRequirements[level] || [];
    const remaining = reqs
      .map(r => {
        const done = userProgress[r.id] ?? 0;
        const left = Math.max(0, r.amount - done);
        return { ...r, done, left };
      })
      .filter(r => r.left > 0);
    return remaining;
  }

  // When Makeda is tapped: show message for 30s with remaining tasks
  function handleQueenTap() {
    setTapCount(prev => prev + 1);
    const remaining = computeRemaining(currentLevel);
    if (remaining.length === 0) {
      setHintText(`Level ${currentLevel} complete! You can advance to the next level.`);
    } else {
      const lines = remaining.map(r => `• ${r.label}: ${r.left} left`);
      setHintText(`To finish Level ${currentLevel}:\n${lines.join('\n')}`);
    }
    setHintVisible(true);

    // Hide after 30 seconds
    setTimeout(() => {
      setHintVisible(false);
    }, 30000);
  }

  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  return (
    <div className="saba-dashboard">
      <div className="frame">
        {/* Top: avatar + name (coins & gems under it) */}
        <div className="top-block">
          <div className="top-left">
            <div className="avatar-circle">
              <img src={avatarSrc} alt={user.username || 'PLAYER'} className="avatar-img" />
            </div>
            <div className="player-name-box">
              <span className="player-name">{user.username || user.first_name || 'PLAYER NAME'}</span>
            </div>
          </div>

          <div className="top-right">
            <button
              className="lang-toggle-btn"
              onClick={handleLanguageToggle}
              aria-label="Toggle language"
              title={language === 'en' ? 'አማርኛ' : 'English'}
            >
              <img src={iconGlobe} alt="Language" className="lang-icon" />
            </button>
            <span className="axum-logo-emoji" role="img" aria-label="Axum logo">⚜️</span>
          </div>
        </div>

        {/* Coins & Gems under name */}
        <div className="currency-row logo-style">
          <div className="currency-item logo-box">
            <img src={iconCoin} alt="Coins" className="currency-icon" />
            <div className="currency-value">{(user.coins ?? user.points ?? 27020).toLocaleString()}</div>
          </div>
          <div className="currency-item logo-box">
            <img src={iconGem} alt="Gems" className="currency-icon" />
            <div className="currency-value">{user.gems ?? 60}</div>
          </div>
        </div>

        {/* Daily Game Buttons */}
        <div className="daily-games-row compact">
          <button className="daily-game-btn compact">
            <div className="daily-game-icon">🏰</div>
            <span className="daily-game-text">DAILY GAME</span>
          </button>
          <button className="daily-game-btn compact">
            <div className="daily-game-icon">🏰</div>
            <span className="daily-game-text">DAILY GAME</span>
          </button>
        </div>

        {/* Queen Makeda Section (bigger, floats out of oval) */}
        <div className="queen-main-section">
          <div className="queen-oval-frame">
            <img
              src={queenMakeda}
              alt="Queen Makeda"
              className="queen-main-img floating"
              onClick={handleQueenTap}
              role="button"
              aria-label="Queen Makeda"
            />
          </div>

          {/* Hint / Level message popover */}
          {hintVisible && (
            <div className="hint-popover" role="status" aria-live="polite">
              <pre className="hint-text">{hintText}</pre>
            </div>
          )}
        </div>

        {/* Bottom Navigation (links) */}
        <div className="bottom-nav-bar">
          <Link to="/rewards" className="nav-btn" aria-label="Store">
            <div className="nav-btn-circle">
              <img src={iconStore} alt="Store" className="nav-icon" />
            </div>
          </Link>

          <Link to="/game" className="nav-btn" aria-label="Boosts">
            <div className="nav-btn-circle">
              <img src={iconBoosts} alt="Boosts" className="nav-icon" />
            </div>
          </Link>

          <Link to="/dashboard" className="nav-btn" aria-label="Friends">
            <div className="nav-btn-circle">
              <img src={iconFriends} alt="Friends" className="nav-icon" />
            </div>
          </Link>

          <Link to="/tasks" className="nav-btn" aria-label="Earn Coins">
            <div className="nav-btn-circle">
              <img src={iconEarnCoins} alt="Earn Coins" className="nav-icon" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
