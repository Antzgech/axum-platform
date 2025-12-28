import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardPage.css';

// Update these paths to match your actual asset locations
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

function DashboardPage({ user }) {
  const { language, changeLanguage, t } = useLanguage();

  // Fallbacks if backend doesn’t send these yet
  const username = user?.username || 'Traveler';
  const score = user?.totalPoints ?? user?.points ?? 0;
  const level = user?.currentLevel ?? user?.current_level ?? 1;
  const coins = user?.coins ?? 27020;
  const gems = user?.gems ?? 60;

  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
    // Optional: reload to ensure everything re-renders cleanly
    window.location.reload();
  };

  return (
    <div className="dashboard-root">
      <div className="dashboard-frame">

        {/* Top status bar */}
        <div className="dash-top-bar">
          <div className="dash-top-left">
            <span className="dash-top-title">{t('dashboard.dailyChallenges') || 'Daily Challenges'}</span>
          </div>
          <div className="dash-top-center">
            <div className="dash-currency">
              <div className="currency-item">
                <img src={iconCoin} alt="Coins" className="currency-icon" />
                <span className="currency-value">{coins.toLocaleString()}</span>
                <span className="currency-plus">+</span>
              </div>
              <div className="currency-item">
                <img src={iconGem} alt="Gems" className="currency-icon" />
                <span className="currency-value">{gems}</span>
                <span className="currency-plus">+</span>
              </div>
            </div>
          </div>
          <div className="dash-top-right">
            <button
              className="lang-toggle-btn"
              onClick={handleLanguageToggle}
            >
              <img src={iconGlobe} alt="Language" className="lang-icon" />
              <span className="lang-label">{language === 'am' ? 'አማ' : 'EN'}</span>
            </button>
          </div>
        </div>

        {/* Level + score bar */}
        <div className="dash-level-bar">
          <div className="level-pill">
            {t('dashboard.level') || 'Level'} {level}
          </div>
          <div className="score-pill">
            {t('dashboard.score') || 'Score'} {score.toLocaleString()}
          </div>
        </div>

        {/* Battle button */}
        <div className="dash-battle-row">
          <button className="battle-button">
            {iconBattle ? (
              <img src={iconBattle} alt="Battle" className="battle-img" />
            ) : (
              <span className="battle-label">Battle</span>
            )}
          </button>
        </div>

        {/* Main character + radial menu */}
        <div className="dash-main-area">
          {/* Left radial buttons */}
          <div className="radial-column radial-left">
            <div className="radial-btn">
              {/* Portrait could be reused, or you can omit this */}
              <div className="radial-circle">
                <img src={queenMakeda} alt="Queen Makeda Portrait" className="queen-portrait-icon" />
              </div>
              <span className="radial-label">{username}</span>
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

          {/* Center Queen */}
          <div className="queen-center">
            <img src={queenMakeda} alt="Queen Makeda" className="queen-main-img" />
          </div>

          {/* Right radial buttons */}
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

        {/* Bottom main action */}
        <div className="dash-bottom-main">
          <button className="tap-attack-btn">
            {btnTapAttack ? (
              <img src={btnTapAttack} alt="Tap to Attack" className="tap-img" />
            ) : (
              <span className="tap-label">
                {t('dashboard.tapToAttack') || 'Tap to Attack'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
