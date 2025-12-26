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
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('axum_onboarding_complete');
    setHasSeenOnboarding(!!onboardingComplete);

    const token = localStorage.getItem('axum_token');
    if (token) {
      setUser({ token });
    }

    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="app-container">
        {user && hasSeenOnboarding && <Navbar />}

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              !user ? <HomePage setUser={setUser} /> :
              !hasSeenOnboarding ? <Navigate to="/onboarding" /> :
              <Navigate to="/dashboard" />
            } />

            <Route path="/onboarding" element={
              user && !hasSeenOnboarding ?
              <OnboardingPage onComplete={() => {
                localStorage.setItem('axum_onboarding_complete', 'true');
                setHasSeenOnboarding(true);
              }} /> :
              <Navigate to="/" />
            } />

            <Route path="/dashboard" element={
              user ? <DashboardPage user={user} /> : <Navigate to="/" />
            } />

            <Route path="/game" element={
              user ? <GamePage user={user} /> : <Navigate to="/" />
            } />

            <Route path="/leaderboard" element={
              user ? <LeaderboardPage /> : <Navigate to="/" />
            } />

            <Route path="/rewards" element={
              user ? <RewardsPage user={user} /> : <Navigate to="/" />
            } />

            <Route path="/tasks" element={
              user ? <TasksPage user={user} /> : <Navigate to="/" />
            } />

            <Route path="/sponsors" element={
              user ? <SponsorsPage /> : <Navigate to="/" />
            } />
          </Routes>
        </main>

        {user && hasSeenOnboarding && <Footer />}
      </div>
    </Router>
  );
}

export default App;
