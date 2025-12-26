import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initDataUnsafe?.user) {
      const telegramUser = tg.initDataUnsafe.user;

      fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramUser),
      })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            localStorage.setItem('axum_token', data.token);
            setUser(data.user);
            navigate('/dashboard');
          }
        });

      return;
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'SabaQuest_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    const loginContainer = document.getElementById('telegram-login-container');
    if (loginContainer) loginContainer.appendChild(script);

    window.onTelegramAuth = async (user) => {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      const data = await response.json();
      localStorage.setItem('axum_token', data.token);
      setUser(data.user);
      navigate('/dashboard');
    };

    return () => {
      window.onTelegramAuth = null;
    };
  }, [setUser, navigate]);

  return (
    <div className="home-page">
      <div id="telegram-login-container"></div>
    </div>
  );
}

export default HomePage;
