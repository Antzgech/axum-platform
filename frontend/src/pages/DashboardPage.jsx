// src/pages/DashboardPage.jsx
import React, { useEffect } from 'react';
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

  const username = user.username || user.first_name || 'PLAYER NAME';
  const avatarSrc = user.photo_url || queenMakeda;
  const coins = user.coins ?? 0;
  const gems = user.gems ?? 0;

  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  // When the game finishes, GamePage will set localStorage "gameUpdated"
  // Listen for that and call fetchUser() to refresh from the database
  useEffect(() => {
    if (typeof fetchUser !== 'function') return;

    const handler = (e) => {
      if (e.key === 'gameUpdated' && e.newValue) {
        fetchUser();
      }
    };

    window.addEventListener('storage', handler);

    // Also check once on mount in case we just came back and event already fired
    const flag = localStorage.getItem('gameUpdated');
    if (flag) {
      fetchUser();
      localStorage.removeItem('gameUpdated');
    }

    return () => window.removeEventListener('storage', handler);
  }, [fetchUser]);

  return (
    <div className="saba-dashboard full-screen">
      {/* Top: avatar + name */}
      <header className="top-block">
        <div className="top-left">
          <div className="avatar-circle">
            <img src={avatarSrc} alt={username} className="avatar-img" />
          </div>
          <div className="player-name-box">
            <span className="player-name">{username}</span>
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

      {/* Coins & Gems (from DB: coins, gems) */}
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

      {/* Makeda center */}
      <main className="queen-main-section" role="main">
        <div className="queen-oval-frame">
          <img
            src={queenMakeda}
            alt="Queen Makeda"
            className="queen-main-img floating"
          />
        </div>
      </main>

      {/* Bottom Navigation */}
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
