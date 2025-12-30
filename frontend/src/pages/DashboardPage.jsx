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
  const [coins, setCoins] = useState(user.coins ?? 0);
  const [gems, setGems] = useState(user.gems ?? 0);
  const [addingCoin, setAddingCoin] = useState(false);

  // Makeda hint
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState('');
  const hideTimerRef = useRef(null);

  const avatarSrc = user.photo_url || queenMakeda;

  const API_URL = 'https://axum-backend-production.up.railway.app';

  // Toggle language
  const handleLanguageToggle = () => {
    const next = language === 'en' ? 'am' : 'en';
    changeLanguage(next);
  };

  // ⭐ PLUS BUTTON - Add 1 coin manually
  async function handlePlusClick(e) {
    e.stopPropagation();
    
    if (addingCoin) return;

    setAddingCoin(true);
    
    // Optimistically update UI
    const previousCoins = coins;
    setCoins(prev => prev + 1);

    try {
      const token = localStorage.getItem("axum_token"); // ← FIXED: was "token"

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
        // Update with real values from server
        setCoins(data.coins);
        setGems(data.gems);

        console.log('✅ Coin added! Total:', data.coins);

        // Refresh full user object
        if (typeof fetchUser === "function") {
          fetchUser();
        }
      } else {
        // Revert on error
        setCoins(previousCoins);
        console.error('Failed to add coin:', data);
      }
    } catch (err) {
      // Revert on error
      setCoins(previousCoins);
      console.error("Plus button error:", err);
      alert('Failed to add coin. Check console for details.');
    } finally {
      setAddingCoin(false);
    }
  }

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
    const previousCoins = coins;
    setCoins(prev => prev + 1);

    try {
      const token = localStorage.getItem("axum_token"); // ← FIXED: was "token"

      const res = await fetch(`${API_URL}/api/user/add-coin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        // Update UI with server values
        setCoins(data.coins);
        setGems(data.gems);

        // Refresh full user object from DB
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
    </div>
  );
}
