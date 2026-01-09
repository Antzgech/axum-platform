// App.jsx — FINAL VERSION
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import InviteFriendsPage from "./pages/InviteFriendsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import GamePage from "./pages/GamePage";
import RewardsPage from "./pages/RewardsPage";

export default function App() {
  const [user, setUser] = useState(null);

  const isAuthenticated = !!localStorage.getItem("axum_token");

  return (
    <Router>
      <Routes>

        {/* Telegram login happens here */}
        <Route path="/" element={<HomePage setUser={setUser} />} />

        {/* Fallback for non-Telegram users */}
        <Route path="/auth" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardPage user={user} /> : <Navigate to="/auth" />}
        />

        <Route
          path="/tasks"
          element={isAuthenticated ? <TasksPage user={user} /> : <Navigate to="/auth" />}
        />

        <Route
          path="/invite"
          element={isAuthenticated ? <InviteFriendsPage user={user} /> : <Navigate to="/auth" />}
        />

        <Route
          path="/leaderboard"
          element={isAuthenticated ? <LeaderboardPage user={user} /> : <Navigate to="/auth" />}
        />

        <Route
          path="/game"
          element={isAuthenticated ? <GamePage user={user} /> : <Navigate to="/auth" />}
        />

        <Route
          path="/rewards"
          element={isAuthenticated ? <RewardsPage user={user} /> : <Navigate to="/auth" />}
        />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  );
}
