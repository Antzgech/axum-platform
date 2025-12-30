import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardPage.css';

function DashboardPage({ user, fetchUser }) {
  const { t } = useLanguage();
  const [localCoins, setLocalCoins] = useState(0);
  const [localGems, setLocalGems] = useState(0);
  const [tapping, setTapping] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);

  const API_URL = 'https://axum-backend-production.up.railway.app';

  useEffect(() => {
    if (user) {
      setLocalCoins(user.coins || 0);
      setLocalGems(user.gems || 0);
    }
  }, [user]);

  const handleMakedaTap = async () => {
    if (tapping) return;
    
    // Show user info popup
    setShowUserInfo(true);
    
    setTapping(true);
    setLocalCoins(prev => prev + 1);

    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/user/add-coin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLocalCoins(data.coins || 0);
        setLocalGems(data.gems || 0);
        
        if (fetchUser) {
          fetchUser();
        }
      } else {
        setLocalCoins(prev => prev - 1);
      }
    } catch (error) {
      setLocalCoins(prev => prev - 1);
      console.error('Error adding coin:', error);
    } finally {
      setTapping(false);
    }
  };

  const closeUserInfo = () => {
    setShowUserInfo(false);
  };

  // Calculate completed tasks count
  const completedTasksCount = user?.completed_tasks?.length || 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="user-avatar">
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              {user?.first_name?.[0] || '👤'}
            </div>
          )}
        </div>
        <div className="user-info">
          <h2>{user?.first_name || 'Player'}</h2>
          <p>@{user?.username || 'sabawian'}</p>
        </div>
      </div>

      <div className="currency-row">
        <div className="currency-box">
          <span className="currency-icon">🪙</span>
          <div className="currency-info">
            <span className="currency-label">Coins</span>
            <span className="currency-value">{localCoins.toLocaleString()}</span>
          </div>
        </div>
        <div className="currency-box">
          <span className="currency-icon">💎</span>
          <div className="currency-info">
            <span className="currency-label">Gems</span>
            <span className="currency-value">{localGems.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="makeda-container">
        <div 
          className={`makeda-oval ${tapping ? 'tapping' : ''}`}
          onClick={handleMakedaTap}
        >
          <img 
            src="/queen-makeda.png" 
            alt="Queen Makeda" 
            className="makeda-image"
          />
          <div className="tap-hint">Tap to earn coins!</div>
        </div>
      </div>

      <div className="nav-buttons">
        <Link to="/rewards" className="nav-button">
          <div className="nav-icon">🏪</div>
          <span>Store</span>
        </Link>
        <Link to="/game" className="nav-button">
          <div className="nav-icon">⚡</div>
          <span>Boosts</span>
        </Link>
        <Link to="/tasks" className="nav-button">
          <div className="nav-icon">👥</div>
          <span>Friends</span>
        </Link>
        <Link to="/tasks" className="nav-button">
          <div className="nav-icon">💰</div>
          <span>Earn Coins</span>
        </Link>
      </div>

      {/* User Info Popup */}
      {showUserInfo && (
        <div className="user-info-popup-overlay" onClick={closeUserInfo}>
          <div className="user-info-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={closeUserInfo}>×</button>
            
            <div className="popup-header">
              <div className="popup-avatar">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={user.username} />
                ) : (
                  <div className="popup-avatar-placeholder">
                    {user?.first_name?.[0] || '👤'}
                  </div>
                )}
              </div>
              <h3>Player Stats</h3>
            </div>

            <div className="popup-content">
              <div className="stat-row">
                <span className="stat-label">👤 Name:</span>
                <span className="stat-value">{user?.first_name || 'Unknown'} {user?.last_name || ''}</span>
              </div>
              
              <div className="stat-row">
                <span className="stat-label">📱 Username:</span>
                <span className="stat-value">@{user?.username || 'N/A'}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">🪙 Coins:</span>
                <span className="stat-value highlight">{localCoins.toLocaleString()}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">💎 Gems:</span>
                <span className="stat-value highlight">{localGems.toLocaleString()}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">⭐ Level:</span>
                <span className="stat-value highlight">{user?.current_level || 1}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">✅ Tasks Completed:</span>
                <span className="stat-value highlight">{completedTasksCount}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">👥 Friends Invited:</span>
                <span className="stat-value highlight">{user?.invited_friends || 0}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">🆔 Telegram ID:</span>
                <span className="stat-value">{user?.telegram_id || user?.id || 'N/A'}</span>
              </div>
            </div>

            <button className="close-button" onClick={closeUserInfo}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
