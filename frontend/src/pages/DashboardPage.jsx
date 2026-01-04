import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';
import OnboardingPage from './OnboardingPage';
import DailyCheckIn from '../components/DailyCheckIn';

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
  const [tapCount, setTapCount] = useState(0);
  const [showBonus, setShowBonus] = useState(false);

  useEffect(() => {
    if (user) {
      setCoins(user.coins || 0);
      setGems(user.gems || 0);
      setCurrentLevel(user.current_level || 1);
    }
  }, [user]);

const handleTap = async () => {
  if (!canClaimReward) return; // cooldown active

  const reward = nextReward;          // old system reward
  const cooldown = nextCooldown;      // old system cooldown (minutes)

  // Save last tap time
  localStorage.setItem(STORAGE_KEYS.LAST_TAP, Date.now().toString());

  // Update local UI
  setCoins(prev => prev + reward);
  setTapCount(prev => prev + 1);

  // Flying coins animation
  createFlyingCoins(reward);

  // Start cooldown
  setCanClaimReward(false);
  setCooldownRemaining(cooldown * 60);
  startCooldownTimer(cooldown);

  // Update next reward + next cooldown
  const newReward = reward * 2;
  const newCooldown = cooldown + 1;

  setNextReward(newReward);
  setNextCooldown(newCooldown);

  localStorage.setItem(STORAGE_KEYS.NEXT_REWARD, newReward.toString());
  localStorage.setItem(STORAGE_KEYS.NEXT_COOLDOWN, newCooldown.toString());
  localStorage.setItem(STORAGE_KEYS.TAP_COUNT, (tapCount + 1).toString());

  // Send to backend
  try {
    const token = localStorage.getItem('axum_token');
    const response = await fetch(`${API_URL}/api/user/add-coin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: reward })
    });

    if (response.ok) {
      const data = await response.json();
      setCoins(data.coins);
      setGems(data.gems);
    }
  } catch (err) {
    console.error("Tap error:", err);
  }
};

    setFlyingCoins(prev => [...prev, newCoin]);

    setTimeout(() => {
      setFlyingCoins(prev => prev.filter(c => c.id !== newCoin.id));
    }, 1000);

    // Update local coin count
    setCoins(prev => prev + 1);
    setTapCount(prev => prev + 1);

    // Bonus every 10 taps
    if ((tapCount + 1) % 10 === 0) {
      setShowBonus(true);
      setCoins(prev => prev + 9); // Extra 10 coins total for 10 taps
      setTimeout(() => setShowBonus(false), 2000);
    }

    // Send to backend
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

  const handleLevelUp = async () => {
    const progress = getLevelProgress();
    if (!progress || !progress.canLevelUp) return;

    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/user/level-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentLevel(data.current_level);
        setCoins(data.coins);
        setGems(data.gems);
        fetchUser();
        alert(`🎉 Leveled up to ${LEVEL_REQUIREMENTS[data.current_level]?.name}!`);
      }
    } catch (error) {
      console.error('Level up error:', error);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Animated background pattern */}
      <div className="bg-pattern"></div>

      <header className="top-block">
        <div className="top-left">
          <div 
            className="avatar-circle" 
            onClick={() => setShowUserInfo(true)}
          >
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {user?.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          
          <div className="player-info">
            <div className="player-name">{user?.username || user?.first_name || 'Warrior'}</div>
            <div className="player-title">{LEVEL_REQUIREMENTS[currentLevel]?.name}</div>
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
        <div className="currency-item pulse-glow">
          <span className="currency-icon">🪙</span>
          <span className="currency-value">{coins.toLocaleString()}</span>
        </div>
        <div className="currency-item pulse-glow">
          <span className="currency-icon">💎</span>
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
              <span className="coin-emoji">🪙</span>
            </div>
          ))}
        </div>
        
        <p className="tap-instruction">
          <span className="tap-icon">👆</span>
          Tap Queen Makeda to earn coins!
        </p>

        {showBonus && (
          <div className="bonus-popup">
            🎉 BONUS! +10 Coins!
          </div>
        )}
      </div>

      <nav className="bottom-nav-bar">
        <Link to="/rewards" className="nav-btn">
          <div className="nav-btn-circle">
            <span className="nav-icon">🏪</span>
          </div>
          <span className="nav-label">Store</span>
        </Link>

        <Link to="/game" className="nav-btn">
          <div className="nav-btn-circle">
            <span className="nav-icon">🎮</span>
          </div>
          <span className="nav-label">Game</span>
        </Link>

        <Link to="/invite" className="nav-btn">
          <div className="nav-btn-circle">
            <span className="nav-icon">👥</span>
          </div>
          <span className="nav-label">Invite</span>
        </Link>

        <Link to="/tasks" className="nav-btn">
          <div className="nav-btn-circle">
            <span className="nav-icon">📋</span>
          </div>
          <span className="nav-label">Tasks</span>
        </Link>
      </nav>

      {/* User Info Modal */}
      {showUserInfo && (
        <div className="modal-overlay" onClick={() => setShowUserInfo(false)}>
          <div className="modal-content user-info-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUserInfo(false)}>×</button>
            
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
              <p className="user-info-title">{LEVEL_REQUIREMENTS[currentLevel]?.name}</p>
            </div>

            <div className="user-info-stats">
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <div className="stat-text">
                  <span className="stat-label">Level</span>
                  <span className="stat-value">{currentLevel}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🪙</span>
                <div className="stat-text">
                  <span className="stat-label">Coins</span>
                  <span className="stat-value">{coins.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💎</span>
                <div className="stat-text">
                  <span className="stat-label">Gems</span>
                  <span className="stat-value">{gems.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">✅</span>
                <div className="stat-text">
                  <span className="stat-label">Tasks</span>
                  <span className="stat-value">{user?.completed_tasks?.length || 0}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">👥</span>
                <div className="stat-text">
                  <span className="stat-label">Friends</span>
                  <span className="stat-value">{user?.invited_friends || 0}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🎮</span>
                <div className="stat-text">
                  <span className="stat-label">Games</span>
                  <span className="stat-value">{user?.games_played || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Progress Modal */}
      {showLevelProgress && (() => {
        const progress = getLevelProgress();
        if (!progress) return null;

        return (
          <div className="modal-overlay" onClick={() => setShowLevelProgress(false)}>
            <div className="modal-content level-progress-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowLevelProgress(false)}>×</button>
              
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
                  <button className="level-up-btn" onClick={handleLevelUp}>
                    Level Up Now!
                  </button>
                </div>
              )}

              {currentLevel < 6 && !progress.canLevelUp && (
                <div className="next-level-info">
                  <p>Complete all requirements to reach Level {currentLevel + 1}</p>
                  <p className="next-level-name">{LEVEL_REQUIREMENTS[currentLevel + 1]?.name}</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Daily Check-in Modal */}
      {showCheckin && (
        <DailyCheckIn 
          user={user} 
          onClose={() => setShowCheckin(false)}
          onClaimSuccess={fetchUser}
        />
      )}

      {/* Story Modal */}
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
