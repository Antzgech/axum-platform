import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
// Import other pages when ready
// import OnboardingPage from './pages/OnboardingPage';
// import DashboardPage from './pages/DashboardPage';
// import GamePage from './pages/GamePage';
// import LeaderboardPage from './pages/LeaderboardPage';
// import TasksPage from './pages/TasksPage';
// import RewardsPage from './pages/RewardsPage';
// import SponsorsPage from './pages/SponsorsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Uncomment when pages are ready */}
        {/* <Route path="/onboarding" element={<OnboardingPage />} /> */}
        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        {/* <Route path="/game" element={<GamePage />} /> */}
        {/* <Route path="/leaderboard" element={<LeaderboardPage />} /> */}
        {/* <Route path="/tasks" element={<TasksPage />} /> */}
        {/* <Route path="/rewards" element={<RewardsPage />} /> */}
        {/* <Route path="/sponsors" element={<SponsorsPage />} /> */}
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
