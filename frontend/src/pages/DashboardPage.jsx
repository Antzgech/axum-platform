import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardPage.css';

function DashboardPage({ user }) {
  const { language, changeLanguage, t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('axum_token');
        const response = await fetch('/api/user/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your journey...</p>
      </div>
    );
  }

  const currentLevel = stats?.currentLevel || 1;
  const totalPoints = stats?.totalPoints || 0;
  const username = user?.username || 'Traveler';

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'am' : 'en');
  };

  return (
    <div className="dashboard-hamster-layout">
      {/* Top Bar */}
      <div className="top-bar">
        <span className="username">{username}</span>
        <button className="language-toggle-btn" onClick={toggleLanguage} title={t('common.change_language')}>
          {language === 'en' ? '🇪🇹 አማ' : '🌍 EN'}
        </button>
        <span className="score">{t('dashboard.score')}: {totalPoints}</span>
      </div>

      {/* Daily Challenges */}
      <div className="daily-challenges">
        <div className="challenge-card">🎁 {t('dashboard.daily_reward')}</div>
        <div className="challenge-card">🧩 {t('dashboard.daily_cipher')}</div>
        <div className="challenge-card">🔥 {t('dashboard.daily_combo')}</div>
      </div>

      {/* Floating Queen */}
      <div className="queen-section">
        <div className="level-indicator">{t('dashboard.level')} {currentLevel}</div>
        <div className="queen-avatar">👑</div>
        <div className="queen-label">Queen Makeda</div>
      </div>

      {/* Bottom Stats */}
      <div className="bottom-stats">
        <button className="boost-button">⚡ {t('dashboard.boost')}</button>
        <div className="energy-bar">{t('dashboard.energy')}: 1000 / 1000</div>
      </div>

      {/* Navigation */}
      <div className="nav-bar">
        <Link to="/exchange" className="nav-item">{t('dashboard.exchange')}</Link>
        <Link to="/mine" className="nav-item">{t('dashboard.mine')}</Link>
        <Link to="/tasks" className="nav-item">{t('dashboard.tasks')}</Link>
        <Link to="/shop" className="nav-item">{t('dashboard.shop')}</Link>
      </div>
    </div>
  );
}

export default DashboardPage;
