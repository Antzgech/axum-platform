import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

function DashboardPage({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('axum_token');
        const response = await fetch('/api/user/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your journey...</p>
      </div>
    );
  }

  const currentLevel = stats?.currentLevel || 1;
  const totalPoints = stats?.totalPoints || 0;
  const username = user?.username || 'Traveler';

  return (
    <div className="dashboard-hamster-layout">
      {/* Top Bar */}
      <div className="top-bar">
        <span className="username">{username}</span>
        <span className="score">Score: {totalPoints}</span>
      </div>

      {/* Daily Challenges */}
      <div className="daily-challenges">
        <div className="challenge-card">🎁 Daily Reward</div>
        <div className="challenge-card">🧩 Daily Cipher</div>
        <div className="challenge-card">🔥 Daily Combo</div>
      </div>

      {/* Floating Queen */}
      <div className="queen-section">
        <div className="level-indicator">Level {currentLevel}</div>
        <div className="queen-avatar">👑</div>
        <div className="queen-label">Queen Makeda</div>
      </div>

      {/* Bottom Stats */}
      <div className="bottom-stats">
        <button className="boost-button">⚡ Boost</button>
        <div className="energy-bar">Energy: 1000 / 1000</div>
      </div>

      {/* Navigation */}
      <div className="nav-bar">
        <Link to="/exchange" className="nav-item">Exchange</Link>
        <Link to="/mine" className="nav-item">Mine</Link>
        <Link to="/tasks" className="nav-item">Tasks</Link>
        <Link to="/shop" className="nav-item">Shop</Link>
      </div>
    </div>
  );
}

export default DashboardPage;
