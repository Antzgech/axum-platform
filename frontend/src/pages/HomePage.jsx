import React, { useEffect, useState } from "react";
import "./HomePage.css";

const API_URL = process.env.REACT_APP_API_URL;
const BOT_USERNAME = process.env.REACT_APP_TELEGRAM_BOT_USERNAME;

function HomePage({ setUser }) {
  const [loading, setLoading] = useState(true);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initDataUnsafe?.user) {
      setIsInTelegram(true);
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe.user;
      authenticate(user);
    } else {
      setIsInTelegram(false);
      setLoading(false);
      initWidget();
    }
  }, []);

  const authenticate = async (user) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!res.ok) {
        setError("Authentication failed");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("axum_token", data.token);
      setUser(data.user);
    } catch (e) {
      setError("Network error");
      setLoading(false);
    }
  };

  const initWidget = () => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;

    const container = document.getElementById("telegram-login-container");
    if (container && !container.hasChildNodes()) {
      container.appendChild(script);
    }

    window.onTelegramAuth = (user) => authenticate(user);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {!isInTelegram && (
        <div>
          <h2>Login with Telegram</h2>
          <div id="telegram-login-container"></div>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default HomePage;
