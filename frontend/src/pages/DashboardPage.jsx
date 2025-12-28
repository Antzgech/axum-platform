import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

// Assets (make sure these files exist in src/assets/)
import queenMakeda from '../assets/queen-makeda.png';
import iconCoin from '../assets/icon-coin.png';
import iconGem from '../assets/icon-gem.png';
import iconGlobe from '../assets/icon-globe.png';
import iconStore from '../assets/icon-store.png';
import iconBoosts from '../assets/icon-boosts.png';
import iconFriends from '../assets/icon-friends.png';
import iconTreasure from '../assets/icon-earn-coins.png';

function DashboardPage({ user = {} }) {
  const { language, changeLanguage, t } = useLanguage();
  const username = user.username || user.first_name || 'PLAYER NAME';
  const coins = user.coins ?? user.points ?? 27020;
  const gems = user.gems ?? 60;
  const avatarSrc = user.avatarUrl || queenMakeda;

  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  return (
    <div className="saba-dashboard">
      {/* Top Bar */}
      <div className="saba-top-bar">
        <div className="player-avatar-section">
          <div className="avatar-circle">
            <img src={avatarSrc} alt={username} className="avatar-img" />
          </div>
          <div className="player-name-box">
            <span className="player-name">{username}</span>
          </div>
        </div>

        <div className="currency-section">
          <div className="currency-item">
            <img src={iconCoin} alt="Coins" className="currency-icon" />
            <span className="currency-value">{coins.toLocaleString()}</span>
          </div>
          <div className="currency-item">
            <img src={iconGem} alt="Gems" className="currency-icon" />
            <span className="currency-value">{gems}</span>
          </div>
        </div>

        <div className="axum-logo-section">
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

      {/* Daily Game Buttons Row */}
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

      {/* Queen Makeda Section */}
      <div className="queen-main-section">
        <div className="queen-oval-frame">
          <img src={queenMakeda} alt="Queen Makeda" className="queen-main-img" />
        </div>
      </div>

      {/* Bottom Navigation */}
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
            <img src={iconTreasure} alt="Earn Coins" className="nav-icon" />
          </div>
        </Link>
      </div>
    </div>
  );
}

export default DashboardPage;
