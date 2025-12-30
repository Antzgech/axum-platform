// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Link } from 'react-router-dom';
import './DashboardPage.css';
import DailyCheckIn from '../components/DailyCheckIn';


// Assets
import queenMakeda from '../assets/queen-makeda.png';
import iconCoin from '../assets/icon-coin.png';
import iconGem from '../assets/icon-gem.png';
import iconGlobe from '../assets/icon-globe.png';
import iconStore from '../assets/icon-store.png';
import iconBoosts from '../assets/icon-boosts.png';
import iconFriends from '../assets/icon-friends.png';
import iconEarnCoins from '../assets/icon-earn-coins.png';

// Level system configuration
const LEVEL_REQUIREMENTS = {
  1: { name: "Novice Warrior", coinsNeeded: 1000, tasksNeeded: 3, friendsNeeded: 1, reward: { coins: 100, gems: 5 } },
  2: { name: "Skilled Fighter", coinsNeeded: 5000, tasksNeeded: 8, friendsNeeded: 3, reward: { coins: 500, gems: 10 } },
  3: { name: "Elite Guard", coinsNeeded: 15000, tasksNeeded: 15, friendsNeeded: 10, reward: { coins: 1500, gems: 25 } },
  4: { name: "Royal Commander", coinsNeeded: 50000, tasksNeeded: 25, friendsNeeded: 25, reward: { coins: 5000, gems: 50 } },
  5: { name: "Legendary Hero", coinsNeeded: 150000, tasksNeeded: 40, friendsNeeded: 50, reward: { coins: 15000, gems: 100 } },
  6: { name: "Queen's Champion", coinsNeeded: 500000, tasksNeeded: 60, friendsNeeded: 100, reward: { coins: 50000, gems: 250 } }
};

const STORAGE_KEYS = {
  LAST_RESET: 'makeda_last_reset',
  TAP_COUNT: 'makeda_tap_count',
  LAST_TAP: 'makeda_last_tap',
  NEXT_REWARD: 'makeda_next_reward',
  NEXT_COOLDOWN: 'makeda_next_cooldown'
};

