// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

// Assets
import queenMakeda from '../assets/queen-makeda.png';
import iconCoin from '../assets/icon-coin.png';
import iconGem from '../assets/icon-gem.png';
import iconGlobe from '../assets/icon-globe.png';
import iconStore from '../assets/icon-store.png';
import iconBoosts from '../assets/icon-boosts.png';
import iconFriends from '../assets/icon-friends.png';
import iconEarnCoins from '../assets/icon-earn-coins.png';

export default function DashboardPage({ user = {}, fetchUser }) {
  const { language, changeLanguage } = useLanguage();

  // Local currency state (keeps UI responsive)
  const [coins, setCoins] = useState(user.coins ?? user.points ?? 27020);
  const [gems, setGems] = useState(user.gems ?? 60);

  // Makeda hint state (3s visibility handled elsewhere)
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState('');
  const hideTimerRef = useRef(null);

  // Avatar
  const avatarSrc = user.photo_url || user.avatarUrl || queenMakeda;

  // Language toggle
  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  // Makeda tap: show hint for 3 seconds (user already set 3s)
  function handleQueenTap() {
    // Example hint text — replace with computeRemaining logic if needed
    setHintText('Complete 3 battles\nCollect 10,000 coins\nFinish 5 tasks');
    setHintVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setHintVisible(false);
      hideTimerRef.current = null;
    }, 3000);
  }

  // Listen for game results saved to localStorage by GamePage and update UI
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'gameResult' && e.newValue) {
        try {
          const result = JSON.parse(e.newValue);
          if (result.coinReward) setCoins(prev => prev + Number(result.coinReward));
          if (result.gemReward) setGems(prev => prev + Number(result.gemReward));
          // Optionally refetch user from server if fetchUser provided
          if (typeof fetchUser === 'function') fetchUser();
        } catch (err) {
          // ignore parse errors
        }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fetchUser]);

  // Also poll once on mount to reflect server state (optional)
  useEffect(() => {
    if (typeof fetchUser === 'function') {
      fetchUser().then(updated => {
        if (updated?.coins !== undefined) setCoins(updated.coins);
        if (updated?.gems !== undefined) setGems(updated.gems);
      }).catch(() => {});
    }
  }, [fetchUser]);

  return (
    <div className="saba-dashboard full-screen">
      <header className="top-block" role="banner">
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
      </header>

      <div className="currency-row logo-style" role="region" aria-label="Currency">
        <div className="currency-item logo-box">
          <img src={iconCoin} alt="Coins" className="currency-icon" />
          <div className="currency-value">{coins.toLocaleString()}</div>
        </div>
        <div className="currency-item logo-box">
          <img src={iconGem} alt="Gems" className="currency-icon" />
          <div className="currency-value">{gems}</div>
        </div>
      </div>

      <main className="queen-main-section" role="main">
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

        {hintVisible && (
          <aside className="hint-popover" role="status" aria-live="polite">
            <div className="hint-header">Quick Hint</div>
            <pre className="hint-text">{hintText}</pre>
          </aside>
        )}
      </main>

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
