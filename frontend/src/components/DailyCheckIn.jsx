import React, { useState, useEffect } from 'react';
import './DailyCheckIn.css';

const API_URL = 'https://axum-backend-production.up.railway.app';

const DAILY_REWARDS = {
  1: { coins: 10, gems: 0, bonus: "Welcome back!" },
  2: { coins: 20, gems: 0, bonus: "Day 2!" },
  3: { coins: 30, gems: 1, bonus: "3 day streak!" },
  4: { coins: 40, gems: 1, bonus: "Keep it up!" },
  5: { coins: 50, gems: 2, bonus: "5 days strong!" },
  6: { coins: 60, gems: 2, bonus: "Almost there!" },
  7: { coins: 100, gems: 5, bonus: "🎉 Week Complete!" }
};

export default function DailyCheckIn({ user, onClose, onClaimSuccess }) {
  const [checkinStatus, setCheckinStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);

  useEffect(() => {
    fetchCheckinStatus();
  }, []);

  const fetchCheckinStatus = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/checkin/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCheckinStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch check-in status:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    setClaiming(true);

    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/checkin/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClaimedReward(data.rewards);
        setShowReward(true);
        
        setTimeout(() => {
          onClaimSuccess?.();
          onClose();
        }, 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
      alert('Failed to claim reward. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content checkin-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (showReward && claimedReward) {
    return (
      <div className="modal-overlay">
        <div className="modal-content checkin-modal reward-modal" onClick={(e) => e.stopPropagation()}>
          <div className="reward-celebration">
            <h2>🎉 Reward Claimed!</h2>
            <div className="reward-items">
              <div className="reward-item">
                <span className="reward-icon">🪙</span>
                <span className="reward-amount">+{claimedReward.coins}</span>
              </div>
              {claimedReward.gems > 0 && (
                <div className="reward-item">
                  <span className="reward-icon">💎</span>
                  <span className="reward-amount">+{claimedReward.gems}</span>
                </div>
              )}
            </div>
            <p className="reward-message">{claimedReward.bonus}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStreak = checkinStatus?.streak || 0;
  const nextDay = ((currentStreak % 7) || 0) + 1;
  const nextReward = DAILY_REWARDS[nextDay];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checkin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="checkin-header">
          <h2>🎁 Daily Check-In</h2>
          <p className="checkin-subtitle">Claim your daily reward!</p>
        </div>

        <div className="streak-display">
          <div className="streak-icon">🔥</div>
          <div className="streak-info">
            <span className="streak-label">Current Streak</span>
            <span className="streak-value">{currentStreak} days</span>
          </div>
        </div>

        <div className="weekly-calendar">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const reward = DAILY_REWARDS[day];
            const isClaimed = currentStreak >= day && (currentStreak % 7 >= day || currentStreak % 7 === 0);
            const isCurrent = day === nextDay && checkinStatus?.canClaim;
            
            return (
              <div 
                key={day} 
                className={`calendar-day ${isClaimed ? 'claimed' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="day-number">Day {day}</div>
                <div className="day-reward">
                  {isClaimed && <span className="check-mark">✓</span>}
                  {!isClaimed && (
                    <>
                      <span>🪙 {reward.coins}</span>
                      {reward.gems > 0 && <span>💎 {reward.gems}</span>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {checkinStatus?.canClaim ? (
          <div className="claim-section">
            <div className="next-reward">
              <h3>Today's Reward</h3>
              <div className="reward-display">
                <span className="reward-value">🪙 {nextReward.coins}</span>
                {nextReward.gems > 0 && (
                  <span className="reward-value">💎 {nextReward.gems}</span>
                )}
              </div>
            </div>
            <button 
              className="claim-btn" 
              onClick={claimReward}
              disabled={claiming}
            >
              {claiming ? 'Claiming...' : 'Claim Reward'}
            </button>
          </div>
        ) : (
          <div className="already-claimed">
            <p>✅ Already checked in today!</p>
            <p className="come-back">Come back tomorrow for:</p>
            <div className="tomorrow-reward">
              <span>🪙 {nextReward.coins}</span>
              {nextReward.gems > 0 && <span>💎 {nextReward.gems}</span>}
            </div>
          </div>
        )}

        <div className="checkin-stats">
          <div className="stat">
            <span className="stat-icon">📅</span>
            <span>Total Check-ins: {checkinStatus?.totalCheckins || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
