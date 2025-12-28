import React from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';
import { useLanguage } from '../i18n/LanguageContext';

function DashboardPage({ user }) {
  const { t } = useLanguage();

  const username = user?.username || 'Traveler';
  const score = user?.points || 0;
  const level = user?.current_level || 1;

  return (
    <div className="dashboard-hamster-layout">
      {/* Top Bar */}
      <div className="top-bar">
        <span className="username">{username}</span>
        <span className="score">{t('dashboard.score')}: {score}</span>
      </div>

      {/* Daily Challenges */}
      <div className="daily-challenges">
        <div className="challenge-card">{t('dashboard.dailyReward')} <span className="timer">13:58</span></div>
        <div className="challenge-card">{t('dashboard.dailyCipher')} <span className="timer">13:58</span></div>
        <div className="challenge-card">{t('dashboard.dailyCombo')} <span className="timer">13:57</span></div>
      </div>

      {/* Floating Queen */}
      <div className="queen-section">
        <div className="level-indicator">{t('dashboard.level')} {level}</div>
        <div className="queen-avatar">👑</div>
        <div className="queen-label">Queen Makeda</div>
      </div>

      {/* Bottom Stats */}
      <div className="bottom-stats">
        <button className="boost-button">{t('dashboard.boost')}</button>
        <div className="energy-bar">{t('dashboard.energy')}: 1000 / 1000</div>
      </div>

      {/* Navigation */}
      <div className="nav-bar">
        <Link to="/exchange" className="nav-item">Exchange</Link>
        <Link to="/mine" className="nav-item">Mine</Link>
        <Link to="/shop" className="nav-item">Shop</Link>
        <Link to="/tasks" className="nav-item">Tasks</Link>
      </div>
    </div>
  );
}

export default DashboardPage;
