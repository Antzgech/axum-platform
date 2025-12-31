import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

import LoadingPage from './components/LoadingPage';
import LanguageSelector from './components/LanguageSelector';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import RewardsPage from './pages/RewardsPage';
import TasksPage from './pages/TasksPage';
import SponsorsPage from './pages/SponsorsPage';
import InviteFriendsPage from './pages/InviteFriendsPage';

import './App.css';

function AppContent() {
  const { language, changeLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  const API_URL = 'https://axum-backend-production.up.railway.app';

  // Fetch user data
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const onboardingComplete = localStorage.getItem('axum_onboarding_complete');
        setHasSeenOnboarding(!!onboardingComplete);

        const token = localStorage.getItem('axum_token');
        if (token) {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('axum_token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setTimeout(() => setLoading(false), 1500);
      }
    };

    checkAuth();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('axum_onboarding_complete', 'true');
    setHasSeenOnboarding(true);
  };

  if (loading) return <LoadingPage />;
  if (!language) return <LanguageSelector onSelectLanguage={changeLanguage} />;

  return (
    <Router>
      <div className="app-container">
        {user && hasSeenOnboarding && <Navbar />}

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              !user ? <HomePage setUser={setUser} language={language} /> :
              !hasSeenOnboarding ? <Navigate to="/onboarding" /> :
              <Navigate to="/dashboard" />
            } />

            <Route path="/onboarding" element={
              user && !hasSeenOnboarding ?
              <OnboardingPage onComplete={handleOnboardingComplete} language={language} /> :
              <Navigate to={user ? "/dashboard" : "/"} />
            } />

            <Route path="/dashboard" element={
              user && hasSeenOnboarding ?
              <DashboardPage user={user} fetchUser={fetchUser} language={language} /> :
              <Navigate to="/" />
            } />

            <Route path="/game" element={
              user && hasSeenOnboarding ?
              <GamePage user={user} language={language} /> :
              <Navigate to="/" />
            } />

            <Route path="/leaderboard" element={
              user && hasSeenOnboarding ?
              <LeaderboardPage user={user} language={language} /> :
              <Navigate to="/" />
            } />

            <Route path="/rewards" element={
              user && hasSeenOnboarding ?
              <RewardsPage user={user} language={language} /> :
              <Navigate to="/" />
            } />

            <Route path="/tasks" element={
              user && hasSeenOnboarding ?
              <TasksPage user={user} language={language} /> :
              <Navigate to="/" />
            } />

            <Route path="/sponsors" element={
              user && hasSeenOnboarding ?
              <SponsorsPage language={language} /> :
              <Navigate to="/" />
            } />

            <Route path="/invite" element={
              user && hasSeenOnboarding ?
              <InviteFriendsPage user={user} language={language} /> :
              <Navigate to="/" />
            } />
          </Routes>
        </main>

        {user && hasSeenOnboarding && <Footer />}
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
