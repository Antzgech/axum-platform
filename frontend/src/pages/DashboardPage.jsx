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

// ========================================
// LEVEL SYSTEM CONFIGURATION
// ========================================
const LEVEL_REQUIREMENTS = {
  1: { 
    name: "Novice Warrior",
    coinsNeeded: 1000,
    tasksNeeded: 3,
    friendsNeeded: 1,
    reward: { coins: 100, gems: 5 }
  },
  2: { 
    name: "Skilled Fighter",
    coinsNeeded: 5000,
    tasksNeeded: 8,
    friendsNeeded: 3,
    reward: { coins: 500, gems: 10 }
  },
  3: { 
    name: "Elite Guard",
    coinsNeeded: 15000,
    tasksNeeded: 15,
    friendsNeeded: 10,
    reward: { coins: 1500, gems: 25 }
  },
  4: { 
    name: "Royal Commander",
    coinsNeeded: 50000,
    tasksNeeded: 25,
    friendsNeeded: 25,
    reward: { coins: 5000, gems: 50 }
  },
  5: { 
    name: "Legendary Hero",
    coinsNeeded: 150000,
    tasksNeeded: 40,
    friendsNeeded: 50,
    reward: { coins: 15000, gems: 100 }
  },
  6: { 
    name: "Queen's Champion",
    coinsNeeded: 500000,
    tasksNeeded: 60,
    friendsNeeded: 100,
    reward: { coins: 50000, gems: 250 }
  }
};

const MAKEDA_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

