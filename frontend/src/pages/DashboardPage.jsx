import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardPage.css';

/*
  Make sure these files exist in: frontend/src/assets/
  - queen-makeda.png
  - icon-boosts.png
  - icon-store.png
  - icon-earn-coins.png
  - icon-friends.png
  - icon-battle.png
  - btn-tap-attack.png
  - icon-coin.png
  - icon-gem.png
  - icon-globe.png
*/

import queenMakeda from '../assets/queen-makeda.png';
import iconBoosts from '../assets/icon-boosts.png';
import iconStore from '../assets/icon-store.png';
import iconEarnCoins from '../assets/icon-earn-coins.png';
import iconFriends from '../assets/icon-friends.png';
import iconBattle from '../assets/icon-battle.png';
import btnTapAttack from '../assets/btn-tap-attack.png';
import iconCoin from '../assets/icon-coin.png';
import iconGem from '../assets/icon-gem.png';
import iconGlobe from '../assets/icon-globe.png';

function DashboardPage({ user = {} }) {
  const { language, changeLanguage, t } = useLanguage();

  const username = user.username || 'Traveler';
  const score = user.totalPoints ?? user.points ?? 0;
  const level = user.currentLevel ?? user.current_level ?? 1;
  const coins = user.coins ?? 27020;
  const gems = user.gems ?? 60;

  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  return (
    <div className="dashboard-root">
      <div className="dashboard-frame" role="main" aria-label="Axum Dashboard">

        {/* Top bar */}
        <div className="dash-top-bar">
          <div className="dash-top-left">
            <span className="dash-top-title">{t('app.title') || 'AXUM'}</span>
          </div>

          <div className="dash-top-center">
            <div className="dash-currency">
              <div className="currency-item" title="Coins">
                <img src={iconCoin} alt="" className="currency-icon" />
                <span className="currency-value">{coins.toLocaleString()}</span>
                <button className="currency-plus" aria-label="Add coins">+</button>
              </div>

              <div className="currency-item" title="Gems">
                <img src={iconGem} alt="" className="currency-icon" />
                <span className="currency-value">{gems}</span>
                <button className="currency-plus" aria-label="Add gems">+</button>
              </div>
            </div>
          </div>

          <div className="dash-top-right">
            <button
              className="lang-toggle-btn"
              onClick={handleLanguageToggle}
              aria-label="Toggle language"
              title={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <img src={iconGlobe} alt="" className="lang-icon" />
              <span className="lang-label">{language === 'am' ? 'አማ' : 'EN'}</span>
            </button>
          </div>
        </div>

        {/* Level + score */}
        <div className="dash-level-bar">
          <div className="level-pill">{t('dashboard.level') || 'Level'} {level}</div>
          <div className="score-pill">{t('dashboard.score') || 'Score'} {score.toLocaleString()}</div>
        </div>

        {/* Battle button */}
        <div className="dash-battle-row">
          <button className="battle-button" aria-label="Battle">
            <img src={iconBattle} alt="" className="battle-img" />
          </button>
        </div>

        {/* Main area: radial menu + queen */}
        <div className="dash-main-area">
          <div className="radial-column radial-left">
            <div className="radial-btn">
              <div className="radial-circle">
                <img src={queenMakeda} alt={`${username} portrait`} className="queen-portrait-icon" />
              </div>
              <span className="radial-label username-label">{username}</span>
            </div>

            <div className="radial-btn">
              <div className="radial-circle">
                <img src={iconBoosts} alt="Boosts" className="radial-icon" />
              </div>
              <span className="radial-label">{t('dashboard.boosts') || 'Boosts'}</span>
            </div>

            <div className="radial-btn">
              <div className="radial-circle">
                <img src={iconStore} alt="Store" className="radial-icon" />
              </div>
              <span className="radial-label">{t('dashboard.store') || 'Store'}</span>
            </div>
          </div>

          <div className="queen-center">
            <img src={queenMakeda} alt="Queen Makeda" className="queen-main-img" />
          </div>

          <div className="radial-column radial-right">
            <div className="radial-btn">
              <div className="radial-circle">
                <img src={iconEarnCoins} alt="Earn Coins" className="radial-icon" />
              </div>
              <span className="radial-label">{t('dashboard.earnCoins') || 'Earn Coins'}</span>
            </div>

            <div className="radial-btn">
              <div className="radial-circle">
                <img src={iconFriends} alt="Friends" className="radial-icon" />
              </div>
              <span className="radial-label">{t('dashboard.friends') || 'Friends'}</span>
            </div>
          </div>
        </div>

        {/* Bottom action */}
        <div className="dash-bottom-main">
          <button className="tap-attack-btn" aria-label="Tap to Attack">
            <img src={btnTapAttack} alt="" className="tap-img" />
          </button>
        </div>

        {/* Footer quick nav (optional) */}
        <div className="dash-footer-nav" role="navigation" aria-label="Quick navigation">
          <button className="footer-item">Exchange</button>
          <button className="footer-item">Mine</button>
          <button className="footer-item">Shop</button>
          <button className="footer-item">Tasks</button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
