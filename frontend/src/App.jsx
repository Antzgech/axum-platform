import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import RewardsPage from './pages/RewardsPage';
import TasksPage from './pages/TasksPage';
import './App.css';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const API_URL = 'https://axum-backend-production.up.railway.app';

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User loaded:', userData);
        setUser(userData);
      } else {
        localStorage.removeItem('axum_token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (telegramUser) => {
    try {
      console.log('🔐 Logging in with Telegram:', telegramUser);
      
      const response = await fetch(`${API_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(telegramUser)
      });

      if (!response.ok) {
        console.error('Login failed');
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('✅ Login successful');
      
      localStorage.setItem('axum_token', data.token);
      setUser(data.user);
      setLoading(false);
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const telegramUser = tg.initDataUnsafe?.user;
        
        if (telegramUser) {
          await handleTelegramAuth(telegramUser);
        } else {
          await fetchUser();
        }
      } else {
        await fetchUser();
      }
    };

    initApp();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <OnboardingPage onLogin={handleTelegramAuth} />;
  }

  return (
    <div className="app-container">
      {!isDashboard && <Navbar />}
      
      <main className={`main-content ${isDashboard ? 'dashboard-mode' : ''}`}>
        <Routes>
          <Route path="/" element={<DashboardPage user={user} fetchUser={fetchUser} />} />
          <Route path="/dashboard" element={<DashboardPage user={user} fetchUser={fetchUser} />} />
          <Route path="/game" element={<GamePage user={user} fetchUser={fetchUser} />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/rewards" element={<RewardsPage user={user} />} />
          <Route path="/tasks" element={<TasksPage user={user} fetchUser={fetchUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

export default App;
