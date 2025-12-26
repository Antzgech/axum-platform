import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [debug, setDebug] = useState({ telegram: false, user: null });

  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();

    const navigateAfterAuth = (data) => {
      if (!data?.token) return;
      localStorage.setItem('axum_token', data.token);
      localStorage.setItem('axum_user', JSON.stringify(data.user));
      navigate('/dashboard');
    };

    const authenticate = async (telegramUser) => {
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramUser),
        });
        if (!res.ok) {
          console.error('Auth failed:', res.status);
          return;
        }
        const data = await res.json();
        if (!cancelled) navigateAfterAuth(data);
      } catch (err) {
        console.error('Auth error:', err);
      }
    };

    const injectWidget = () => {
      const loginContainer = document.getElementById('telegram-login-container');
      if (!loginContainer || loginContainer.dataset.widgetInjected) return;
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'YourBotUsername'); // replace with your bot username
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.async = true;
      loginContainer.appendChild(script);
      loginContainer.dataset.widgetInjected = 'true';

      window.onTelegramAuth = async (user) => {
        try {
          const r = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
          });
          const d = await r.json();
          navigateAfterAuth(d);
        } catch (e) {
          console.error('Widget auth error', e);
        }
      };
    };

    const pollForTelegram = () => {
      const tg = window.Telegram?.WebApp;
      setDebug({ telegram: !!window.Telegram, user: window.Telegram?.WebApp?.initDataUnsafe?.user || null });

      if (tg && tg.initDataUnsafe?.user) {
        authenticate(tg.initDataUnsafe.user);
        return;
      }

      if (Date.now() - startTime < 5000) {
        setTimeout(pollForTelegram, 200);
        return;
      }

      injectWidget();
    };

    pollForTelegram();

    return () => {
      cancelled = true;
      window.onTelegramAuth = null;
    };
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ position: 'fixed', top: 8, right: 8, background: '#0008', color: '#fff', padding: 8, borderRadius: 6 }}>
        Telegram injected: {String(debug.telegram)} {debug.user ? `| user:${debug.user.id}` : ''}
      </div>

      <h1>WELCOME TO AXUM</h1>
      <p>Join Queen Makeda's quest</p>

      <div id="telegram-login-container" style={{ marginTop: 20 }} />

      <p style={{ marginTop: 20 }}>
        If you opened this inside Telegram the app should authenticate automatically.
      </p>
    </div>
  );
}
