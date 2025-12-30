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

export default function DashboardPage({ user = {}, fetchUser }) {
  const { language, changeLanguage } = useLanguage();

  // UI state (always synced with DB)
  const [coins, setCoins] = useState(user.coins ?? 0);
  const [gems, setGems] = useState(user.gems ?? 0);

  // Makeda hint
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState('');
  const hideTimerRef = useRef(null);

  // Daily Check-In
  const [showCheckin, setShowCheckin] = useState(false);

  const avatarSrc = user.photo_url || queenMakeda;

  // Check if user needs to check in today
  useEffect(() => {
    const checkDailyCheckin = () => {
      const lastCheckin = localStorage.getItem('last_checkin_date');
      const today = new Date().toDateString();
      
      // If different day or never checked in, show modal after 2 seconds
      if (lastCheckin !== today) {
        setTimeout(() => {
          setShowCheckin(true);
        }, 2000);
      }
    };
    
    checkDailyCheckin();
  }, []);

  // Toggle language
  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  // ⭐ When Makeda is tapped → show hint + add 1 coin to DB
  async function handleQueenTap() {
    // Show hint popup
    setHintText('Complete 3 battles\nCollect 10,000 coins\nFinish 5 tasks');
    setHintVisible(true);

    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setHintVisible(false);
      hideTimerRef.current = null;
    }, 3000);

    // ⭐ Add 1 coin to database
    try {
      const token = localStorage.getItem("axum_token");

      const res = await fetch("https://axum-backend-production.up.railway.app/api/user/add-coin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        // Update UI instantly
        setCoins(data.coins);
        setGems(data.gems);

        // Refresh full user object from DB
        if (typeof fetchUser === "function") {
          fetchUser();
        }
      }
    } catch (err) {
      console.error("Makeda coin error:", err);
    }
  }

  // Handle daily check-in claim
  const handleCheckinClaim = (data) => {
    console.log('✅ Daily check-in claimed!', data);
    
    // Save today's date so modal doesn't show again
    localStorage.setItem('last_checkin_date', new Date().toDateString());
    
    // Update coins/gems in UI
    if (data.rewards) {
      setCoins(prev => prev + data.rewards.coins);
      setGems(prev => prev + data.rewards.gems);
    }
    
    // Refresh user data from server
    if (typeof fetchUser === "function") {
      fetchUser();
    }
    
    // Close modal after 2 seconds
    setTimeout(() => {
      setShowCheckin(false);
    }, 2000);
  };

  // Sync UI when user object updates
  useEffect(() => {
    if (user.coins !== undefined) setCoins(user.coins);
    if (user.gems !== undefined) setGems(user.gems);
  }, [user]);

  return (
    <div className="saba-dashboard full-screen">
      {/* Header */}
      <header className="top-block" role="banner">
        <div className="top-left">
          <div className="avatar-circle">
            <img src={avatarSrc} alt={user.username || 'PLAYER'} className="avatar-img" />
          </div>
          <div className="player-name-box">
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
          
          {/* Check-In Button (optional - can be removed if you want auto-popup only) */}
          <button
            className="checkin-mini-btn"
            onClick={() => setShowCheckin(true)}
            title="Daily Check-In"
          >
            📅
          </button>
          
          <span className="axum-logo-emoji" role="img">⚜️</span>
        </div>
      </header>

      {/* Coins & Gems */}
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

      {/* Daily Check-In Modal */}
      {showCheckin && (
        <DailyCheckIn 
          onClose={() => setShowCheckin(false)}
          onClaim={handleCheckinClaim}
        />
      )}
    </div>
  );
}
