// src/pages/LoginPage.jsx — FINAL VERSION (NO FIREBASE)
import React from "react";
import "../Login.css";

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome to Saba Quest</h1>
        <p className="login-subtitle">This game can only be opened inside Telegram.</p>

        <div className="login-info-box">
          <p>To begin your journey:</p>
          <p><strong>Open @SabaQuest_bot in Telegram</strong></p>
        </div>

        <a
          href="https://t.me/SabaQuest_bot"
          className="login-button"
          style={{ textAlign: "center", textDecoration: "none" }}
        >
          Open in Telegram
        </a>
      </div>
    </div>
  );
}
