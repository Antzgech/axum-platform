// src/pages/LeaderboardPage.jsx
import React, { useState, useEffect } from 'react';
import './LeaderboardPage.css';

const API_URL = 'https://axum-backend-production.up.railway.app';

export default function LeaderboardPage({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      
      // Try to fetch from backend
      const response = await fetch(`${API_URL}/api/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        processLeaderboard(data.leaderboard || []);
      } else {
        // Fallback to mock data if endpoint doesn't exist yet
        createMockLeaderboard();
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      createMockLeaderboard();
    } finally {
      setLoading(false);
    }
  };

  const processLeaderboard = (data) => {
    const withRanks = data.map((player, index) => ({
      rank: index + 1,
      username: player.username || player.first_name || 'Player',
      level: player.current_level || 1,
      coins: player.coins || 0,
      tasks: player.completed_tasks?.length || 0,
      isYou: player.telegram_id === user?.telegram_id
    }));

    setLeaderboard(withRanks);
    
    const myEntry = withRanks.find(p => p.isYou);
    if (myEntry) {
      setMyRank(myEntry.rank);
    }
  };

  const createMockLeaderboard = () => {
    // Show real user data + sample players
    const mockData = [
      {
        rank: 1,
        username: user?.username || user?.first_name || 'You',
        level: user?.current_level || 1,
        coins: user?.coins || 0,
        tasks: user?.completed_tasks?.length || 0,
        isYou: true
      },
      { rank: 2, username: 'Abebe', level: 1, coins: 850, tasks: 2, isYou: false },
      { rank: 3, username: 'Tigist', level: 1, coins: 720, tasks: 5, isYou: false },
      { rank: 4, username: 'Yohannes', level: 1, coins: 650, tasks: 3, isYou: false },
      { rank: 5, username: 'Selamawit', level: 1, coins: 480, tasks: 4, isYou: false },
    ];

    setLeaderboard(mockData);
    setMyRank(1);
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="loading">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p className="subtitle">Top Warriors of Axum</p>
        {myRank && (
          <div className="my-rank">
            Your Rank: <span className="rank-badge">#{myRank}</span>
          </div>
        )}
      </div>

      <div className="leaderboard-list">
        {leaderboard.map((player, index) => (
          <div 
            key={index}
            className={`leaderboard-item ${player.isYou ? 'is-you' : ''} ${index < 3 ? `top-${index + 1}` : ''}`}
          >
            <div className="rank-section">
              {index === 0 && <span className="trophy">🥇</span>}
              {index === 1 && <span className="trophy">🥈</span>}
              {index === 2 && <span className="trophy">🥉</span>}
              {index > 2 && <span className="rank-number">#{player.rank}</span>}
            </div>

            <div className="player-info">
              <div className="player-name">
                {player.username}
                {player.isYou && <span className="you-badge">YOU</span>}
              </div>
              <div className="player-stats">
                <span className="stat">⭐ Lv.{player.level}</span>
                <span className="stat">🪙 {player.coins.toLocaleString()}</span>
                <span className="stat">✅ {player.tasks}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="leaderboard-footer">
        <small>Updated in real-time • Complete tasks to climb!</small>
      </div>
    </div>
  );
}
