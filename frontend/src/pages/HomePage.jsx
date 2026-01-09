// src/pages/HomePage.jsx – FINAL PRODUCTION VERSION
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const API_URL = process.env.REACT_APP_API_URL || "https://axum-backend-production.up.railway.app";

export default function HomePage({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    const init = tg.initDataUnsafe;
    if (init?.user) {
      handleTelegramLogin(init);
    }
  }, []);

  const handleTelegramLogin = async (init) => {
    try {
      const u = init.user;

      const payload = {
        id: u.id,
        first_name: u.first_name || "User",
        last_name: u.last_name || "",
        username: u.username || u.first_name || "User",
        photo_url: u.photo_url || "",
        auth_date: init.auth_date,
        hash: init.hash,
      };

      const response = await fetch(`${API_URL}/api/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        alert("Login failed. Please try again.");
        return;
      }

      const data = await response.json();
      localStorage.setItem("axum_token", data.token);
      setUser(data.user);

      const onboardingComplete = localStorage.getItem("axum_onboarding_complete");
      navigate(onboardingComplete ? "/dashboard" : "/onboarding");
    } catch (err) {
      console.error("Telegram login error:", err);
      alert("Connection error. Please try again.");
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">⚜️ Axum Kingdom ⚜️</h1>
        <p className="home-subtitle">Loading your quest...</p>

        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>

        <p className="home-info">Initializing Telegram Mini App...</p>
      </div>
    </div>
  );
}
