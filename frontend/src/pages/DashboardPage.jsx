import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';
import OnboardingPage from './OnboardingPage';
import DailyCheckIn from '../components/DailyCheckIn';
import LevelProgress from '../components/LevelProgress';

// NO IMAGE IMPORTS - Using emojis and public folder images instead

const API_URL = 'https://axum-backend-production.up.railway.app';

const LEVEL_REQUIREMENTS = {
  1: { 
    name: "Novice Warrior", 
    coinsNeeded: 100,
    tasksNeeded: 3,
    friendsNeeded: 1,
    reward: { coins: 100, gems: 5 } 
  },
  2: { 
    name: "Skilled Fighter", 
    coinsNeeded: 1000,
    tasksNeeded: 8,
    friendsNeeded: 3,
    reward: { coins: 500, gems: 10 } 
  },
  3: { 
    name: "Elite Guard", 
    coinsNeeded: 5000,
    tasksNeeded: 15,
    friendsNeeded: 10,
    reward: { coins: 1500, gems: 25 } 
  },
  4: { 
    name: "Royal Commander", 
    coinsNeeded: 15000,
    tasksNeeded: 25,
    friendsNeeded: 25,
    reward: { coins: 5000, gems: 50 } 
  },
  5: { 
    name: "Legendary Hero", 
    coinsNeeded: 50000,
    tasksNeeded: 40,
    friendsNeeded: 50,
    reward: { coins: 15000, gems: 100 } 
  },
  6: { 
    name: "Queen's Champion", 
    coinsNeeded: 150000,
    tasksNeeded: 60,
    friendsNeeded: 100,
    reward: { coins: 50000, gems: 250 } 
  }
};

