import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardPage.css';

// Use these exact filenames in frontend/src/assets/
import queenMakeda from '../assets/queen-makeda.png';
import iconCoin from '../assets/icon-coin.png';
import iconGem from '../assets/icon-gem.png';
import iconGlobe from '../assets/icon-globe.png';
import iconStore from '../assets/icon-store.png';
import iconBoosts from '../assets/icon-boosts.png';
import iconFriends from '../assets/icon-friends.png';
import iconEarnCoins from '../assets/icon-earn-coins.png';
import iconBattle from '../assets/icon-battle.png';
import btnTapAttack from '../assets/btn-tap-attack.png';

function DashboardPage({ user = {} }) {
  const { language, changeLanguage, t } = useLanguage();
  const [tapCount, setTapCount] = useState(0);

  const username = user.username || user.first_name || 'PLAYER NAME';
  const coins = user.coins ?? user.points ?? 27020;
  const gems = user.gems ?? 60;
  const level = user.currentLevel ?? user.current_level ?? 1;

  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  const handleQueenTap = () => {
    setTapCount(prev => prev + 1);
  };

  return (
    <div className="saba-dashboard">
      {/* Top Bar */}
      <div className="saba-top-bar">
        <div className="player-avatar-section">
          <div className="avatar-circle">
            <img src={queenMakeda} alt={username} className="avatar-img" />
          </div>
          <div className="player-name-box">
            <span className="player-name">{username}</span>
          </div>
        </div>

        <div className="currency-section">
          <div className="currency-item">
            <img src={iconCoin} alt="Coins" className="currency-icon" />
            <span className="currency-value">{coins.toLocaleString()}</span>
            <button className="currency-add-btn" aria-label="Add coins">+</button>
          </div>

          <div className="currency-item">
            <img src={iconGem} alt="Gems" className="currency-icon" />
            <span className="currency-value">{gems}</span>
            <button className="currency-add-btn" aria-label="Add gems">+</button>
          </div>
        </div>

        <div className="axum-logo-section">
          <button
            className="lang-toggle-btn"
            onClick={handleLanguageToggle}
            aria-label="Toggle language"
            title={language === 'en' ? 'አማርኛ' : 'English'}
          >
            <img src={iconGlobe} alt="" className="lang-icon" />
          </button>
          <span className="axum-title">AXUM</span>
        </div>
      </div>

      {/* Daily Game Buttons Row */}
      <div className="daily-games-row">
        <button className="daily-game-btn">
          <div className="daily-game-icon">🏰</div>
          <span className="daily-game-text">DAILY GAME</span>
        </button>

        <button className="daily-game-btn">
          <div className="daily-game-icon">🏰</div>
          <span className="daily-game-text">DAILY GAME</span>
        </button>
      </div>

      {/* Main Queen Section */}
      <div className="queen-main-section" onClick={handleQueenTap}>
        <div className="queen-oval-frame">
          <img src={queenMakeda} alt="Queen Makeda" className="queen-main-img" />
        </div>
        {tapCount > 0 && (
          <div className="tap-counter">Taps: {tapCount}</div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav-bar">
        <button className="nav-btn" aria-label="Store">
          <div className="nav-btn-circle">
            <img src={iconStore} alt="Store" className="nav-icon" />
          </div>
        </button>

        <button className="nav-btn" aria-label="Battle">
          <div className="nav-btn-circle">
            <img src={iconBattle} alt="Battle" className="nav-icon" />
          </div>
        </button>

        <button className="nav-btn" aria-label="Friends">
          <div className="nav-btn-circle">
            <img src={iconFriends} alt="Friends" className="nav-icon" />
          </div>
        </button>

        <button className="nav-btn" aria-label="Earn Coins">
          <div className="nav-btn-circle">
            <img src={iconEarnCoins} alt="Earn Coins" className="nav-icon" />
          </div>
        </button>
      </div>

      {/* Tap to Attack */}
      <div className="tap-attack-row">
        <button className="tap-attack-btn" aria-label="Tap to Attack">
          <img src={btnTapAttack} alt="Tap to Attack" className="tap-img" />
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
