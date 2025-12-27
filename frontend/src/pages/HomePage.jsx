import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [telegramUser, setTelegramUser] = useState(null);

  // Auto-login when component mounts
  useEffect(() => {
    attemptAutoLogin();
  }, []);

  const attemptAutoLogin = async () => {
    try {
      console.log('🔍 Checking for auto-login...');

      // Method 1: Check if running inside Telegram WebApp
      if (window.Telegram?.WebApp) {
        console.log('✅ Telegram WebApp detected');
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe?.user;
        
        if (user) {
          console.log('👤 User data from Telegram:', user);
          setTelegramUser(user);
          await handleTelegramAuth(user, 'webapp-auth');
          return;
        }
      }

      // Method 2: Check for existing token
      const existingToken = localStorage.getItem('authToken');
      if (existingToken) {
        console.log('🔑 Found existing token, verifying...');
        const isValid = await verifyToken(existingToken);
        if (isValid) {
          console.log('✅ Token valid, redirecting to dashboard');
          navigate('/dashboard');
          return;
        } else {
          console.log('❌ Token invalid, clearing...');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }

      // No auto-login available
      console.log('ℹ️ No auto-login method available');
      setLoading(false);
    } catch (error) {
      console.error('❌ Auto-login error:', error);
      setError('Auto-login failed. Please use the login button.');
      setLoading(false);
    }
  };

  const verifyToken = async (token) => {
    try {
      const response = await fetch('https://axum-backend-production.up.railway.app/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  const handleTelegramAuth = async (userData, hashType = 'webapp-auth') => {
    try {
      setLoading(true);
      console.log('🔐 Authenticating with backend...');

      const authPayload = {
        id: userData.id,
        first_name: userData.first_name || 'User',
        last_name: userData.last_name || '',
        username: userData.username || '',
        photo_url: userData.photo_url || '',
        auth_date: Math.floor(Date.now() / 1000),
        hash: hashType
      };

      console.log('📤 Sending auth request:', authPayload);

      const response = await fetch('https://axum-backend-production.up.railway.app/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authPayload)
      });

      const data = await response.json();
      console.log('📥 Auth response:', data);

      if (data.success && data.token) {
        console.log('✅ Authentication successful!');
        
        // Store token and user data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success message briefly
        setError(null);
        
        // Navigate to onboarding or dashboard
        setTimeout(() => {
          const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
          if (hasSeenOnboarding) {
            navigate('/dashboard');
          } else {
            navigate('/onboarding');
          }
        }, 500);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setError(`Login failed: ${error.message}`);
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoUser = {
      id: Math.floor(Math.random() * 1000000),
      first_name: 'Demo User',
      username: 'demo_user',
      photo_url: ''
    };
    await handleTelegramAuth(demoUser, 'auto-login');
  };

  const handleManualTelegramLogin = () => {
    // This will be called by the Telegram Login Widget
    window.onTelegramAuth = (user) => {
      handleTelegramAuth(user, user.hash);
    };
  };

  // Loading screen
  if (loading) {
    return (
      <div className="home-page loading-screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>🔐 Connecting to Sabawians Quest...</h2>
          <p>Authenticating with Telegram</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="brand-logo">⚔️</div>
          <h1 className="hero-title">Queen Makeda's Quest</h1>
          <p className="hero-subtitle">
            Join the legendary journey from Axum to Jerusalem
          </p>
          <p className="hero-description">
            Complete quests, earn rewards, and compete with players worldwide
          </p>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="cta-buttons">
            {/* Telegram Login Button - Only show if not in WebApp */}
            {!window.Telegram?.WebApp && (
              <>
                <div className="telegram-login-wrapper">
                  <script 
                    async 
                    src="https://telegram.org/js/telegram-widget.js?22"
                    data-telegram-login="SabaQuest_bot"
                    data-size="large"
                    data-onauth="onTelegramAuth(user)"
                    data-request-access="write"
                  ></script>
                </div>
                <div className="divider">OR</div>
              </>
            )}
            
            <button className="btn-demo" onClick={handleDemoLogin}>
              🎮 Try Demo Mode
            </button>
          </div>

          {window.Telegram?.WebApp && (
            <div className="webapp-notice">
              <p>✨ You're using Telegram WebApp!</p>
              <p>Auto-login should happen automatically</p>
            </div>
          )}
        </div>

        <div className="hero-image">
          <div className="animated-icon">👑</div>
          <div className="subtitle-text">Sabawians Company</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Join the Quest?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>6 Epic Levels</h3>
            <p>Progress through Queen Makeda's legendary journey</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Real Rewards</h3>
            <p>Earn cash prizes, badges, and exclusive perks</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Compete & Win</h3>
            <p>Climb leaderboards and become a finalist</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌟</div>
            <h3>Social Growth</h3>
            <p>Connect on YouTube, Instagram, TikTok & more</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Login via Telegram</h3>
            <p>Quick & secure authentication</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Complete Quests</h3>
            <p>Subscribe, follow, and invite friends</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Earn Points</h3>
            <p>Progress through 6 exciting levels</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Win Rewards</h3>
            <p>Top players earn amazing prizes</p>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="social-media">
        <h2>Join Our Community</h2>
        <div className="social-links">
          <a href="https://www.youtube.com/@metenofficial" target="_blank" rel="noopener noreferrer" className="social-link youtube">
            <span className="icon">▶️</span>
            <span>YouTube</span>
          </a>
          <a href="https://t.me/+IoT_cwfs6EBjMTQ0" target="_blank" rel="noopener noreferrer" className="social-link telegram">
            <span className="icon">✈️</span>
            <span>Telegram</span>
          </a>
          <a href="https://facebook.com/profile.php?id=61578048881192" target="_blank" rel="noopener noreferrer" className="social-link facebook">
            <span className="icon">👍</span>
            <span>Facebook</span>
          </a>
          <a href="https://tiktok.com/@metenofficials" target="_blank" rel="noopener noreferrer" className="social-link tiktok">
            <span className="icon">🎵</span>
            <span>TikTok</span>
          </a>
          <a href="https://instagram.com/metenofficial" target="_blank" rel="noopener noreferrer" className="social-link instagram">
            <span className="icon">📸</span>
            <span>Instagram</span>
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat">
          <div className="stat-number">6</div>
          <div className="stat-label">Epic Levels</div>
        </div>
        <div className="stat">
          <div className="stat-number">30</div>
          <div className="stat-label">Finalists</div>
        </div>
        <div className="stat">
          <div className="stat-number">💰</div>
          <div className="stat-label">Real Prizes</div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Ready to Begin Your Quest?</h2>
        <p>Join thousands of players on Queen Makeda's legendary journey</p>
        <button className="btn-primary" onClick={handleDemoLogin}>
          Start Playing Now
        </button>
        <p className="company-info">Powered by Sabawians Company</p>
      </section>

      {/* Inline Styles */}
      <style jsx>{`
        .loading-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
        }

        .loading-content {
          text-align: center;
          padding: 2rem;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(212, 175, 55, 0.1);
          border-top: 4px solid var(--gold-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: rgba(139, 26, 26, 0.2);
          border: 1px solid #8B1A1A;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
          color: #ff6b6b;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .telegram-login-wrapper {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
        }

        .divider {
          color: var(--text-secondary);
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .btn-demo {
          background: linear-gradient(135deg, #D4AF37 0%, #F4E4B8 100%);
          color: #000;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-demo:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(212, 175, 55, 0.3);
        }

        .webapp-notice {
          background: rgba(30, 95, 62, 0.2);
          border: 1px solid #1E5F3E;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .webapp-notice p {
          margin: 0.5rem 0;
          color: #4ade80;
        }

        .company-info {
          margin-top: 1rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

// Setup Telegram callback
if (typeof window !== 'undefined') {
  window.onTelegramAuth = function(user) {
    console.log('Telegram auth callback triggered:', user);
    // This will be handled by the component
  };
}

export default HomePage;
