import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage';
import InviteFriendsPage from './pages/InviteFriendsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GamePage from './pages/GamePage';
import RewardsPage from './pages/RewardsPage';
import LoadingPage from './pages/LoadingPage';

// API URL (with fallback)
const API_URL = process.env.REACT_APP_API_URL || "https://axum-backend-production.up.railway.app";
console.log("API URL:", API_URL);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Full-screen fix for all devices
  useEffect(() => {
    const handleResize = () => {
      document.body.style.height = `${window.innerHeight}px`;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user from backend using token
  const fetchUser = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('axum_token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      setIsAuthenticated(false);
    }
  }, []);

  // Telegram authentication flow
  const initializeTelegramAuth = useCallback(async () => {
    try {
      const isLocal = window.location.hostname === "localhost";

      // Local demo mode
      if (isLocal) {
        const demoUser = {
          id: 999999,
          first_name: "Demo",
          last_name: "User",
          username: "demo_user",
          photo_url: "",
          auth_date: Date.now(),
          hash: "demo",
        };

        const response = await fetch(`${API_URL}/api/auth/telegram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(demoUser),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('axum_token', data.token);
          setUser(data.user);
          setIsAuthenticated(true);
          return;
        }
      }

      // Real Telegram Mini App mode
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const initData = tg.initDataUnsafe;

        if (initData?.user) {
          const telegramUser = initData.user;

          const response = await fetch(`${API_URL}/api/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: telegramUser.id,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name || '',
              username: telegramUser.username || telegramUser.first_name,
              photo_url: telegramUser.photo_url || '',
              auth_date: initData.auth_date,
              hash: initData.hash,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('axum_token', data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            return;
          }
        }
      }

      // Fallback: check stored token
      const token = localStorage.getItem('axum_token');
      if (token) {
        await fetchUser(token);
      }

    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    initializeTelegramAuth();
  }, [initializeTelegramAuth]);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>

          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <DashboardPage user={user} fetchUser={fetchUser} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          <Route path="/tasks" element={isAuthenticated ? <TasksPage user={user} /> : <Navigate to="/auth" replace />} />
          <Route path="/invite" element={isAuthenticated ? <InviteFriendsPage user={user} /> : <Navigate to="/auth" replace />} />
          <Route path="/game" element={isAuthenticated ? <GamePage user={user} /> : <Navigate to="/auth" replace />} />
          <Route path="/leaderboard" element={isAuthenticated ? <LeaderboardPage user={user} /> : <Navigate to="/auth" replace />} />
          <Route path="/rewards" element={isAuthenticated ? <RewardsPage user={user} /> : <Navigate to="/auth" replace />} />

          <Route 
            path="/auth" 
            element={
              <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg, #8B6F47, #4A3622)',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div>
                  <h1>⚜️ Queen Makeda's Quest</h1>
                  <p>Please open this app through Telegram</p>
                  <p style={{ marginTop: '20px', fontSize: '0.9rem', opacity: 0.7 }}>
                    Search for @SabaQuest_bot in Telegram
                  </p>
                </div>
              </div>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