export default function DashboardPage({ user = {}, fetchUser }) {
  const { language, changeLanguage } = useLanguage();

  // UI state
  const [coins, setCoins] = useState(user.coins || 0);
  const [gems, setGems] = useState(user.gems || 0);
  const [addingCoin, setAddingCoin] = useState(false);

  // User info popup
  const [showUserInfo, setShowUserInfo] = useState(false);

  // Makeda hint with cooldown
  const [hintVisible, setHintVisible] = useState(false);
  const [hintData, setHintData] = useState(null);
  const [makedaCooldown, setMakedaCooldown] = useState(0);
  const hideTimerRef = useRef(null);
  const cooldownIntervalRef = useRef(null);

  const avatarSrc = user.photo_url || queenMakeda;
  const API_URL = 'https://axum-backend-production.up.railway.app';

  // Sync coins/gems when user prop changes
  useEffect(() => {
    if (user.coins !== undefined) setCoins(user.coins);
    if (user.gems !== undefined) setGems(user.gems);
  }, [user]);

  // Check Makeda cooldown on mount
  useEffect(() => {
    checkMakedaCooldown();
    
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Check if Makeda is on cooldown
  const checkMakedaCooldown = () => {
    const lastTap = localStorage.getItem('makeda_last_tap');
    if (lastTap) {
      const timePassed = Date.now() - parseInt(lastTap);
      if (timePassed < MAKEDA_COOLDOWN_MS) {
        const remaining = Math.ceil((MAKEDA_COOLDOWN_MS - timePassed) / 1000);
        setMakedaCooldown(remaining);
        startCooldownTimer();
      }
    }
  };

  // Start countdown timer
  const startCooldownTimer = () => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }

    cooldownIntervalRef.current = setInterval(() => {
      setMakedaCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format cooldown time
  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate level progress
  const calculateProgress = () => {
    const currentLevel = user.current_level || 1;
    const levelReq = LEVEL_REQUIREMENTS[currentLevel];
    
    if (!levelReq) {
      return {
        level: currentLevel,
        name: "Max Level",
        isMaxLevel: true
      };
    }

    const completedTasks = user.completed_tasks?.length || 0;
    const invitedFriends = user.invited_friends || 0;
    const currentCoins = user.coins || 0;

    // Calculate remaining
    const coinsRemaining = Math.max(0, levelReq.coinsNeeded - currentCoins);
    const tasksRemaining = Math.max(0, levelReq.tasksNeeded - completedTasks);
    const friendsRemaining = Math.max(0, levelReq.friendsNeeded - invitedFriends);

    // Calculate percentages
    const coinsProgress = Math.min(100, (currentCoins / levelReq.coinsNeeded) * 100);
    const tasksProgress = Math.min(100, (completedTasks / levelReq.tasksNeeded) * 100);
    const friendsProgress = Math.min(100, (invitedFriends / levelReq.friendsNeeded) * 100);
    const overallProgress = (coinsProgress + tasksProgress + friendsProgress) / 3;

    // Check if level complete
    const isLevelComplete = coinsRemaining === 0 && tasksRemaining === 0 && friendsRemaining === 0;

    return {
      level: currentLevel,
      name: levelReq.name,
      coinsNeeded: levelReq.coinsNeeded,
      tasksNeeded: levelReq.tasksNeeded,
      friendsNeeded: levelReq.friendsNeeded,
      currentCoins,
      completedTasks,
      invitedFriends,
      coinsRemaining,
      tasksRemaining,
      friendsRemaining,
      coinsProgress,
      tasksProgress,
      friendsProgress,
      overallProgress,
      isLevelComplete,
      reward: levelReq.reward,
      isMaxLevel: false
    };
  };

  // Toggle language
  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  // Click on username → Show user info popup
  const handleNameClick = () => {
    setShowUserInfo(true);
  };

  const closeUserInfo = () => {
    setShowUserInfo(false);
  };

  // PLUS BUTTON - Add 1 coin manually
  async function handlePlusClick(e) {
    e.stopPropagation();
    
    if (addingCoin) return;

    setAddingCoin(true);
    const previousCoins = coins;
    setCoins(prev => prev + 1);

    try {
      const token = localStorage.getItem("axum_token");
      
      if (!token) {
        throw new Error('No token found. Please login again.');
      }

      const res = await fetch(`${API_URL}/api/user/add-coin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

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
      console.error("Plus button error:", err);
    } finally {
      setAddingCoin(false);
    }
  }

  // When Makeda is tapped → Show progress info with cooldown
  async function handleQueenTap() {
    // Check cooldown
    if (makedaCooldown > 0) {
      alert(`⏰ Queen Makeda needs rest!\n\nPlease wait ${formatCooldown(makedaCooldown)} before tapping again.`);
      return;
    }

    console.log('👑 Queen Makeda tapped');

    // Calculate progress
    const progress = calculateProgress();
    setHintData(progress);
    setHintVisible(true);

    // Set cooldown
    localStorage.setItem('makeda_last_tap', Date.now().toString());
    setMakedaCooldown(MAKEDA_COOLDOWN_MS / 1000);
    startCooldownTimer();

    // Auto-hide after 10 seconds
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setHintVisible(false);
      hideTimerRef.current = null;
    }, 10000);
  }

  // Close hint popup
  const closeHint = () => {
    setHintVisible(false);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

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
          <div className="player-name-box" onClick={handleNameClick} style={{cursor: 'pointer'}} title="Click to view stats">
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

      {/* Makeda with Cooldown Indicator */}
      <main className="queen-main-section">
        <div className="queen-oval-frame">
          <img
            src={queenMakeda}
            alt="Queen Makeda"
            className={`queen-main-img floating ${makedaCooldown > 0 ? 'on-cooldown' : ''}`}
            onClick={handleQueenTap}
            role="button"
            style={{
              opacity: makedaCooldown > 0 ? 0.5 : 1,
              cursor: makedaCooldown > 0 ? 'not-allowed' : 'pointer'
            }}
          />
          
          {makedaCooldown > 0 && (
            <div className="cooldown-overlay">
              <div className="cooldown-text">
                ⏰ {formatCooldown(makedaCooldown)}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Progress Popup */}
        {hintVisible && hintData && (
          <aside className="progress-popover" role="status">
            <button className="close-hint-btn" onClick={closeHint}>×</button>
            
            <div className="progress-header">
              <h3>🏆 Level {hintData.level}: {hintData.name}</h3>
              {hintData.isMaxLevel && <p className="max-level-badge">⭐ MAX LEVEL ⭐</p>}
            </div>

            {!hintData.isMaxLevel && (
              <div className="progress-content">
                {/* Overall Progress */}
                <div className="overall-progress">
                  <div className="progress-label">
                    <span>Overall Progress</span>
                    <span className="progress-percentage">{hintData.overallProgress.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill overall" 
                      style={{width: `${hintData.overallProgress}%`}}
                    />
                  </div>
                </div>

                {/* Coins Progress */}
                <div className="requirement-item">
                  <div className="req-header">
                    <span className="req-icon">🪙</span>
                    <span className="req-label">Coins</span>
                    <span className="req-status">
                      {hintData.currentCoins.toLocaleString()} / {hintData.coinsNeeded.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill coins" 
                      style={{width: `${hintData.coinsProgress}%`}}
                    />
                  </div>
                  {hintData.coinsRemaining > 0 && (
                    <div className="req-remaining">
                      Need {hintData.coinsRemaining.toLocaleString()} more coins
                    </div>
                  )}
                </div>

                {/* Tasks Progress */}
                <div className="requirement-item">
                  <div className="req-header">
                    <span className="req-icon">✅</span>
                    <span className="req-label">Tasks</span>
                    <span className="req-status">
                      {hintData.completedTasks} / {hintData.tasksNeeded}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill tasks" 
                      style={{width: `${hintData.tasksProgress}%`}}
                    />
                  </div>
                  {hintData.tasksRemaining > 0 && (
                    <div className="req-remaining">
                      Complete {hintData.tasksRemaining} more tasks
                    </div>
                  )}
                </div>

                {/* Friends Progress */}
                <div className="requirement-item">
                  <div className="req-header">
                    <span className="req-icon">👥</span>
                    <span className="req-label">Friends</span>
                    <span className="req-status">
                      {hintData.invitedFriends} / {hintData.friendsNeeded}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill friends" 
                      style={{width: `${hintData.friendsProgress}%`}}
                    />
                  </div>
                  {hintData.friendsRemaining > 0 && (
                    <div className="req-remaining">
                      Invite {hintData.friendsRemaining} more friends
                    </div>
                  )}
                </div>

                {/* Level Completion */}
                {hintData.isLevelComplete ? (
                  <div className="level-complete">
                    <div className="complete-badge">🎉 LEVEL COMPLETE! 🎉</div>
                    <div className="reward-info">
                      <div className="reward-label">Next Level Reward:</div>
                      <div className="reward-items">
                        <span>🪙 +{hintData.reward.coins.toLocaleString()}</span>
                        <span>💎 +{hintData.reward.gems}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="next-level-reward">
                    <div className="reward-label">Complete Level {hintData.level} to earn:</div>
                    <div className="reward-items">
                      <span>🪙 {hintData.reward.coins.toLocaleString()}</span>
                      <span>💎 {hintData.reward.gems}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {hintData.isMaxLevel && (
              <div className="max-level-message">
                <p>🏆 You've reached the highest level!</p>
                <p>Keep earning coins and completing tasks!</p>
              </div>
            )}
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

      {/* USER INFO POPUP */}
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
                    {user?.first_name?.[0]?.toUpperCase() || '👤'}
                  </div>
                )}
              </div>
              <h3>Player Stats</h3>
            </div>

            <div className="popup-content">
              <div className="stat-row">
                <span className="stat-label">👤 Name:</span>
                <span className="stat-value">
                  {user?.first_name || 'Unknown'} {user?.last_name || ''}
                </span>
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
