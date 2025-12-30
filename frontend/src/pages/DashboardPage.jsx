import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext'; // Kept for logic if needed
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

export default function DashboardPage({ user = {}, fetchUser }) {
  // --- Core State ---
  const [coins, setCoins] = useState(user.coins ?? 0);
  const [gems, setGems] = useState(user.gems ?? 0);
  const [flyingCoins, setFlyingCoins] = useState([]);

  // --- Popups & UI ---
  const [showCheckin, setShowCheckin] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [alreadyCheckedInMsg, setAlreadyCheckedInMsg] = useState(false);

  // --- Cooldown Logic ---
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownPercent, setCooldownPercent] = useState(0);
  const cooldownDuration = 60000; // 1 Minute Cooldown
  const timerRef = useRef(null);

  // --- 1. Initial Load & Auto Check-In (20 Second delay) ---
  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheckin = localStorage.getItem('last_checkin_date');

    if (lastCheckin !== today) {
      const autoTimer = setTimeout(() => {
        setShowCheckin(true);
      }, 20000);
      return () => clearTimeout(autoTimer);
    }
  }, []);

  // Sync UI when user object updates
  useEffect(() => {
    if (user.coins !== undefined) setCoins(user.coins);
    if (user.gems !== undefined) setGems(user.gems);
  }, [user]);

  // --- 2. 🌐 Button: Daily Check-In Logic ---
  const handleCheckInTrigger = () => {
    const today = new Date().toDateString();
    const lastCheckin = localStorage.getItem('last_checkin_date');

    if (lastCheckin === today) {
      setAlreadyCheckedInMsg(true);
      setTimeout(() => setAlreadyCheckedInMsg(false), 3000);
    } else {
      setShowCheckin(true);
    }
  };

  const handleCheckinClaim = (data) => {
    localStorage.setItem('last_checkin_date', new Date().toDateString());
    if (data.rewards) {
      setCoins(prev => prev + data.rewards.coins);
      setGems(prev => prev + data.rewards.gems);
    }
    if (typeof fetchUser === "function") fetchUser();
    setTimeout(() => setShowCheckin(false), 2000);
  };

  // --- 3. Makeda Tap: Coins & Cooldown ---
  const handleQueenTap = async (e) => {
    if (isCooldown) {
      setShowProgress(true);
      return;
    }

    // Flying Coin Animation
    const id = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const newCoin = { id, x: e.clientX, y: e.clientY };
    setFlyingCoins(prev => [...prev, newCoin]);
    setTimeout(() => setFlyingCoins(prev => prev.filter(c => c.id !== id)), 1200);

    // Start Cooldown Visuals
    setIsCooldown(true);
    let start = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      let elapsed = Date.now() - start;
      let p = Math.min((elapsed / cooldownDuration) * 100, 100);
      setCooldownPercent(p);
      if (elapsed >= cooldownDuration) {
        clearInterval(timerRef.current);
        setIsCooldown(false);
        setCooldownPercent(0);
      }
    }, 100);

    // API Call
    try {
      const token = localStorage.getItem("axum_token");
      const res = await fetch("https://axum-backend-production.up.railway.app/api/user/add-coin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCoins(data.coins);
        if (typeof fetchUser === "function") fetchUser();
      }
    } catch (err) {
      console.error("Makeda tap error:", err);
    }
  };

  return (
    <div className="saba-dashboard full-screen">
      {/* Flying Coins Layer */}
      {flyingCoins.map(c => (
        <div key={c.id} className="flying-coin" style={{ '--start-x': `${c.x}px`, '--start-y': `${c.y}px` }}>
          <img src={iconCoin} className="flying-coin-icon" alt="" />
          <span className="flying-coin-text">+1</span>
        </div>
      ))}

      {/* Header */}
      <header className="top-block">
        <div className="top-left" onClick={() => setShowUserInfo(true)}>
          <div className="avatar-circle">
            <img src={user.photo_url || queenMakeda} className="avatar-img" alt="User" />
          </div>
          <div className="player-name-box">
            <span className="player-name">{user.username || 'PLAYER'}</span>
          </div>
        </div>

        <div className="top-right">
          <button className="lang-toggle-btn globe-checkin" onClick={handleCheckInTrigger}>
            <img src={iconGlobe} alt="Check-in" className="lang-icon" />
            {alreadyCheckedInMsg && <div className="already-toast">✔️ Done!</div>}
          </button>
          <span className="axum-logo-emoji">⚜️</span>
        </div>
      </header>

      {/* Currency Row */}
      <div className="currency-row logo-style">
        <div className="currency-item logo-box">
          <img src={iconCoin} alt="Coins" className="currency-icon" />
          <div className="currency-value">{coins.toLocaleString()}</div>
        </div>
        <div className="currency-item logo-box">
          <img src={iconGem} alt="Gems" className="currency-icon" />
          <div className="currency-value">{gems}</div>
        </div>
      </div>

      {/* Makeda & Cooldown Ring */}
      <main className="queen-main-section">
        <div className="queen-oval-frame">
          <svg className="cooldown-progress-oval" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="48" ry="48" className="progress-oval-bg" />
            <ellipse 
              cx="50" cy="50" rx="48" ry="48" 
              className="progress-oval-fill"
              style={{ strokeDashoffset: 301 - (301 * cooldownPercent) / 100 }}
            />
          </svg>
          <img
            src={queenMakeda}
            alt="Queen Makeda"
            className={`queen-main-img floating ${isCooldown ? 'on-cooldown' : ''}`}
            onClick={handleQueenTap}
          />
        </div>

        {showProgress && (
          <aside className="progress-popover-compact">
            <button className="close-hint-btn" onClick={() => setShowProgress(false)}>×</button>
            <div className="progress-header-compact"><h4>Energy Status</h4></div>
            <div className="progress-content-compact">
              <div className="req-compact">
                <span className="req-text">Recharging Royal Energy...</span>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav-bar">
        <Link to="/rewards" className="nav-btn"><div className="nav-btn-circle"><img src={iconStore} className="nav-icon" /></div></Link>
        <Link to="/game" className="nav-btn"><div className="nav-btn-circle"><img src={iconBoosts} className="nav-icon" /></div></Link>
        <Link to="/dashboard" className="nav-btn"><div className="nav-btn-circle"><img src={iconFriends} className="nav-icon" /></div></Link>
        <Link to="/tasks" className="nav-btn"><div className="nav-btn-circle"><img src={iconEarnCoins} className="nav-icon" /></div></Link>
      </nav>

      {/* Popups */}
      {showUserInfo && (
        <div className="user-info-popup-overlay" onClick={() => setShowUserInfo(false)}>
          <div className="user-info-popup-compact" onClick={e => e.stopPropagation()}>
            <button className="close-popup" onClick={() => setShowUserInfo(false)}>×</button>
            <div className="popup-header-compact">
              <div className="popup-avatar-small"><img src={user.photo_url || queenMakeda} alt="" /></div>
              <h4>{user.username}</h4>
            </div>
            <div className="popup-content-compact">
              <div className="stat-compact"><span>Rank: Axumite</span><span>Level: {user.level || 1}</span></div>
            </div>
          </div>
        </div>
      )}

      {showCheckin && (
        <DailyCheckIn onClose={() => setShowCheckin(false)} onClaim={handleCheckinClaim} />
      )}
    </div>
  );
}
