import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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

import './App.css';

function AppContent() {
  const { language, changeLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const location = useLocation();

  // Check if we're on dashboard page
  const isDashboard = location.pathname === '/dashboard';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const onboardingComplete = localStorage.getItem('axum_onboarding_complete');
        setHasSeenOnboarding(!!onboardingComplete);

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
    <div className="app-container">
      {/* Hide Navbar on Dashboard */}
      {user && hasSeenOnboarding && !isDashboard && <Navbar />}

      <main className={isDashboard ? "" : "main-content"}>
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
            <DashboardPage user={user} language={language} /> :
            <Navigate to="/" />
          } />

          <Route path="/game" element={
            user && hasSeenOnboarding ?
            <GamePage user={user} language={language} /> :
            <Navigate to="/" />
          } />

          <Route path="/leaderboard" element={
            user && hasSeenOnboarding ?
            <LeaderboardPage language={language} /> :
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
        </Routes>
      </main>

      {/* Hide Footer on Dashboard */}
      {user && hasSeenOnboarding && !isDashboard && <Footer />}
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppWrapper />
    </LanguageProvider>
  );
}

export default App;
