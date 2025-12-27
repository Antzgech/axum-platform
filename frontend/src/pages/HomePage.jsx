import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://axum-backend-production.up.railway.app';
const BOT_USERNAME = process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'SabaQuest_bot';
const COMPANY_NAME = process.env.REACT_APP_COMPANY_NAME || 'Sabawians Company';
const SUPPORT_EMAIL = process.env.REACT_APP_SUPPORT_EMAIL || 'sabawians@gmail.com';

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [telegramUser, setTelegramUser] = useState(null);
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    console.log('🚀 HomePage mounted');
    console.log('📡 API_URL:', API_URL);
    console.log('🤖 Bot:', BOT_USERNAME);
    
    checkTelegramEnvironment();
  }, []);

  const checkTelegramEnvironment = async () => {
    try {
      // Check if we're in Telegram WebApp
      const tg = window.Telegram?.WebApp;
      
      console.log('🔍 Checking Telegram environment...');
      console.log('Telegram object:', window.Telegram);
      console.log('WebApp object:', tg);
      
      if (tg && tg.initData) {
        console.log('✅ Running in Telegram WebApp');
        console.log('Init data:', tg.initData);
        console.log('User data:', tg.initDataUnsafe?.user);
        
        setIsInTelegram(true);
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        
        if (user && user.id) {
          console.log('👤 User detected:', user);
          setTelegramUser(user);
          
          // Auto-login immediately
          await handleTelegramAuth(user);
        } else {
          console.log('⚠️ No user data in Telegram');
          setLoading(false);
        }
      } else {
        console.log('❌ Not in Telegram WebApp - showing login button');
        setIsInTelegram(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Error checking Telegram:', err);
      setError('Failed to initialize');
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (user) => {
    try {
      console.log('🔐 Starting authentication...');
      console.log('User data:', user);
      
      const authData = {
        id: user.id,
        first_name: user.first_name || 'User',
        last_name: user.last_name || '',
        username: user.username || user.first_name || 'User',
        photo_url: user.photo_url || '',
        hash: 'webapp-auth'
      };

      console.log('📤 Sending auth request to:', `${API_URL}/api/auth/telegram`);
      console.log('Auth data:', authData);

      const response = await axios.post(`${API_URL}/api/auth/telegram`, authData);
      
      console.log('✅ Auth response:', response.data);

      if (response.data.success && response.data.token) {
        // Store token
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('✅ Token stored, redirecting to dashboard...');
        
        // Redirect to dashboard (or onboarding if needed)
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        console.error('❌ Auth failed: No token received');
        setError('Authentication failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Auth error:', err);
      console.error('Error details:', err.response?.data);
      setError(`Login failed: ${err.response?.data?.error || err.message}`);
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      console.log('🎮 Demo login clicked');
      
      // Create demo user
      const demoUser = {
        id: Math.floor(Math.random() * 1000000),
        first_name: 'Demo',
        last_name: 'User',
        username: 'demo_user',
        photo_url: '',
        hash: 'webapp-auth'
      };

      await handleTelegramAuth(demoUser);
    } catch (err) {
      console.error('Demo login error:', err);
      setError('Demo login failed');
    }
  };

  const handleTelegramLogin = () => {
    window.open(`https://t.me/${BOT_USERNAME}`, '_blank');
  };

  if (loading) {
    return (
      <div className="homepage">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading...</p>
          {telegramUser && <p>Logging in as {telegramUser.first_name}...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="title">
            <span className="gold">Queen Makeda's</span>
            <br />
            <span className="emerald">Quest</span>
          </h1>
          
          <p className="subtitle">
            Journey from Axum to Jerusalem
          </p>

          <p className="description">
            Embark on an epic adventure inspired by the legendary Queen of Sheba.
            Complete quests, earn rewards, and compete with players worldwide!
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>6 Epic Levels</h3>
              <p>Progress through increasingly challenging quests</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Real Rewards</h3>
              <p>Earn cash prizes and exclusive badges</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Leaderboards</h3>
              <p>Compete to become a finalist and win big</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Daily Tasks</h3>
              <p>Complete missions to earn points and level up</p>
            </div>
          </div>

          <div className="cta-section">
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => setError(null)}>Dismiss</button>
              </div>
            )}

            {!isInTelegram && (
              <>
                <button className="cta-button primary" onClick={handleTelegramLogin}>
                  <span className="button-icon">✈️</span>
                  Login with Telegram
                </button>
                <button className="cta-button secondary" onClick={handleDemoLogin}>
                  <span className="button-icon">🎮</span>
                  Try Demo Mode
                </button>
                <p className="helper-text">
                  For the best experience, open this game from Telegram bot: @{BOT_USERNAME}
                </p>
              </>
            )}
          </div>

          <div className="social-links">
            <h3>Follow {COMPANY_NAME}</h3>
            <div className="social-buttons">
              <a href={process.env.REACT_APP_YOUTUBE_URL || 'https://www.youtube.com/@metenofficial'} target="_blank" rel="noopener noreferrer" className="social-btn youtube">
                <span className="social-icon">▶️</span> YouTube
              </a>
              <a href={process.env.REACT_APP_TELEGRAM_GROUP_URL || 'https://t.me/+IoT_cwfs6EBjMTQ0'} target="_blank" rel="noopener noreferrer" className="social-btn telegram">
                <span className="social-icon">✈️</span> Telegram
              </a>
              <a href={process.env.REACT_APP_FACEBOOK_URL || 'https://facebook.com/profile.php?id=61578048881192'} target="_blank" rel="noopener noreferrer" className="social-btn facebook">
                <span className="social-icon">👍</span> Facebook
              </a>
              <a href={process.env.REACT_APP_TIKTOK_URL || 'https://tiktok.com/@metenofficials'} target="_blank" rel="noopener noreferrer" className="social-btn tiktok">
                <span className="social-icon">🎵</span> TikTok
              </a>
              <a href={process.env.REACT_APP_INSTAGRAM_URL || 'https://instagram.com/metenofficial'} target="_blank" rel="noopener noreferrer" className="social-btn instagram">
                <span className="social-icon">📸</span> Instagram
              </a>
            </div>
          </div>

          <footer className="homepage-footer">
            <p>Built with ⚔️ by {COMPANY_NAME}</p>
            <p>Support: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
