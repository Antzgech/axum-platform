// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';
import DailyCheckIn from '../components/DailyCheckIn';
import LevelProgress from '../components/LevelProgress';
import OnboardingPage from './OnboardingPage';

// Assets
import queenMakeda from '../assets/queen-makeda.png';
import iconCoin from '../assets/icon-coin.png';
import iconGem from '../assets/icon-gem.png';
import iconStore from '../assets/icon-store.png';
import iconBoosts from '../assets/icon-boosts.png';
import iconFriends from '../assets/icon-friends.png';
import iconEarnCoins from '../assets/icon-earn-coins.png';

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

const API_URL = process.env.REACT_APP_API_URL;

export default function DashboardPage({ user = {}, fetchUser }) {
  // UI state
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [flyingCoins, setFlyingCoins] = useState([]);

  // Tap system state (local, per-device)
  const [nextReward, setNextReward] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.NEXT_REWARD);
    return stored ? parseInt(stored, 10) : 2;
  });
  const [nextCooldown, setNextCooldown] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.NEXT_COOLDOWN);
    return stored ? parseInt(stored, 10) : 2;
  });
  const [tapCount, setTapCount] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.TAP_COUNT);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [cooldownProgress, setCooldownProgress] = useState(0);
  const [canClaimReward, setCanClaimReward] = useState(true);

  // Overlays
  const [showCheckin, setShowCheckin] = useState(false);
  const [showLevelProgress, setShowLevelProgress] = useState(false);
  const [showStory, setShowStory] = useState(false);

  // Refs
  const cooldownIntervalRef = useRef(null);
  const progressTimerRef = useRef(null);
  const userInfoTimerRef = useRef(null);
  const coinBoxRef = useRef(null);
  const makedaRef = useRef(null);

  const avatarSrc = user.photo_url || queenMakeda;

  // ---------------------------
  // Daily Check-In: auto open once per day
  // ---------------------------
  useEffect(() => {
    const lastCheckin = localStorage.getItem('last_checkin_date');
    const today = new Date().toDateString();
    if (lastCheckin !== today) {
      // Open after a short delay so Dashboard is visible first
      const timer = setTimeout(() => setShowCheckin(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // ---------------------------
  // Daily Tap System Init
  // ---------------------------
  useEffect(() => {
    initializeDailySystem();
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      if (userInfoTimerRef.current) clearTimeout(userInfoTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAndResetDaily = () => {
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    const today = new Date().toDateString();
    if (!lastReset || lastReset !== today) {
      localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
      localStorage.setItem(STORAGE_KEYS.TAP_COUNT, '0');
      localStorage.setItem(STORAGE_KEYS.NEXT_REWARD, '2');
      localStorage.setItem(STORAGE_KEYS.NEXT_COOLDOWN, '2');
      localStorage.removeItem(STORAGE_KEYS.LAST_TAP);

      setTapCount(0);
      setNextReward(2);
      setNextCooldown(2);
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
          setCooldownProgress(progress);
          setCanClaimReward(false);
          startCooldownTimer(savedNextCooldown, remainingSec);
        } else {
          setCanClaimReward(true);
          setCooldownProgress(0);
        }
      }
    }
  };

  const startCooldownTimer = (cooldownMinutes, startFromSeconds = null) => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    const totalSeconds = cooldownMinutes * 60;
    let currentRemaining = startFromSeconds !== null ? startFromSeconds : totalSeconds;
    cooldownIntervalRef.current = setInterval(() => {
      currentRemaining--;
      if (currentRemaining <= 0) {
        clearInterval(cooldownIntervalRef.current);
        setCanClaimReward(true);
        setCooldownProgress(0);
        return;
      }
      const progress = ((totalSeconds - currentRemaining) / totalSeconds) * 100;
      setCooldownProgress(progress);
    }, 1000);
  };

  // ---------------------------
  // Flying coins animation
  // ---------------------------
  const createFlyingCoins = (amount) => {
    const makedaRect = makedaRef.current?.getBoundingClientRect();
    const coinBoxRect = coinBoxRef.current?.getBoundingClientRect();
    if (!makedaRect || !coinBoxRect) return;

    const startX = makedaRect.left + makedaRect.width / 2;
    const startY = makedaRect.top + makedaRect.height / 2;
    const endX = coinBoxRect.left + coinBoxRect.width / 2;
    const endY = coinBoxRect.top + coinBoxRect.height / 2;

    const newCoins = [];
    for (let i = 0; i < amount; i++) {
      const id = Date.now() + Math.random();
      newCoins.push({
        id,
        startX,
        startY,
        endX,
        endY,
        delay: i * 80,
        coinNumber: i + 1
      });
    }

    setFlyingCoins(prev => [...prev, ...newCoins]);

    setTimeout(() => {
      setFlyingCoins(prev => prev.filter(coin => !newCoins.find(c => c.id === coin.id)));
    }, 900 + amount * 120);
  };

  // ---------------------------
  // Level progress calculation
  // ---------------------------
  const calculateProgress = () => {
    const currentLevel = user.current_level || 1;
    const levelReq = LEVEL_REQUIREMENTS[currentLevel];
    if (!levelReq) return { level: currentLevel, name: "Max Level", isMaxLevel: true };

    const completedTasks = user.completed_tasks ? Object.keys(user.completed_tasks).length : 0;
    const invitedFriends = user.invited_friends || 0;
    const currentCoins = user.coins || 0;

    const coinsRemaining = Math.max(0, levelReq.coinsNeeded - currentCoins);
    const tasksRemaining = Math.max(0, levelReq.tasksNeeded - completedTasks);
    const friendsRemaining = Math.max(0, levelReq.friendsNeeded - invitedFriends);

    const coinsProgress = Math.min(100, (currentCoins / levelReq.coinsNeeded) * 100);
    const tasksProgress = Math.min(100, (completedTasks / levelReq.tasksNeeded) * 100);
    const friendsProgress = Math.min(100, (invitedFriends / levelReq.friendsNeeded) * 100);
    const overallProgress = (coinsProgress + tasksProgress + friendsProgress) / 3;

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
      isMaxLevel: false
    };
  };

  // ---------------------------
  // Daily Check-In handlers
  // ---------------------------
  const handleCheckinClaim = (data) => {
    // Mark today as checked in locally
    localStorage.setItem('last_checkin_date', new Date().toDateString());

    // If backend grants rewards on check-in, we refresh user
    if (typeof fetchUser === 'function') {
      fetchUser();
    }

    // Soft close after a brief delay
    setTimeout(() => setShowCheckin(false), 800);
  };
{console.log("Rendering DailyCheckIn:", showCheckin)}
{showCheckin && (
  <DailyCheckIn onClose={() => setShowCheckin(false)} onClaim={handleCheckinClaim} />
)}

  // ---------------------------
  // User info popup
  // ---------------------------
  const handleNameClick = () => {
    setShowUserInfo(true);
    if (userInfoTimerRef.current) clearTimeout(userInfoTimerRef.current);
    userInfoTimerRef.current = setTimeout(() => setShowUserInfo(false), 3000);
  };

  const closeUserInfo = () => {
    setShowUserInfo(false);
    if (userInfoTimerRef.current) clearTimeout(userInfoTimerRef.current);
  };

  // ---------------------------
  // Queen tap logic
  // ---------------------------
  const handleQueenTap = async () => {
    const progress = calculateProgress();
    setProgressData(progress);
    setShowProgress(true);

    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => setShowProgress(false), 3000);

    if (canClaimReward) {
      createFlyingCoins(nextReward);

      for (let i = 0; i < nextReward; i++) {
        setTimeout(() => giveOneCoin(), 800 + i * 80);
      }

      const newTapCount = tapCount + 1;
      const newNextReward = nextReward * 2;
      const newNextCooldown = nextCooldown * 2;

      setTapCount(newTapCount);
      setNextReward(newNextReward);
      setNextCooldown(newNextCooldown);

      localStorage.setItem(STORAGE_KEYS.TAP_COUNT, newTapCount.toString());
      localStorage.setItem(STORAGE_KEYS.NEXT_REWARD, newNextReward.toString());
      localStorage.setItem(STORAGE_KEYS.NEXT_COOLDOWN, newNextCooldown.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_TAP, Date.now().toString());

      setCooldownProgress(0);
      setCanClaimReward(false);
      startCooldownTimer(newNextCooldown);
    }
  };

  const giveOneCoin = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/user/add-coin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      if (res.ok && typeof fetchUser === 'function') {
        await fetchUser();
      }
    } catch (err) {
      console.error('Error giving coin:', err);
    }
  };

  const closeProgress = () => {
    setShowProgress(false);
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
  };

  // ---------------------------
  // Derived values from user (DB is source of truth)
  // ---------------------------
  const completedTasksCount = user.completed_tasks ? Object.keys(user.completed_tasks).length : 0;
  const invitedFriends = user.invited_friends || 0;
  const currentLevel = user.current_level || 1;
  const coins = user.coins || 0;
  const gems = user.gems || 0;

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="saba-dashboard full-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="top-block" role="banner">
        <div className="top-left">
          <div className="avatar-circle">
            <img src={avatarSrc} alt={user.username || 'PLAYER'} className="avatar-img" />
          </div>

          <div className="player-name-box" onClick={handleNameClick} style={{ cursor: 'pointer' }} title="Click to view stats">
            <span className="player-name">{user.username || user.first_name || 'PLAYER NAME'}</span>
          </div>
        </div>

        <div className="top-right">
          <button className="level-btn" onClick={() => setShowLevelProgress(true)} title="View Level Progress">
            ⭐ Lv.{currentLevel}
          </button>

          <button className="axum-logo-btn" onClick={() => setShowStory(true)} title="Story / Onboarding">
            <span className="axum-logo-emoji">⚜️</span>
          </button>

          {/* Daily Check-In manual open */}
          <button
            className="lang-toggle-btn"
            onClick={() => setShowCheckin(true)}
            aria-label="Daily Check-In"
            title="Daily Check-In"
          >
            <span style={{ fontSize: '1.2rem' }}>🎁</span>
          </button>
        </div>
      </header>

      <div className="currency-row logo-style">
        <div className="currency-item logo-box" ref={coinBoxRef}>
          <img src={iconCoin} alt="Coins" className="currency-icon" />
          <div className="currency-value">{coins.toLocaleString()}</div>
        </div>

        <div className="currency-item logo-box">
          <img src={iconGem} alt="Gems" className="currency-icon" />
          <div className="currency-value">{gems.toLocaleString()}</div>
        </div>
      </div>

      <main className="queen-main-section" role="main">
        <div className="queen-oval-frame" ref={makedaRef}>
          <svg className="cooldown-progress-ring" viewBox="0 0 100 100" aria-hidden>
            <circle className="progress-ring-bg" cx="50" cy="50" r="48" />
            <circle
              className="progress-ring-fill"
              cx="50"
              cy="50"
              r="48"
              style={{ strokeDashoffset: 302 - (302 * cooldownProgress) / 100 }}
            />
          </svg>

          <img
            src={queenMakeda}
            alt="Queen Makeda"
            className="queen-main-img floating"
            onClick={handleQueenTap}
            role="button"
            aria-label="Tap Queen Makeda to earn coins"
          />
        </div>

        {flyingCoins.map((coin) => (
          <div
            key={coin.id}
            className="flying-coin"
            style={{
              left: `${coin.startX}px`,
              top: `${coin.startY}px`,
              '--end-x': `${coin.endX}px`,
              '--end-y': `${coin.endY}px`,
              '--start-x': `${coin.startX}px`,
              '--start-y': `${coin.startY}px`,
              animationDelay: `${coin.delay}ms`
            }}
          >
            <img src={iconCoin} alt="coin" style={{ width: 24, height: 24 }} />
          </div>
        ))}

        {showProgress && progressData && (
          <aside className="progress-popover-compact" role="status">
            <button className="close-hint-btn" onClick={closeProgress}>×</button>

            <div className="progress-header-compact">
              <h4>Level {progressData.level}: {progressData.name}</h4>
            </div>

            {!progressData.isMaxLevel && (
              <div className="progress-content-compact">
                <div className="req-compact">
                  <span className="req-icon-small">🪙</span>
                  <span className="req-text">
                    {progressData.currentCoins.toLocaleString()} / {progressData.coinsNeeded.toLocaleString()}
                  </span>
                  {progressData.coinsRemaining > 0 && (
                    <span className="req-remain-small">
                      {progressData.coinsRemaining.toLocaleString()} left
                    </span>
                  )}
                </div>

                <div className="req-compact">
                  <span className="req-icon-small">✅</span>
                  <span className="req-text">
                    {progressData.completedTasks} / {progressData.tasksNeeded}
                  </span>
                  {progressData.tasksRemaining > 0 && (
                    <span className="req-remain-small">
                      {progressData.tasksRemaining} left
                    </span>
                  )}
                </div>

                <div className="req-compact">
                  <span className="req-icon-small">👥</span>
                  <span className="req-text">
                    {progressData.invitedFriends} / {progressData.friendsNeeded}
                  </span>
                  {progressData.friendsRemaining > 0 && (
                    <span className="req-remain-small">
                      {progressData.friendsRemaining} left
                    </span>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </main>

      <nav className="bottom-nav-bar" role="navigation" aria-label="Main navigation">
        <Link to="/rewards" className="nav-btn" aria-label="Store">
          <div className="nav-btn-circle"><img src={iconStore} alt="Store" className="nav-icon" /></div>
        </Link>

        <Link to="/game" className="nav-btn" aria-label="Game">
          <div className="nav-btn-circle"><img src={iconBoosts} alt="Boosts" className="nav-icon" /></div>
        </Link>

        <Link to="/invite" className="nav-btn" aria-label="Invite">
          <div className="nav-btn-circle"><img src={iconFriends} alt="Friends" className="nav-icon" /></div>
        </Link>

        <Link to="/tasks" className="nav-btn" aria-label="Tasks">
          <div className="nav-btn-circle"><img src={iconEarnCoins} alt="Earn Coins" className="nav-icon" /></div>
        </Link>
      </nav>

      {showUserInfo && (
        <div className="user-info-popup-overlay" onClick={closeUserInfo}>
          <div className="user-info-popup-compact" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={closeUserInfo}>×</button>

            <div className="popup-header-compact">
              <div className="popup-avatar-small">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={user.username} />
                ) : (
                  <div className="popup-avatar-placeholder-small">
                    {user?.first_name?.[0]?.toUpperCase() || '👤'}
                  </div>
                )}
              </div>
              <h4>{user?.first_name || 'Player'}</h4>
            </div>

            <div className="popup-content-compact">
              <div className="stat-compact">
                <span>🪙 {coins.toLocaleString()}</span>
                <span>💎 {gems.toLocaleString()}</span>
                <span>⭐ Lv.{currentLevel}</span>
              </div>
              <div className="stat-compact">
                <span>✅ {completedTasksCount} tasks</span>
                <span>👥 {invitedFriends} friends</span>
              </div>
              <div className="stat-compact">
                <span>🎁 {tapCount} taps today</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckin && (
        <DailyCheckIn onClose={() => setShowCheckin(false)} onClaim={handleCheckinClaim} />
      )}

      {showLevelProgress && (
        <LevelProgress user={user} onClose={() => setShowLevelProgress(false)} />
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
