// src/pages/HomePage.jsx – CLEAN & FIXED FOR TELEGRAM AUTH
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const API_URL = "https://axum-backend-production.up.railway.app";

export default function HomePage({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      console.log("Telegram WebApp not detected");
      return;
    }

    tg.ready();
    tg.expand();

    const user = tg.initDataUnsafe?.user;

    if (user) {
      console.log("Telegram user detected:", user);
      handleTelegramLogin(tg);
    } else {
      console.log("No Telegram user data available");
    }
  }, []);

  const handleTelegramLogin = async (tg) => {
    try {
      const user = tg.initDataUnsafe?.user;

      const payload = {
        id: user.id,
        first_name: user.first_name || "User",
        last_name: user.last_name || "",
        username: user.username || user.first_name || "User",
        photo_url: user.photo_url || "",
        auth_date: tg.initDataUnsafe.auth_date,
        hash: tg.initDataUnsafe.hash,
      };

      console.log("Sending Telegram login payload:", payload);

      const response = await fetch(`${API_URL}/api/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Login failed:", response.status);
        alert("Login failed. Please try again.");
        return;
      }

      const data = await response.json();
      console.log("✅ Login successful:", data);

      localStorage.setItem("axum_token", data.token);
      setUser(data.user);

      const onboardingComplete = localStorage.getItem("axum_onboarding_complete");

      if (!onboardingComplete) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
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
