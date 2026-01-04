import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';
import OnboardingPage from './OnboardingPage';
import DailyCheckIn from '../components/DailyCheckIn';

const API_URL = 'https://axum-backend-production.up.railway.app';

const LEVEL_REQUIREMENTS = {
  1: { name: "Novice Warrior", coinsNeeded: 100, tasksNeeded: 3, friendsNeeded: 1, reward: { coins: 100, gems: 5 } },
  2: { name: "Skilled Fighter", coinsNeeded: 500, tasksNeeded: 5, friendsNeeded: 3, reward: { coins: 300, gems: 10 } },
  3: { name: "Elite Guard", coinsNeeded: 1500, tasksNeeded: 7, friendsNeeded: 5, reward: { coins: 500, gems: 25 } },
  4: { name: "Royal Commander", coinsNeeded: 5000, tasksNeeded: 10, friendsNeeded: 8, reward: { coins: 1000, gems: 50 } },
  5: { name: "Legendary Hero", coinsNeeded: 15000, tasksNeeded: 16, friendsNeeded: 11, reward: { coins: 1500, gems: 100 } },
  6: { name: "Queen's Champion", coinsNeeded: 50000, tasksNeeded: 21, friendsNeeded: 15, reward: { coins: 5000, gems: 250 } }
};

