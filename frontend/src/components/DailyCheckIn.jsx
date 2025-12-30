// src/components/DailyCheckIn.jsx
import React, { useState, useEffect } from 'react';
import './DailyCheckIn.css';

const API_URL = 'https://axum-backend-production.up.railway.app';

export default function DailyCheckIn({ onClose, onClaim }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/checkin/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch check-in status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/checkin/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Daily check-in claimed!', data);
        
        if (onClaim) {
          onClaim(data);
        }

        // Show success message then close
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to claim');
      }
    } catch (error) {
      console.error('Failed to claim check-in:', error);
      alert('Failed to claim. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="checkin-overlay">
        <div className="checkin-modal">
          <div className="checkin-loading">Loading...</div>
        </div>
      </div>
    );
  }

  const dailyRewards = [
    { day: 1, coins: 10, gems: 0 },
    { day: 2, coins: 20, gems: 0 },
    { day: 3, coins: 30, gems: 1 },
    { day: 4, coins: 40, gems: 1 },
    { day: 5, coins: 50, gems: 2 },
    { day: 6, coins: 60, gems: 2 },
    { day: 7, coins: 100, gems: 5 },
  ];

  return (
    <div className="checkin-overlay" onClick={onClose}>
      <div className="checkin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="checkin-close" onClick={onClose}>×</button>

        <div className="checkin-header">
          <h2>📅 Daily Check-In</h2>
          <p className="checkin-subtitle">Login every day for amazing rewards!</p>
        </div>

        <div className="checkin-streak">
          <div className="streak-info">
            <span className="streak-icon">🔥</span>
            <span className="streak-number">{status?.streak || 0}</span>
            <span className="streak-label">Day Streak</span>
          </div>
          <div className="total-checkins">
            Total Check-ins: {status?.totalCheckins || 0}
          </div>
        </div>

        <div className="checkin-rewards">
          {dailyRewards.map((reward, index) => {
            const isToday = (status?.streak + 1) === reward.day || 
                           (status?.streak === 7 && reward.day === 1);
            const isClaimed = (status?.streak || 0) >= reward.day;
            const isLocked = !isToday && !isClaimed;

            return (
              <div 
                key={reward.day}
                className={`reward-day ${isToday ? 'today' : ''} ${isClaimed ? 'claimed' : ''} ${isLocked ? 'locked' : ''}`}
              >
                <div className="day-number">Day {reward.day}</div>
                <div className="day-rewards">
                  <div className="reward-item">🪙 {reward.coins}</div>
                  {reward.gems > 0 && (
                    <div className="reward-item">💎 {reward.gems}</div>
                  )}
                </div>
                {isClaimed && <div className="claimed-badge">✅</div>}
                {isToday && status?.canClaim && <div className="today-badge">TODAY</div>}
              </div>
            );
          })}
        </div>

        {status?.canClaim ? (
          <button 
            className="checkin-claim-btn"
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? 'Claiming...' : `Claim ${status?.nextRewards?.coins} 🪙 ${status?.nextRewards?.gems > 0 ? `+ ${status.nextRewards.gems} 💎` : ''}`}
          </button>
        ) : (
          <div className="checkin-claimed-message">
            ✅ Already claimed today!
            <br />
            <small>Come back tomorrow for Day {(status?.streak || 0) + 1}</small>
          </div>
        )}

        <div className="checkin-footer">
          <small>Don't break your streak! Login daily to maximize rewards.</small>
        </div>
      </div>
    </div>
  );
}