export default function DashboardPage({ user = {}, fetchUser }) {
  const { language, changeLanguage } = useLanguage();

  const [coins, setCoins] = useState(user.coins || 0);
  const [gems, setGems] = useState(user.gems || 0);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [flyingCoins, setFlyingCoins] = useState([]);
  const [nextReward, setNextReward] = useState(2);
  const [nextCooldown, setNextCooldown] = useState(2);
  const [tapCount, setTapCount] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cooldownProgress, setCooldownProgress] = useState(0);
  const [canClaimReward, setCanClaimReward] = useState(true);

  const cooldownIntervalRef = useRef(null);
  const progressTimerRef = useRef(null);
  const userInfoTimerRef = useRef(null);
  const coinBoxRef = useRef(null);
  const makedaRef = useRef(null);

  const API_URL = 'https://axum-backend-production.up.railway.app';
  const avatarSrc = user.photo_url || queenMakeda;

  useEffect(() => {
    if (user.coins !== undefined) setCoins(user.coins);
    if (user.gems !== undefined) setGems(user.gems);
  }, [user]);

  useEffect(() => {
    initializeDailySystem();
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      if (userInfoTimerRef.current) clearTimeout(userInfoTimerRef.current);
    };
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
      const savedTapCount = parseInt(localStorage.getItem(STORAGE_KEYS.TAP_COUNT) || '0');
      const savedNextReward = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_REWARD) || '2');
      const savedNextCooldown = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_COOLDOWN) || '2');
      const savedLastTap = localStorage.getItem(STORAGE_KEYS.LAST_TAP);

      setTapCount(savedTapCount);
      setNextReward(savedNextReward);
      setNextCooldown(savedNextCooldown);

      if (savedLastTap) {
        const lastTapTime = parseInt(savedLastTap);
        const cooldownMs = savedNextCooldown * 60 * 1000;
        const timePassed = Date.now() - lastTapTime;
        
        if (timePassed < cooldownMs) {
          const remainingSec = Math.ceil((cooldownMs - timePassed) / 1000);
          const totalSec = savedNextCooldown * 60;
          const progress = ((totalSec - remainingSec) / totalSec) * 100;
          
          setCooldownRemaining(remainingSec);
          setCooldownProgress(progress);
          setCanClaimReward(false);
          startCooldownTimer(savedNextCooldown);
        } else {
          setCanClaimReward(true);
          setCooldownProgress(0);
        }
      }
    }
  };

  const startCooldownTimer = (cooldownMinutes) => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

    const totalSeconds = cooldownMinutes * 60;

    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          setCanClaimReward(true);
          setCooldownProgress(0);
          return 0;
        }
        const newRemaining = prev - 1;
        const progress = ((totalSeconds - newRemaining) / totalSeconds) * 100;
        setCooldownProgress(progress);
        return newRemaining;
      });
    }, 1000);
  };

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
        delay: i * 150
      });
    }

    setFlyingCoins(prev => [...prev, ...newCoins]);

    setTimeout(() => {
      setFlyingCoins(prev => prev.filter(coin => !newCoins.find(c => c.id === coin.id)));
    }, 1500 + (amount * 150));
  };

  const calculateProgress = () => {
    const currentLevel = user.current_level || 1;
    const levelReq = LEVEL_REQUIREMENTS[currentLevel];
    
    if (!levelReq) {
      return { level: currentLevel, name: "Max Level", isMaxLevel: true };
    }

    const completedTasks = user.completed_tasks?.length || 0;
    const invitedFriends = user.invited_friends || 0;
    const currentCoins = coins;

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


  
<button className="checkin-mini-btn" onClick={() => setShowCheckin(true)} > 📅 </button>
  const handleLanguageToggle = () => {
    setShowCheckin(true);
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };




  useEffect(() => {
  const lastCheckin = localStorage.getItem('last_checkin_date');
  const today = new Date().toDateString();

  // If user has not checked in today → auto-open after 2 seconds
  if (lastCheckin !== today) {
    setTimeout(() => {
      setShowCheckin(true);
    }, 2000);
  }
}, []);


  
  const handleNameClick = () => {
    setShowUserInfo(true);
    
    // Auto-hide after 3 seconds
    if (userInfoTimerRef.current) clearTimeout(userInfoTimerRef.current);
    userInfoTimerRef.current = setTimeout(() => {
      setShowUserInfo(false);
    }, 3000);
  };

  const closeUserInfo = () => {
    setShowUserInfo(false);
    if (userInfoTimerRef.current) clearTimeout(userInfoTimerRef.current);
  };

  const handleQueenTap = async () => {
    const progress = calculateProgress();
    setProgressData(progress);
    setShowProgress(true);

    // Auto-hide popup after 3 seconds
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => {
      setShowProgress(false);
    }, 3000);

    if (canClaimReward) {
      createFlyingCoins(nextReward);

      setTimeout(() => {
        giveCoinsToUser(nextReward);
      }, 800);

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

      const cooldownSec = newNextCooldown * 60;
      setCooldownRemaining(cooldownSec);
      setCooldownProgress(0);
      setCanClaimReward(false);
      startCooldownTimer(newNextCooldown);
    }
  };

  const giveCoinsToUser = async (amount) => {
    try {
      const token = localStorage.getItem("axum_token");
      if (!token) return;

      for (let i = 0; i < amount; i++) {
        const res = await fetch(`${API_URL}/api/user/add-coin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (i === amount - 1) {
            setCoins(data.coins);
            setGems(data.gems);
          }
        }
      }

      if (typeof fetchUser === "function") {
        fetchUser();
      }
    } catch (err) {
      console.error("Error giving coins:", err);
    }
  };

  const closeProgress = () => {
    setShowProgress(false);
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
  };

  const completedTasksCount = user?.completed_tasks?.length || 0;
  const invitedFriends = user?.invited_friends || 0;
  const currentLevel = user?.current_level || 1;

  return (
    <div className="saba-dashboard full-screen">
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
          <button className="lang-toggle-btn" onClick={handleLanguageToggle} aria-label="Toggle language" title={language === 'en' ? 'አማርኛ' : 'English'}>
            <img src={iconGlobe} alt="Language" className="lang-icon" />
          </button>
          <span className="axum-logo-emoji" role="img">⚜️</span>
        </div>
      </header>

      <div className="currency-row logo-style">
        <div className="currency-item logo-box" ref={coinBoxRef}>
          <img src={iconCoin} alt="Coins" className="currency-icon" />
          <div className="currency-value">{coins.toLocaleString()}</div>
        </div>

        <div className="currency-item logo-box">
          <img src={iconGem} alt="Gems" className="currency-icon" />
          <div className="currency-value">{gems}</div>
        </div>
      </div>

      <main className="queen-main-section">
        <div className="queen-oval-frame" ref={makedaRef}>
          {/* Cooldown progress ring */}
          <svg className="cooldown-progress-ring" viewBox="0 0 100 100">
            <circle
              className="progress-ring-bg"
              cx="50"
              cy="50"
              r="48"
            />
            <circle
              className="progress-ring-fill"
              cx="50"
              cy="50"
              r="48"
              style={{
                strokeDashoffset: 302 - (302 * cooldownProgress) / 100
              }}
            />
          </svg>

          <img
            src={queenMakeda}
            alt="Queen Makeda"
            className="queen-main-img floating"
            onClick={handleQueenTap}
            role="button"
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
              animationDelay: `${coin.delay}ms`
            }}
          >
            +1 🪙
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
                  <span className="req-text">{progressData.currentCoins.toLocaleString()} / {progressData.coinsNeeded.toLocaleString()}</span>
                  {progressData.coinsRemaining > 0 && (
                    <span className="req-remain-small">{progressData.coinsRemaining.toLocaleString()} left</span>
                  )}
                </div>

                <div className="req-compact">
                  <span className="req-icon-small">✅</span>
                  <span className="req-text">{progressData.completedTasks} / {progressData.tasksNeeded}</span>
                  {progressData.tasksRemaining > 0 && (
                    <span className="req-remain-small">{progressData.tasksRemaining} left</span>
                  )}
                </div>

                <div className="req-compact">
                  <span className="req-icon-small">👥</span>
                  <span className="req-text">{progressData.invitedFriends} / {progressData.friendsNeeded}</span>
                  {progressData.friendsRemaining > 0 && (
                    <span className="req-remain-small">{progressData.friendsRemaining} left</span>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </main>

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
                <span>💎 {gems}</span>
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
    </div>
  );
}
