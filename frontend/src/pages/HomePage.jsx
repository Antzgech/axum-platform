// src/pages/HomePage.jsx - FIXED FOR TELEGRAM
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const API_URL = 'https://axum-backend-production.up.railway.app';

export default function HomePage({ setUser, language }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // Get user data from Telegram
      const user = tg.initDataUnsafe?.user;
      
      if (user) {
        console.log('Telegram user detected:', user);
        handleTelegramLogin(user);
      } else {
        console.log('No Telegram user data available');
      }
    }
  }, []);

  const handleTelegramLogin = async (telegramUser) => {
    try {
      console.log('Logging in with Telegram:', telegramUser);

      const response = await fetch(`${API_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: telegramUser.id,
          first_name: telegramUser.first_name || 'User',
          last_name: telegramUser.last_name || '',
          username: telegramUser.username || telegramUser.first_name || 'User',
          photo_url: telegramUser.photo_url || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login successful:', data);

        // Save token
        localStorage.setItem('axum_token', data.token);

        // Set user
        setUser(data.user);

        // Check if onboarding is complete
        const onboardingComplete = localStorage.getItem('axum_onboarding_complete');
        
        if (!onboardingComplete) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        console.error('Login failed:', response.status);
        alert('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Connection error. Please check your internet and try again.');
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

        <p className="home-info">
          Initializing Telegram Mini App...
        </p>
      </div>
    </div>
  );
}
