import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // 1️⃣ Check if running inside Telegram WebApp
    if (tg && tg.initDataUnsafe?.user) {
      const telegramUser = tg.initDataUnsafe.user;

      console.log("Telegram WebApp user:", telegramUser);

      // 2️⃣ Authenticate with backend
      fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramUser),
      })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            // 3️⃣ Save token + user
            localStorage.setItem('axum_token', data.token);
            setUser(data.user);

            // 4️⃣ Navigate to onboarding or dashboard
            navigate('/onboarding');
          }
        })
        .catch(err => console.error("Auth error:", err));

      return; // Stop here — no widget needed
    }

    // 5️⃣ Fallback: Browser mode → show Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'SabaQuest_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    const loginContainer = document.getElementById('telegram-login-container');
    if (loginContainer) loginContainer.appendChild(script);

    window.onTelegramAuth = async (user) => {
      try {
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('axum_token', data.token);
          setUser(data.user);
          navigate('/onboarding');
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    };

    return () => {
      window.onTelegramAuth = null;
    };
  }, [setUser, navigate]);

  return (
    <div className="home-page">
      {/* Your existing UI stays the same */}
      <div className="login-section">
        <div className="login-card">
          <h2 className="login-title">Begin Your Journey</h2>
          <p className="login-text">Connect your Telegram account to enter the realm of Axum</p>
          <div id="telegram-login-container" className="telegram-login"></div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
