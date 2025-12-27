import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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

import LanguageSelector from './components/LanguageSelector';
import LoadingScreen from './components/LoadingScreen';

import './components/LanguageSelector.css';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(null);
  const [user, setUser] = useState(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // 1. Load language
      const savedLang = localStorage.getItem('axum_lang');
      if (savedLang) setLanguage(savedLang);

      // 2. Load onboarding state
      const onboardingComplete = localStorage.getItem('axum_onboarding_complete');
      setHasSeenOnboarding(!!onboardingComplete);

      // 3. Load user session
      try {
        const token = localStorage.getItem('axum_token');
        if (token) {
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('axum_token');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }

      // 4. End loading
      setTimeout(() => setLoading(false), 1200); // smooth loading animation
    };

    initializeApp();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('axum_onboarding_complete', 'true');
    setHasSeenOnboarding(true);
  };

  // -----------------------------
  // 1. Show loading screen first
  // -----------------------------
  if (loading) {
    return <LoadingScreen />;
  }

  // -----------------------------
  // 2. Show language selector if first time
  // -----------------------------
  if (!language) {
    return <LanguageSelector setLanguage={setLanguage} />;
  }

  // -----------------------------
  // 3. Normal app routing
  // -----------------------------
  return (
    <Router>
      <div className="app-container">
        {user && hasSeenOnboarding && <Navbar />}

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                !user ? (
                  <HomePage setUser={setUser} language={language} />
                ) : !hasSeenOnboarding ? (
                  <Navigate to="/onboarding" />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            <Route
              path="/onboarding"
              element={
                user && !hasSeenOnboarding ? (
                  <OnboardingPage onComplete={handleOnboardingComplete} />
                ) : (
                  <Navigate to={user ? '/dashboard' : '/'} />
                )
              }
            />

            <Route
              path="/dashboard"
              element={
                user && hasSeenOnboarding ? (
                  <DashboardPage user={user} language={language} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/game"
              element={
                user && hasSeenOnboarding ? (
                  <GamePage user={user} language={language} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/leaderboard"
              element={
                user && hasSeenOnboarding ? (
                  <LeaderboardPage language={language} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/rewards"
              element={
                user && hasSeenOnboarding ? (
                  <RewardsPage user={user} language={language} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/tasks"
              element={
                user && hasSeenOnboarding ? (
                  <TasksPage user={user} language={language} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/sponsors"
              element={
                user && hasSeenOnboarding ? (
                  <SponsorsPage language={language} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </main>

        {user && hasSeenOnboarding && <Footer />}
      </div>
    </Router>
  );
}

export default App;
