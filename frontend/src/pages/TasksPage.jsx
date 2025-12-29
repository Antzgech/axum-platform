import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './TasksPage.css';

// Import social media logos (you'll need these in assets folder)
import youtubeIcon from '../assets/youtube-icon.png'; // Add these
import facebookIcon from '../assets/facebook-icon.png';
import tiktokIcon from '../assets/tiktok-icon.png';
import telegramIcon from '../assets/telegram-icon.png';
import instagramIcon from '../assets/instagram-icon.png';

function TasksPage({ user }) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTaskInfo, setShowTaskInfo] = useState(null);
  const [inviteLink, setInviteLink] = useState('');

  // Stats
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [availableTasks, setAvailableTasks] = useState(0);

  // User current level data
  const currentLevel = user?.current_level || 1;
  const invitedFriends = user?.invited_friends || 0;
  const levelRequirement = currentLevel * 5; // 5 friends per level

  useEffect(() => {
    fetchTasks();
    generateInviteLink();
  }, []);

  const generateInviteLink = () => {
    const botUsername = process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'SabaQuest_bot';
    const userId = user?.id || user?.telegram_id || '';
    const link = `https://t.me/${botUsername}?start=ref_${userId}`;
    setInviteLink(link);
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        calculateStats(data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tasksList) => {
    const completed = tasksList.filter(t => t.completed).length;
    const total = tasksList.length;
    const coins = tasksList.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);
    const available = total - completed;

    setCompletedTasks(completed);
    setTotalTasks(total);
    setCoinsEarned(coins);
    setAvailableTasks(available);
  };

  const handleCompleteTask = async (task) => {
    // Open social media link
    if (task.url) {
      window.open(task.url, '_blank');
    }
    
    // Wait for user to complete action
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('axum_token');
        const response = await fetch(`/api/tasks/${task.id}/complete`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          showNotification(`✅ Task completed! +${task.points} coins`);
          fetchTasks();
        }
      } catch (error) {
        console.error('Failed to complete task:', error);
        showNotification('❌ Failed to complete task');
      }
    }, 1500);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showNotification('✅ Invite link copied!');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`🏰 Join me on Queen Makeda's Quest!\n\nEarn rewards and complete challenges!\n\n`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, '_blank');
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'task-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const getTaskInfo = (task) => {
    const infos = {
      invite: `You need to invite ${levelRequirement} friends who join the app to complete Level ${currentLevel}. Currently: ${invitedFriends}/${levelRequirement}`,
      youtube: 'Subscribe to our YouTube channel and watch our latest videos to earn 20 coins.',
      facebook: 'Follow our Facebook page and engage with our community to earn 20 coins.',
      tiktok: 'Follow us on TikTok and watch our creative content to earn 20 coins.',
      telegram: 'Join our official Telegram group to stay updated and earn 30 coins.',
      instagram: 'Follow us on Instagram and see our latest posts to earn 20 coins.'
    };
    return infos[task.type] || 'Complete this task to earn coins.';
  };

  // Get the first 3 social tasks (excluding invite)
  const socialTasks = tasks.filter(t => t.type !== 'invite').slice(0, 3);

  return (
    <div className="tasks-page-clean">
      {/* Header */}
      <div className="tasks-header-clean">
        <div className="tasks-icon-header">📜</div>
        <h1 className="tasks-title-clean">Queen's Tasks</h1>
        <p className="tasks-subtitle-clean">Complete social quests to earn rewards</p>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-label">✅ Completed</div>
          <div className="stat-value">{completedTasks}/{totalTasks}</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-label">Earned 🪙</div>
          <div className="stat-value">{coinsEarned}</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-label">⚡ Available</div>
          <div className="stat-value">{availableTasks}</div>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="tasks-container-clean">
        {/* Invite Task - Special Top Row */}
        <div className="task-row invite-row">
          <div className="task-row-left">
            <div className="task-icon-wrapper">
              <span className="task-icon-large">👥</span>
            </div>
            <div className="task-info">
              <h3 className="task-name">Invite Friends</h3>
              <div className="task-progress">
                <span className="progress-text">{invitedFriends}/{levelRequirement}</span>
                <div className="progress-bar-mini">
                  <div 
                    className="progress-fill-mini" 
                    style={{ width: `${(invitedFriends / levelRequirement) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="task-row-right">
            <button 
              className={`task-action-btn ${invitedFriends >= levelRequirement ? 'completed' : ''}`}
              onClick={() => setShowInviteModal(true)}
            >
              {invitedFriends >= levelRequirement ? '✅ Joined' : 'Join'}
            </button>
            <button 
              className="info-btn"
              onClick={() => setShowTaskInfo('invite')}
            >
              ✨
            </button>
          </div>
        </div>

        {/* Social Media Tasks */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : (
          <>
            {socialTasks.map((task) => {
              const isCompleted = task.completed;
              const progress = isCompleted ? 1 : 0;
              const maxProgress = 1;

              return (
                <div key={task.id} className={`task-row ${isCompleted ? 'completed-row' : ''}`}>
                  <div className="task-row-left">
                    <div className="task-icon-wrapper">
                      {task.type === 'youtube' && <span className="task-icon-large">▶️</span>}
                      {task.type === 'facebook' && <span className="task-icon-large">👍</span>}
                      {task.type === 'tiktok' && <span className="task-icon-large">🎵</span>}
                      {task.type === 'telegram' && <span className="task-icon-large">✈️</span>}
                      {task.type === 'instagram' && <span className="task-icon-large">📸</span>}
                    </div>
                    <div className="task-info">
                      <h3 className="task-name">
                        {task.type === 'youtube' && 'YouTube'}
                        {task.type === 'facebook' && 'Facebook'}
                        {task.type === 'tiktok' && 'TikTok'}
                        {task.type === 'telegram' && 'Telegram'}
                        {task.type === 'instagram' && 'Instagram'}
                      </h3>
                      <div className="task-progress">
                        <span className="progress-text">
                          {progress}/{maxProgress} {isCompleted ? '✅' : '⚡'}
                        </span>
                        <span className="coins-earned">{isCompleted ? task.points : 0} 🪙</span>
                      </div>
                    </div>
                  </div>
                  <div className="task-row-right">
                    <button 
                      className={`task-action-btn ${isCompleted ? 'completed' : ''}`}
                      onClick={() => !isCompleted && handleCompleteTask(task)}
                      disabled={isCompleted}
                    >
                      {isCompleted ? 'Completed' : 'Start'}
                    </button>
                    <button 
                      className="info-btn"
                      onClick={() => setShowTaskInfo(task.type)}
                    >
                      ✨
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

     {/* Info Section */}
      <div className="tasks-info-section">
        <div className="info-card">
          <div className="info-icon">ℹ️</div>
          <h3>How Tasks Work</h3>
          <p>
            Complete social media tasks to earn coins and unlock new levels. 
            Each task rewards you with coins that count towards your progression.
          </p>
        </div>

        <div className="info-card">
          <div className="info-icon">⚡</div>
          <h3>Quick Tips</h3>
          <ul className="tips-list">
            <li>Complete all tasks to maximize your earnings</li>
            <li>Invite friends for bonus rewards</li>
            <li>Check back daily for new tasks</li>
            <li>Tasks are verified automatically</li>
          </ul>
        </div>
      </div>
    </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInviteModal(false)}>×</button>
            
            <div className="modal-header">
              <div className="modal-icon">👥</div>
              <h2>Invite Friends</h2>
              <p>Share your link and earn rewards!</p>
            </div>

            <div className="modal-body">
              <div className="invite-stats">
                <div className="invite-stat">
                  <div className="stat-number">{invitedFriends}</div>
                  <div className="stat-label">Friends Joined</div>
                </div>
                <div className="invite-stat">
                  <div className="stat-number">{levelRequirement}</div>
                  <div className="stat-label">Required for Level {currentLevel}</div>
                </div>
              </div>

              <div className="invite-link-box">
                <input 
                  type="text" 
                  value={inviteLink} 
                  readOnly 
                  className="invite-input"
                />
                <button className="copy-btn" onClick={handleCopyInviteLink}>
                  📋 Copy
                </button>
              </div>

              <button className="share-btn telegram" onClick={handleShareTelegram}>
                ✈️ Share on Telegram
              </button>

              <div className="rewards-box">
                <h4>🎁 Rewards</h4>
                <ul>
                  <li>💰 100 coins per friend who joins</li>
                  <li>🎯 Progress towards next level</li>
                  <li>👑 Special badges for top inviters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Info Modal */}
      {showTaskInfo && (
        <div className="modal-overlay" onClick={() => setShowTaskInfo(null)}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTaskInfo(null)}>×</button>
            
            <div className="info-modal-header">
              <div className="info-modal-icon">ℹ️</div>
              <h3>Task Information</h3>
            </div>

            <div className="info-modal-body">
              <p>{getTaskInfo({ type: showTaskInfo })}</p>
            </div>

            <button 
              className="close-info-btn" 
              onClick={() => setShowTaskInfo(null)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;
