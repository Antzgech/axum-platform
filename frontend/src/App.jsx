import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import InviteFriendsPage from './pages/InviteFriendsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GamePage from './pages/GamePage';
import RewardsPage from './pages/RewardsPage';
import LoadingPage from './pages/LoadingPage';

const API_URL = 'https://axum-backend-production.up.railway.app';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeTelegramAuth();
  }, []);

  const initializeTelegramAuth = async () => {
    try {
      // Check if we're in Telegram WebApp
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        // Get user data from Telegram
        const initData = tg.initDataUnsafe;
        
        if (initData?.user) {
          const telegramUser = initData.user;
          
          // Authenticate with backend
          const response = await fetch(`${API_URL}/api/auth/telegram`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: telegramUser.id,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name || '',
              username: telegramUser.username || telegramUser.first_name,
              photo_url: telegramUser.photo_url || '',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Save token
            localStorage.setItem('axum_token', data.token);
            
            // Set user data
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            console.error('Authentication failed');
          }
        }
      } else {
        // Development mode - check for existing token
        const token = localStorage.getItem('axum_token');
        if (token) {
          await fetchUser(token);
        }
      }
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('axum_token')}`,
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
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Dashboard - Main page */}
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

          {/* Tasks Page */}
          <Route 
            path="/tasks" 
            element={
              isAuthenticated ? (
                <TasksPage user={user} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Invite Friends Page */}
          <Route 
            path="/invite" 
            element={
              isAuthenticated ? (
                <InviteFriendsPage user={user} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Game Page */}
          <Route 
            path="/game" 
            element={
              isAuthenticated ? (
                <GamePage user={user} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Leaderboard Page */}
          <Route 
            path="/leaderboard" 
            element={
              isAuthenticated ? (
                <LeaderboardPage user={user} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Rewards/Store Page */}
          <Route 
            path="/rewards" 
            element={
              isAuthenticated ? (
                <RewardsPage user={user} />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />

          {/* Auth fallback */}
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

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
