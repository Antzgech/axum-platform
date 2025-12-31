// src/components/LevelProgress.jsx
import React from 'react';
import './LevelProgress.css';

const LEVEL_REQUIREMENTS = {
  1: { name: "Novice Warrior", coinsNeeded: 1000, tasksNeeded: 3, friendsNeeded: 1, reward: { coins: 100, gems: 5 } },
  2: { name: "Skilled Fighter", coinsNeeded: 5000, tasksNeeded: 8, friendsNeeded: 3, reward: { coins: 500, gems: 10 } },
  3: { name: "Elite Guard", coinsNeeded: 15000, tasksNeeded: 15, friendsNeeded: 10, reward: { coins: 1500, gems: 25 } },
  4: { name: "Royal Commander", coinsNeeded: 50000, tasksNeeded: 25, friendsNeeded: 25, reward: { coins: 5000, gems: 50 } },
  5: { name: "Legendary Hero", coinsNeeded: 150000, tasksNeeded: 40, friendsNeeded: 50, reward: { coins: 15000, gems: 100 } },
  6: { name: "Queen's Champion", coinsNeeded: 500000, tasksNeeded: 60, friendsNeeded: 100, reward: { coins: 50000, gems: 250 } }
};

export default function LevelProgress({ user, onClose }) {
  const currentLevel = user?.current_level || 1;
  const levelReq = LEVEL_REQUIREMENTS[currentLevel];
  
  if (!levelReq) {
    return (
      <div className="level-progress-overlay" onClick={onClose}>
        <div className="level-progress-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          <div className="level-header">
            <h2>🏆 MAX LEVEL REACHED!</h2>
            <p>You're the Champion of Axum!</p>
          </div>
        </div>
      </div>
    );
  }

  const currentCoins = user?.coins || 0;
  const completedTasks = user?.completed_tasks?.length || 0;
  const invitedFriends = user?.invited_friends || 0;

  const coinsProgress = Math.min(100, (currentCoins / levelReq.coinsNeeded) * 100);
  const tasksProgress = Math.min(100, (completedTasks / levelReq.tasksNeeded) * 100);
  const friendsProgress = Math.min(100, (invitedFriends / levelReq.friendsNeeded) * 100);

  const allComplete = currentCoins >= levelReq.coinsNeeded && 
                      completedTasks >= levelReq.tasksNeeded && 
                      invitedFriends >= levelReq.friendsNeeded;

  return (
    <div className="level-progress-overlay" onClick={onClose}>
      <div className="level-progress-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="level-header">
          <h2>⭐ Level {currentLevel}</h2>
          <p className="level-name">{levelReq.name}</p>
        </div>

        <div className="requirements-section">
          <h3>Requirements to Level Up:</h3>
          
          <div className="requirement">
            <div className="req-header">
              <span className="req-icon">🪙</span>
              <span className="req-title">Collect Coins</span>
              <span className="req-count">
                {currentCoins.toLocaleString()} / {levelReq.coinsNeeded.toLocaleString()}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${coinsProgress}%` }}
              />
            </div>
          </div>

          <div className="requirement">
            <div className="req-header">
              <span className="req-icon">✅</span>
              <span className="req-title">Complete Tasks</span>
              <span className="req-count">
                {completedTasks} / {levelReq.tasksNeeded}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${tasksProgress}%` }}
              />
            </div>
          </div>

          <div className="requirement">
            <div className="req-header">
              <span className="req-icon">👥</span>
              <span className="req-title">Invite Friends</span>
              <span className="req-count">
                {invitedFriends} / {levelReq.friendsNeeded}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${friendsProgress}%` }}
              />
            </div>
          </div>
        </div>

        {allComplete && (
          <div className="level-up-ready">
            🎉 Ready to Level Up! 🎉
            <div className="next-level-reward">
              Reward: 🪙 {levelReq.reward.coins} + 💎 {levelReq.reward.gems}
            </div>
          </div>
        )}

        {!allComplete && (
          <div className="level-up-hint">
            <small>Complete all requirements to unlock Level {currentLevel + 1}</small>
          </div>
        )}
      </div>
    </div>
  );
}
