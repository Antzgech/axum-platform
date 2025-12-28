import React, { useState, useEffect, useRef } from 'react';
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
  const { language, changeLanguage } = useLanguage();

  // UI state
  const [tapCount, setTapCount] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintData, setHintData] = useState({ header: '', items: [] });
  const hideTimerRef = useRef(null);

  // Use user's Telegram avatar path from DB if available
  const avatarSrc = user.photo_url || user.avatarUrl || queenMakeda;

  // Example: level requirements and user progress (replace with real API data)
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

  function computeRemaining(level) {
    const reqs = levelRequirements[level] || [];
    return reqs.map(r => {
      const done = userProgress[r.id] ?? 0;
      const left = Math.max(0, r.amount - done);
      const percent = Math.min(100, Math.round((done / r.amount) * 100));
      return { ...r, done, left, percent };
    });
  }

  // When Makeda is tapped: show message for 30s with remaining tasks
  function handleQueenTap() {
    setTapCount(prev => prev + 1);

    const remaining = computeRemaining(currentLevel);
    const incomplete = remaining.filter(r => r.left > 0);

    if (incomplete.length === 0) {
      setHintData({
        header: `Level ${currentLevel} complete!`,
        items: [{ id: 'done', label: 'All requirements met. Ready to advance!', percent: 100 }],
      });
    } else {
      setHintData({
        header: `Level ${currentLevel} requirements`,
        items: incomplete,
      });
    }

    setHintVisible(true);

    // Clear previous timer and set new 3s hide timer
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setHintVisible(false);
      hideTimerRef.current = null;
    }, 3000);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  return (
    <div className="saba-dashboard full-screen">
      {/* Top: avatar + name (coins & gems under it) */}
      <header className="top-block" role="banner">
        <div className="top-left">
          <div className="avatar-circle" aria-hidden="false">
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
      </header>

      {/* Coins & Gems under name */}
      <div className="currency-row logo-style" role="region" aria-label="Currency">
        <div className="currency-item logo-box" aria-hidden="false">
          <img src={iconCoin} alt="Coins" className="currency-icon" />
          <div className="currency-value">{(user.coins ?? user.points ?? 27020).toLocaleString()}</div>
        </div>
        <div className="currency-item logo-box" aria-hidden="false">
          <img src={iconGem} alt="Gems" className="currency-icon" />
          <div className="currency-value">{user.gems ?? 60}</div>
        </div>
      </div>

      {/* Queen Makeda Section (bigger, floats out of oval) */}
      <main className="queen-main-section" role="main">
        <div className="queen-oval-frame" aria-hidden="true">
          <img
            src={queenMakeda}
            alt="Queen Makeda"
            className="queen-main-img floating"
            onClick={handleQueenTap}
            role="button"
            aria-label="Queen Makeda"
          />
        </div>

        {/* Hint / Level message popover (styled) */}
        {hintVisible && (
          <aside className="hint-popover" role="status" aria-live="polite">
            <div className="hint-header">Level {currentLevel} Progress</div>

            <div className="hint-body">
              {hintData.items.map(item => (
                <div key={item.id} className="hint-item">
                  <div className="hint-item-row">
                    <div className="hint-item-label">{item.label}</div>
                    <div className="hint-item-meta">{item.left !== undefined ? `${item.left} left` : `${item.percent}%`}</div>
                  </div>
                  <div className="hint-progress">
                    <div className="hint-progress-bar" style={{ width: `${item.percent ?? (item.left === 0 ? 100 : 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="hint-actions">
              <Link to="/tasks" className="hint-btn">Go to Tasks</Link>
              <Link to="/game" className="hint-btn secondary">Open Battles</Link>
            </div>

            <div className="hint-footer">This message will disappear in 30 seconds</div>
          </aside>
        )}
      </main>

      {/* Bottom Navigation (links) */}
      <nav className="bottom-nav-bar" role="navigation" aria-label="Quick navigation">
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
      </nav>
    </div>
  );
}
