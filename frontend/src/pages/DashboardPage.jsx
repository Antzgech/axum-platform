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

  // UI state (always synced with DB)
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [addingCoin, setAddingCoin] = useState(false);

  // User info popup
  const [showUserInfo, setShowUserInfo] = useState(false);

  // Makeda hint
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState('');
  const hideTimerRef = useRef(null);

  const avatarSrc = user.photo_url || queenMakeda;

  const API_URL = 'https://axum-backend-production.up.railway.app';

  // Sync coins/gems from user prop
  useEffect(() => {
    console.log('📊 User data:', user);
    if (user.coins !== undefined) {
      setCoins(user.coins);
      console.log('💰 Coins from DB:', user.coins);
    }
    if (user.gems !== undefined) {
      setGems(user.gems);
      console.log('💎 Gems from DB:', user.gems);
    }
  }, [user]);

  // Toggle language
  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  // ⭐ Click on SABA name → Show user info popup
  const handleNameClick = () => {
    console.log('👤 Opening user info popup');
    setShowUserInfo(true);
  };

  const closeUserInfo = () => {
    setShowUserInfo(false);
  };

  // ⭐ PLUS BUTTON - Add 1 coin manually
  async function handlePlusClick(e) {
    e.stopPropagation();
    
    if (addingCoin) return;

    console.log('➕ Plus button clicked');

    setAddingCoin(true);
    
    // Optimistically update UI
    const previousCoins = coins;
    setCoins(prev => prev + 1);

    try {
      const token = localStorage.getItem("axum_token");
      
      if (!token) {
        throw new Error('No token found');
      }

      console.log('📡 Calling /api/user/add-coin...');

      const res = await fetch(`${API_URL}/api/user/add-coin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', res.status);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('📡 Response data:', data);

      if (data.success) {
        setCoins(data.coins);
        setGems(data.gems);
        console.log('✅ Coin added! Total:', data.coins);

        if (typeof fetchUser === "function") {
          fetchUser();
        }
      } else {
        setCoins(previousCoins);
        console.error('Failed to add coin:', data);
        alert('Failed to add coin');
      }
    } catch (err) {
      setCoins(previousCoins);
      console.error("❌ Plus button error:", err);
      alert(`Failed to add coin: ${err.message}\n\nCheck if backend is deployed with /api/user/add-coin endpoint.`);
    } finally {
      setAddingCoin(false);
    }
  }

  // ⭐ When Makeda is tapped → show hint + add 1 coin to DB
  async function handleQueenTap() {
    console.log('👑 Queen Makeda tapped');

    // Show hint popup
    setHintText('Complete 3 battles\nCollect 10,000 coins\nFinish 5 tasks');
    setHintVisible(true);

    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setHintVisible(false);
      hideTimerRef.current = null;
    }, 3000);

    // Add 1 coin to database
    const previousCoins = coins;
    setCoins(prev => prev + 1);

    try {
      const token = localStorage.getItem("axum_token");

      const res = await fetch(`${API_URL}/api/user/add-coin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        setCoins(data.coins);
        setGems(data.gems);

        if (typeof fetchUser === "function") {
          fetchUser();
        }
      } else {
        setCoins(previousCoins);
      }
    } catch (err) {
      setCoins(previousCoins);
      console.error("Makeda coin error:", err);
    }
  }

  // Calculate stats
  const completedTasksCount = user?.completed_tasks?.length || 0;
  const invitedFriends = user?.invited_friends || 0;
  const currentLevel = user?.current_level || 1;

  return (
    <div className="saba-dashboard full-screen">
      {/* Header */}
      <header className="top-block" role="banner">
        <div className="top-left">
          <div className="avatar-circle">
            <img src={avatarSrc} alt={user.username || 'PLAYER'} className="avatar-img" />
          </div>
          <div className="player-name-box" onClick={handleNameClick} style={{cursor: 'pointer'}}>
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
          <span className="axum-logo-emoji" role="img">⚜️</span>
        </div>
      </header>

      {/* Coins & Gems with PLUS BUTTON */}
      <div className="currency-row logo-style">
        <div className="currency-item logo-box">
          <img src={iconCoin} alt="Coins" className="currency-icon" />
          <div className="currency-value-wrapper">
            <div className="currency-value">{coins.toLocaleString()}</div>
            <button 
              className={`plus-coin-btn ${addingCoin ? 'adding' : ''}`}
              onClick={handlePlusClick}
              disabled={addingCoin}
              title="Add 1 coin"
            >
              {addingCoin ? '⏳' : '+'}
            </button>
          </div>
        </div>

        <div className="currency-item logo-box">
          <img src={iconGem} alt="Gems" className="currency-icon" />
          <div className="currency-value">{gems}</div>
        </div>
      </div>

      {/* Makeda */}
      <main className="queen-main-section">
        <div className="queen-oval-frame">
          <img
            src={queenMakeda}
            alt="Queen Makeda"
            className="queen-main-img floating"
            onClick={handleQueenTap}
            role="button"
          />
        </div>

        {hintVisible && (
          <aside className="hint-popover" role="status">
            <div className="hint-header">Quick Hint</div>
            <pre className="hint-text">{hintText}</pre>
          </aside>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav-bar">
        <Link to="/rewards" className="nav-btn">
          <div className="nav-btn-circle">
            <img src={iconStore} alt="Store" className="nav-icon" />
          </div>
        </Link>

        <Link to="/game" className="nav-btn">
          <div className="nav-btn-circle">
            <img src={iconBoosts} alt="Boosts" className="nav-icon" />
          </div>
        </Link>

        <Link to="/dashboard" className="nav-btn">
          <div className="nav-btn-circle">
            <img src={iconFriends} alt="Friends" className="nav-icon" />
          </div>
        </Link>

        <Link to="/tasks" className="nav-btn">
          <div className="nav-btn-circle">
            <img src={iconEarnCoins} alt="Earn Coins" className="nav-icon" />
          </div>
        </Link>
      </nav>

      {/* USER INFO POPUP - Shows when SABA name is clicked */}
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
                <span className="stat-value highlight">{coins.toLocaleString()}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">💎 Gems:</span>
                <span className="stat-value highlight">{gems.toLocaleString()}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">⭐ Level:</span>
                <span className="stat-value highlight">{currentLevel}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">✅ Tasks Completed:</span>
                <span className="stat-value highlight">{completedTasksCount}</span>
              </div>

              <div className="stat-row">
                <span className="stat-label">👥 Friends Invited:</span>
                <span className="stat-value highlight">{invitedFriends}</span>
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