const STORAGE_KEYS = {
  LAST_RESET: 'makeda_last_reset',
  TAP_COUNT: 'makeda_tap_count',
  LAST_TAP: 'makeda_last_tap',
  NEXT_REWARD: 'makeda_next_reward',
  NEXT_COOLDOWN: 'makeda_next_cooldown'
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

  // Cooldown + reward system
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownProgress, setCooldownProgress] = useState(0);
  const [canClaimReward, setCanClaimReward] = useState(true);
  const [nextReward, setNextReward] = useState(2);
  const [nextCooldown, setNextCooldown] = useState(2);

  const cooldownIntervalRef = useRef(null);
  const makedaRef = useRef(null);

  // Sync with user data from backend
  useEffect(() => {
    if (user) {
      if (user.coins !== undefined) setCoins(user.coins);
      if (user.gems !== undefined) setGems(user.gems);
      if (user.current_level !== undefined) setCurrentLevel(user.current_level || 1);
    }
  }, [user]);

  // Auto-open daily check-in if not done today
  useEffect(() => {
    const lastCheckin = localStorage.getItem('last_checkin_date');
    const today = new Date().toDateString();
    if (lastCheckin !== today) {
      const timer = setTimeout(() => setShowCheckin(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Initialize daily tap system
  useEffect(() => {
    initializeDailySystem();
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAndResetDaily = () => {
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    const now = new Date();
    const today = now.toDateString();

    if (!lastReset || lastReset !== today) {
      localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
      localStorage.setItem(STORAGE_KEYS.TAP_COUNT, '0');
      localStorage.setItem(STORAGE_KEYS.NEXT_REWARD, '2');
      localStorage.setItem(STORAGE_KEYS.NEXT_COOLDOWN, '2');
      localStorage.removeItem(STORAGE_KEYS.LAST_TAP);

      setTapCount(0);
      setNextReward(2);
      setNextCooldown(2);
      setCooldownRemaining(0);
      setCooldownProgress(0);
      setCanClaimReward(true);
      return true;
    }
    return false;
  };

  const initializeDailySystem = () => {
    const isNewDay = checkAndResetDaily();
    if (!isNewDay) {
      const savedTapCount = parseInt(localStorage.getItem(STORAGE_KEYS.TAP_COUNT) || '0', 10);
      const savedNextReward = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_REWARD) || '2', 10);
      const savedNextCooldown = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_COOLDOWN) || '2', 10);
      const savedLastTap = localStorage.getItem(STORAGE_KEYS.LAST_TAP);

      setTapCount(savedTapCount);
      setNextReward(savedNextReward);
      setNextCooldown(savedNextCooldown);

      if (savedLastTap) {
        const lastTapTime = parseInt(savedLastTap, 10);
        const cooldownMs = savedNextCooldown * 60 * 1000;
        const timePassed = Date.now() - lastTapTime;

        if (timePassed < cooldownMs) {
          const remainingSec = Math.ceil((cooldownMs - timePassed) / 1000);
          const totalSec = savedNextCooldown * 60;
          const progress = ((totalSec - remainingSec) / totalSec) * 100;

          setCooldownRemaining(remainingSec);
          setCooldownProgress(progress);
          setCanClaimReward(false);
          startCooldownTimer(savedNextCooldown, remainingSec);
        } else {
          setCanClaimReward(true);
          setCooldownProgress(100);
          setCooldownRemaining(0);
        }
      } else {
        setCanClaimReward(true);
        setCooldownProgress(0);
        setCooldownRemaining(0);
      }
    }
  };

  const startCooldownTimer = (cooldownMinutes, startFromSeconds = null) => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

    const totalSeconds = cooldownMinutes * 60;
    let currentRemaining = startFromSeconds !== null ? startFromSeconds : totalSeconds;

    cooldownIntervalRef.current = setInterval(() => {
      currentRemaining -= 1;

      if (currentRemaining <= 0) {
        clearInterval(cooldownIntervalRef.current);
        setCanClaimReward(true);
        setCooldownProgress(100); // stay full when ready
        setCooldownRemaining(0);
        return;
      }

      const progress = ((totalSeconds - currentRemaining) / totalSeconds) * 100;
      setCooldownProgress(progress);
      setCooldownRemaining(currentRemaining);
    }, 1000);
  };

  const createFlyingCoins = (e, amount) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const baseX = e.clientX - rect.left;
    const baseY = e.clientY - rect.top;

    const newCoins = [];
    const count = Math.min(amount, 20); // cap for performance

    for (let i = 0; i < count; i++) {
      const id = Date.now() + Math.random();
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 60;

      newCoins.push({
        id,
        x: baseX + offsetX,
        y: baseY + offsetY
      });
    }

    setFlyingCoins(prev => [...prev, ...newCoins]);

    setTimeout(() => {
      setFlyingCoins(prev => prev.filter(c => !newCoins.find(nc => nc.id === c.id)));
    }, 1000);
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

  const handleTap = async (e) => {
    if (!canClaimReward) return;

    setCooldownProgress(0);

    const reward = nextReward;
    const cooldown = nextCooldown;

    localStorage.setItem(STORAGE_KEYS.LAST_TAP, Date.now().toString());

    setCoins(prev => prev + reward);
    setTapCount(prev => prev + 1);

    createFlyingCoins(e, reward);

    // Optional simple bonus visual every 10 taps
    if ((tapCount + 1) % 10 === 0) {
      setShowBonus(true);
      setTimeout(() => setShowBonus(false), 1500);
    }

    setCanClaimReward(false);
    setCooldownRemaining(cooldown * 60);
    startCooldownTimer(cooldown);

    const newReward = reward * 2;
    const newCooldown = cooldown + 1;

    setNextReward(newReward);
    setNextCooldown(newCooldown);

    localStorage.setItem(STORAGE_KEYS.NEXT_REWARD, newReward.toString());
    localStorage.setItem(STORAGE_KEYS.NEXT_COOLDOWN, newCooldown.toString());
    localStorage.setItem(STORAGE_KEYS.TAP_COUNT, (tapCount + 1).toString());

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
    } catch (error) {
      console.error('Error adding coin:', error);
    }
  };

  return (
    <div className="dashboard-page">
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
            className="checkin-mini-btn"
            onClick={() => setShowCheckin(true)}
            title="Daily Check-in"
          >
            🎁
          </button>

<button
  className="story-btn"
  onClick={() => setShowStory(true)}
>
  <span className="story-icon">⚜️</span>
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
        <div className="makeda-container" onClick={handleTap} ref={makedaRef}>
          <img
            src="/queen-makeda.png"
            alt="Queen Makeda"
            className="makeda-image"
          />

          <div className="cooldown-circle">
            <svg width="80" height="80">
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="#FFD700"
                strokeWidth="6"
                fill="none"
                strokeDasharray="219.91"
                strokeDashoffset={219.91 - (219.91 * cooldownProgress) / 100}
                style={{ transition: 'stroke-dashoffset 0.3s linear' }}
              />
            </svg>

            {!canClaimReward && (
              <div className="cooldown-text">
                {cooldownRemaining}s
              </div>
            )}

            {canClaimReward && (
              <div className="cooldown-ready">
                READY
              </div>
            )}
          </div>

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
            🎉 BONUS TAP!
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
            <OnboardingPage onComplete={() => setShowStory(false)} 
              isModal={true} 
              forceShow={true} // ⭐ add this
            />
          </div>
        </div>
      )}
    </div>
  );
}
