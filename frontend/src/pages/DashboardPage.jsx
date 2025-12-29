import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import './DashboardPage.css';

function DashboardPage({ user, fetchUser }) {
  const { t } = useLanguage();
  const [localCoins, setLocalCoins] = useState(0);
  const [localGems, setLocalGems] = useState(0);
  const [tapping, setTapping] = useState(false);

  // Initialize from user object
  useEffect(() => {
    if (user) {
      setLocalCoins(user.coins || 0);
      setLocalGems(user.gems || 0);
    }
  }, [user]);

  // Handle Makeda tap
  const handleMakedaTap = async () => {
    if (tapping) return; // Prevent multiple taps
    
    setTapping(true);
    
    // Optimistically update UI
    setLocalCoins(prev => prev + 1);

    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch('/api/user/add-coin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update with server response
        setLocalCoins(data.coins || 0);
        setLocalGems(data.gems || 0);
        
        // Refresh user data from server
        if (fetchUser) {
          fetchUser();
        }
      } else {
        // Revert on error
        setLocalCoins(prev => prev - 1);
        console.error('Failed to add coin');
      }
    } catch (error) {
      // Revert on error
      setLocalCoins(prev => prev - 1);
      console.error('Error adding coin:', error);
    } finally {
      setTapping(false);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
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

      {/* Currency Display */}
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

      {/* Queen Makeda - Tappable */}
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

      {/* Navigation Buttons */}
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
    </div>
  );
}

export default DashboardPage;
