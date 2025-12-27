import React, { useState, useEffect } from 'react';
import './HomePage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const BOT_USERNAME = process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'SabaQuest_bot';

function HomePage({ setUser }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    console.log('🏠 HomePage loaded');
    console.log('📡 API_URL:', API_URL);
    console.log('🤖 Bot:', BOT_USERNAME);
    
    checkTelegramEnvironment();
  }, []);

  const checkTelegramEnvironment = async () => {
    try {
      // Check if we're in Telegram WebApp
      const tg = window.Telegram?.WebApp;
      
      console.log('🔍 Checking Telegram...');
      console.log('Telegram object:', window.Telegram);
      console.log('WebApp object:', tg);
      
      if (tg && tg.initData) {
        console.log('✅ Inside Telegram WebApp');
        setIsInTelegram(true);
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        
        if (user && user.id) {
          console.log('👤 User detected:', user);
          await handleTelegramAuth(user);
        } else {
          console.log('⚠️ No user data');
          setLoading(false);
        }
      } else {
        console.log('❌ Not in Telegram - showing login button');
        setIsInTelegram(false);
        setLoading(false);
        initTelegramLoginWidget();
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Failed to initialize');
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (user) => {
    try {
      console.log('🔐 Authenticating...');
      
      const authData = {
        id: user.id,
        first_name: user.first_name || 'User',
        last_name: user.last_name || '',
        username: user.username || user.first_name || 'User',
        photo_url: user.photo_url || '',
        hash: 'webapp-auth'
      };

      console.log('📤 Sending to:', `${API_URL}/api/auth/telegram`);

      const response = await fetch(`${API_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });

      console.log('📥 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auth success:', data);
        
        localStorage.setItem('axum_token', data.token);
        setUser(data.user);
      } else {
        const errorData = await response.json();
        console.error('❌ Auth failed:', errorData);
        setError('Authentication failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Auth error:', err);
      setError(`Login failed: ${err.message}`);
      setLoading(false);
    }
  };

  const initTelegramLoginWidget = () => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    const loginContainer = document.getElementById('telegram-login-container');
    if (loginContainer && !loginContainer.hasChildNodes()) {
      loginContainer.appendChild(script);
    }

    window.onTelegramAuth = async (user) => {
      await handleTelegramAuth(user);
    };
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-hero">
          <div className="hero-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading Axum...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-background"></div>
        
        <div className="hero-content">
          <div className="hero-icon-large">⚜️</div>
          
          <h1 className="hero-title">
            <span className="title-line">WELCOME TO</span>
            <span className="title-main">AXUM</span>
          </h1>
          
          <p className="hero-subtitle">
            Join Queen Makeda's quest to find the wisest and most courageous
          </p>
          
          <div className="hero-description">
            <p>
              In the ancient land of Saba, Queen Makeda seeks worthy companions 
              for her legendary journey to Jerusalem. Prove your wisdom and courage 
              through challenges, earn divine rewards, and compete for the honor 
              of joining her quest.
            </p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {!isInTelegram && (
            <div className="login-section">
              <div className="login-card">
                <h2 className="login-title">Begin Your Journey</h2>
                <p className="login-text">
                  Connect your Telegram account to enter the realm of Axum
                </p>
                <div id="telegram-login-container" className="telegram-login"></div>
                <p className="helper-text">
                  Or open from @{BOT_USERNAME} in Telegram for instant access
                </p>
              </div>
            </div>
          )}

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🎮</span>
              <h3 className="feature-title">6 Epic Levels</h3>
              <p className="feature-text">
                Progress through challenges that test your dedication and skill
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">👑</span>
              <h3 className="feature-title">Compete & Rise</h3>
              <p className="feature-text">
                Climb the leaderboard and become one of the chosen 30 finalists
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">💎</span>
              <h3 className="feature-title">Win Rewards</h3>
              <p className="feature-text">
                Earn cash, points, badges, and exclusive sponsor benefits
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">📜</span>
              <h3 className="feature-title">Complete Tasks</h3>
              <p className="feature-text">
                Subscribe, follow, share, and invite to gather points
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="sponsors-preview">
        <div className="sponsors-container">
          <h2 className="sponsors-title">Supported By</h2>
          <div className="sponsors-logos">
            <div className="sponsor-placeholder">Sabawians Company</div>
            <div className="sponsor-placeholder">Meten Official</div>
            <div className="sponsor-placeholder">Partner 2</div>
            <div className="sponsor-placeholder">Partner 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
