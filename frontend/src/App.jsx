import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

  // Check if we're on dashboard
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  // Fetch user data
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User data loaded:', userData);
        setUser(userData);
      } else {
        console.error('Failed to fetch user data');
        localStorage.removeItem('axum_token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Telegram login
  const handleTelegramAuth = async (telegramUser) => {
    try {
      console.log('🔐 Logging in with Telegram:', telegramUser);
      
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramUser)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login successful:', data);
        
        localStorage.setItem('axum_token', data.token);
        setUser(data.user);
        
        // Check for referral
        await checkReferral(telegramUser.id);
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Check referral on login
  const checkReferral = async (telegramId) => {
    try {
      // Get referrer from Telegram WebApp initData or URL params
      const urlParams = new URLSearchParams(window.location.search);
      const startParam = urlParams.get('tgWebAppStartParam');
      
      let referredBy = null;
      if (startParam && startParam.startsWith('ref_')) {
        referredBy = startParam.replace('ref_', '');
      }

      if (referredBy) {
        console.log(`🔗 Checking referral: ${telegramId} referred by ${referredBy}`);
        
        const response = await fetch('/api/referral/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: telegramId,
            referred_by: referredBy
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log('✅ Referral processed:', data);
          }
        }
      }
    } catch (error) {
      console.error('Referral check error:', error);
    }
  };

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      // Try to get Telegram WebApp user
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const telegramUser = tg.initDataUnsafe?.user;
        if (telegramUser) {
          await handleTelegramAuth(telegramUser);
        } else {
          // No Telegram user, check for token
          await fetchUser();
        }
      } else {
        // Not in Telegram, check for token
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
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
