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
  const rank = stats?.globalRank || '--';
  const badges = stats?.badges || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-top">
        <h1 className="dashboard-greeting">Welcome, {user?.first_name || 'Traveler'}</h1>
        <p className="dashboard-subtext">Level {currentLevel} • {totalPoints} pts • Rank #{rank}</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-emoji">⚔️</div>
          <div className="stat-label">Points</div>
          <div className="stat-value">{totalPoints.toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-emoji">🎮</div>
          <div className="stat-label">Level</div>
          <div className="stat-value">{currentLevel}</div>
        </div>
        <div className="stat-box">
          <div className="stat-emoji">👑</div>
          <div className="stat-label">Rank</div>
          <div className="stat-value">#{rank}</div>
        </div>
        <div className="stat-box">
          <div className="stat-emoji">💎</div>
          <div className="stat-label">Badges</div>
          <div className="stat-value">{badges.length}</div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/tasks" className="action-button">📜</Link>
        <Link to="/leaderboard" className="action-button">👑</Link>
        <Link to="/rewards" className="action-button">💰</Link>
        <Link to="/game" className="action-button">🚀</Link>
      </div>

      <div className="dashboard-footer">
        <p className="footer-text">Queen Makeda awaits. Complete tasks to rise in rank.</p>
      </div>
    </div>
  );
}

export default DashboardPage;