export default function DashboardPage({ user, fetchUser }) {
  const [coins, setCoins] = useState(user?.coins || 0);
  const [gems, setGems] = useState(user?.gems || 0);
  const [flyingCoins, setFlyingCoins] = useState([]);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showLevelProgress, setShowLevelProgress] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(user?.current_level || 1);

  useEffect(() => {
    if (user) {
      setCoins(user.coins || 0);
      setGems(user.gems || 0);
      setCurrentLevel(user.current_level || 1);
    }
  }, [user]);

  const handleTap = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newCoin = {
      id: Date.now() + Math.random(),
      x,
      y
    };
    setFlyingCoins(prev => [...prev, newCoin]);

    setTimeout(() => {
      setFlyingCoins(prev => prev.filter(c => c.id !== newCoin.id));
    }, 1000);

    setCoins(prev => prev + 1);

    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/user/add-coin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCoins(data.coins);
        setGems(data.gems);
      }
    } catch (error) {
      console.error('Error adding coin:', error);
    }
  };

  const openUserInfo = () => setShowUserInfo(true);
  const closeUserInfo = () => setShowUserInfo(false);
  const closeLevelProgress = () => setShowLevelProgress(false);
  const closeCheckin = () => setShowCheckin(false);

  const getLevelProgress = () => {
    const requirements = LEVEL_REQUIREMENTS[currentLevel];
    if (!requirements) return null;

    const completedTasks = user?.completed_tasks?.length || 0;
    const invitedFriends = user?.invited_friends || 0;

    const coinsProgress = Math.min((coins / requirements.coinsNeeded) * 100, 100);
    const tasksProgress = Math.min((completedTasks / requirements.tasksNeeded) * 100, 100);
    const friendsProgress = Math.min((invitedFriends / requirements.friendsNeeded) * 100, 100);

    const canLevelUp = 
      coins >= requirements.coinsNeeded &&
      completedTasks >= requirements.tasksNeeded &&
      invitedFriends >= requirements.friendsNeeded;

    return {
      coinsProgress,
      tasksProgress,
      friendsProgress,
      canLevelUp,
      requirements,
      completedTasks,
      invitedFriends
    };
  };

  return (
    <div className="dashboard-page">
      <header className="top-block">
        <div className="top-left">
          <div 
            className="avatar-circle" 
            onClick={openUserInfo}
            style={{ cursor: 'pointer' }}
          >
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {user?.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          
          <div className="player-name-box">
            <div className="player-name">{user?.username || user?.first_name || 'Warrior'}</div>
          </div>
        </div>

        <div className="top-right">
          <button 
            className="level-btn"
            onClick={() => setShowLevelProgress(true)}
          >
            ⭐ Lv.{currentLevel}
          </button>

          <button 
            className="checkin-mini-btn"
            onClick={() => setShowCheckin(true)}
            title="Daily Check-in"
          >
            🎁
          </button>

          <button 
            className="axum-logo-btn" 
            onClick={() => setShowStory(true)}
            title="View Story"
          >
            <span className="axum-logo-emoji">⚜️</span>
          </button>
        </div>
      </header>

      <div className="currency-display">
        <div className="currency-item">
          <span style={{ fontSize: '32px' }}>🪙</span>
          <span className="currency-value">{coins.toLocaleString()}</span>
        </div>
        <div className="currency-item">
          <span className="gem-icon">💎</span>
          <span className="currency-value">{gems.toLocaleString()}</span>
        </div>
      </div>

      <div className="tap-area">
        <div className="makeda-container" onClick={handleTap}>
          <img 
            src="/queen-makeda.png" 
            alt="Queen Makeda" 
            className="makeda-image"
          />
          
          {flyingCoins.map(flyingCoin => (
            <div
              key={flyingCoin.id}
              className="flying-coin"
              style={{
                left: `${flyingCoin.x}px`,
                top: `${flyingCoin.y}px`
              }}
            >
              <span style={{ fontSize: '40px' }}>🪙</span>
            </div>
          ))}
        </div>
        
        <p className="tap-instruction">👆 Tap Queen Makeda to earn coins!</p>
      </div>

      <nav className="bottom-nav-bar">
        <Link to="/rewards" className="nav-btn">
          <div className="nav-btn-circle">
            <span style={{ fontSize: '24px' }}>🏪</span>
          </div>
          <span className="nav-label">Store</span>
        </Link>

        <Link to="/game" className="nav-btn">
          <div className="nav-btn-circle">
            <span style={{ fontSize: '24px' }}>🎮</span>
          </div>
          <span className="nav-label">Game</span>
        </Link>

        <Link to="/invite" className="nav-btn">
          <div className="nav-btn-circle">
            <span style={{ fontSize: '24px' }}>👥</span>
          </div>
          <span className="nav-label">Invite</span>
        </Link>

        <Link to="/tasks" className="nav-btn">
          <div className="nav-btn-circle">
            <span style={{ fontSize: '24px' }}>📋</span>
          </div>
          <span className="nav-label">Tasks</span>
        </Link>
      </nav>

      {showUserInfo && (
        <div className="modal-overlay" onClick={closeUserInfo}>
          <div className="modal-content user-info-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeUserInfo}>×</button>
            
            <div className="user-info-header">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="Avatar" className="user-info-avatar" />
              ) : (
                <div className="user-info-avatar-placeholder">
                  {user?.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <h2>{user?.first_name} {user?.last_name}</h2>
              <p className="user-info-username">@{user?.username}</p>
            </div>

            <div className="user-info-stats">
              <div className="stat-item">
                <span className="stat-label">Level</span>
                <span className="stat-value">⭐ {currentLevel}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Coins</span>
                <span className="stat-value">🪙 {coins.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Gems</span>
                <span className="stat-value">💎 {gems.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tasks</span>
                <span className="stat-value">✅ {user?.completed_tasks?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Friends</span>
                <span className="stat-value">👥 {user?.invited_friends || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLevelProgress && (() => {
        const progress = getLevelProgress();
        if (!progress) return null;

        return (
          <div className="modal-overlay" onClick={closeLevelProgress}>
            <div className="modal-content level-progress-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeLevelProgress}>×</button>
              
              <h2>⭐ Level {currentLevel}</h2>
              <h3>{progress.requirements.name}</h3>

              <div className="progress-section">
                <div className="progress-item">
                  <div className="progress-label">
                    <span>🪙 Coins</span>
                    <span>{coins.toLocaleString()} / {progress.requirements.coinsNeeded.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress.coinsProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-label">
                    <span>✅ Tasks</span>
                    <span>{progress.completedTasks} / {progress.requirements.tasksNeeded}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress.tasksProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-label">
                    <span>👥 Friends</span>
                    <span>{progress.invitedFriends} / {progress.requirements.friendsNeeded}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress.friendsProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {progress.canLevelUp && (
                <div className="level-up-ready">
                  <h3>🎉 Ready to Level Up!</h3>
                  <p>Reward: {progress.requirements.reward.coins}🪙 + {progress.requirements.reward.gems}💎</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {showCheckin && (
        <div className="modal-overlay" onClick={closeCheckin}>
          <div className="modal-content checkin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeCheckin}>×</button>
            <h2>📅 Daily Check-in</h2>
            <p>Check in daily to earn rewards!</p>
            <button className="claim-btn" onClick={closeCheckin}>Claim Reward</button>
          </div>
        </div>
      )}

      {showStory && (
        <div className="story-overlay" onClick={() => setShowStory(false)}>
          <div className="story-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-story" onClick={() => setShowStory(false)}>×</button>
            <OnboardingPage onComplete={() => setShowStory(false)} isModal={true} />
          </div>
        </div>
      )}
    </div>
  );
}
