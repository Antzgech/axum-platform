import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './TasksPage.css';
 
function TasksPage({ user, fetchUser }) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  
  // Calculate stats
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const earnedCoins = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);
  const availableTasks = tasks.filter(t => !t.completed).length;

  // User invite data
  const currentLevel = user?.current_level || 1;
  const invitedFriends = user?.invited_friends || 0;
  const levelRequirement = currentLevel * 5; // 5 friends per level

  useEffect(() => {
    fetchTasks();
    generateInviteLink();
  }, []);

  const generateInviteLink = () => {
    const botUsername = process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'SabaQuest_bot';
    const userId = user?.telegram_id || user?.id || '';
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
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (task) => {
    if (task.completed) return;

    // Open social media link
    if (task.url) {
      window.open(task.url, '_blank');
    }
    
    // Wait 5 seconds (trust system - user has time to subscribe)
    showNotification(`⏳ Opening ${task.title}... Complete the action!`);
    
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
          const data = await response.json();
          showNotification(`✅ Task completed! +${task.points} coins earned!`);
          
          // Refresh tasks and user data
          fetchTasks();
          if (fetchUser) fetchUser();
        } else {
          showNotification('❌ Task already completed or error occurred');
        }
      } catch (error) {
        console.error('Failed to complete task:', error);
        showNotification('❌ Failed to complete task');
      }
    }, 5000); // 5 second delay
  };

  const handleInvite = () => {
    const text = encodeURIComponent(
      `🏰 Join me on Queen Makeda's Quest!\n\n` +
      `Earn coins, complete challenges, and climb the leaderboard!\n\n` +
      `Tap the link to start your adventure:`
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, 
      '_blank'
    );
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

  const getTaskButtonText = (task) => {
    const buttonText = {
      youtube: 'Subscribe',
      telegram: 'Join',
      facebook: 'Follow',
      tiktok: 'Follow',
      instagram: 'Follow',
      invite: 'INVITE'
    };
    return buttonText[task.type] || 'Start';
  };

  const getTaskInfo = (taskType) => {
    const info = {
      invite: `Invite ${levelRequirement} friends to complete Level ${currentLevel}. You've invited ${invitedFriends} so far. Each friend who joins earns you 100 coins!`,
      youtube: `Subscribe to our YouTube channel to earn 20 coins. Click Subscribe, then confirm your subscription on YouTube.`,
      telegram: `Join our Telegram group to stay updated and earn 30 coins. Click Join, then confirm in Telegram.`,
      facebook: `Follow our Facebook page to earn 20 coins. Click Follow, then confirm on Facebook.`,
      tiktok: `Follow us on TikTok to earn 30 coins. Click Follow, then confirm on TikTok.`,
      instagram: `Follow us on Instagram to earn 20 coins. Click Follow, then confirm on Instagram.`
    };
    return info[taskType] || 'Complete this task to earn coins.';
  };

  // Separate invite task from social tasks
  const inviteTask = {
    id: 'invite',
    type: 'invite',
    title: 'Invite Friends',
    points: 100,
    completed: invitedFriends >= levelRequirement,
    icon: '👥'
  };

  const socialTasks = tasks.filter(t => t.type !== 'invite');

  return (
    <div className="tasks-page-final">
      {/* Header */}
      <div className="tasks-header-final">
        <div className="header-icon">📜</div>
        <h1 className="header-title">Queen's Tasks</h1>
        <p className="header-subtitle">Complete social quests to earn rewards</p>
      </div>

      {/* Stats Row */}
      <div className="stats-bar">
        <div className="stat-box">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{completedTasks}/{totalTasks}</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <div className="stat-label">Earned 🪙</div>
          <div className="stat-value">{earnedCoins}</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <div className="stat-label">⚡ Available</div>
          <div className="stat-value">{availableTasks}</div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-list">
        {/* Invite Task - Special */}
        <div className="task-item invite-task">
          <div className="task-left">
            <div className="task-icon-circle">
              <span className="task-emoji">{inviteTask.icon}</span>
            </div>
            <div className="task-details">
              <h3 className="task-name">{inviteTask.title}</h3>
              <div className="task-status">
                <span className="status-text">
                  {invitedFriends >= levelRequirement ? '✅' : '⚡'} {invitedFriends}/{levelRequirement}
                </span>
                <div className="progress-bar-tiny">
                  <div 
                    className="progress-fill-tiny"
                    style={{ width: `${Math.min((invitedFriends / levelRequirement) * 100, 100)}%` }}
                  ></div>
                </div>
                {invitedFriends >= levelRequirement && (
                  <span className="coins-display">🪙 {invitedFriends * 100}</span>
                )}
              </div>
            </div>
          </div>
          <div className="task-right">
            <button 
              className={`task-button ${invitedFriends >= levelRequirement ? 'completed' : 'invite-special'}`}
              onClick={handleInvite}
              disabled={invitedFriends >= levelRequirement}
            >
              {invitedFriends >= levelRequirement ? 'Completed ✅' : 'INVITE'}
            </button>
            <button 
              className="info-button"
              onClick={() => setShowInfoModal('invite')}
            >
              ✨
            </button>
          </div>
        </div>

        {/* Social Media Tasks */}
        {loading ? (
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : (
          socialTasks.map((task) => (
            <div 
              key={task.id} 
              className={`task-item ${task.completed ? 'completed-task' : ''}`}
            >
              <div className="task-left">
                <div className="task-icon-circle">
                  <span className="task-emoji">{task.icon}</span>
                </div>
                <div className="task-details">
                  <h3 className="task-name">
                    {task.type === 'youtube' && 'YouTube'}
                    {task.type === 'telegram' && 'Telegram'}
                    {task.type === 'facebook' && 'Facebook'}
                    {task.type === 'tiktok' && 'TikTok'}
                    {task.type === 'instagram' && 'Instagram'}
                  </h3>
                  <div className="task-status">
                    <span className="status-text">
                      {task.completed ? '✅' : '⚡'} {task.completed ? '1/1' : '0/1'}
                    </span>
                    <span className="coins-display">
                      🪙 {task.completed ? task.points : 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="task-right">
                <button 
                  className={`task-button ${task.completed ? 'completed' : ''}`}
                  onClick={() => handleTaskComplete(task)}
                  disabled={task.completed}
                >
                  {task.completed ? 'Completed ✅' : getTaskButtonText(task)}
                </button>
                <button 
                  className="info-button"
                  onClick={() => setShowInfoModal(task.type)}
                >
                  ✨
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Sections */}
      <div className="info-sections">
        <div className="info-box">
          <div className="info-icon-big">ℹ️</div>
          <div className="info-text">
            <h3>How Tasks Work</h3>
            <p>
              Complete social media tasks to earn coins and unlock new levels. 
              Each task rewards you with coins that count towards your progression. 
              Simply click the task button, complete the action (subscribe, follow, join), 
              and coins will be added to your account automatically.
            </p>
          </div>
        </div>

        <div className="info-box">
          <div className="info-icon-big">⚡</div>
          <div className="info-text">
            <h3>Quick Tips</h3>
            <ul>
              <li>✓ Complete all tasks to maximize your earnings</li>
              <li>✓ Invite friends to earn 100 coins per friend</li>
              <li>✓ Each friend must join through your unique link</li>
              <li>✓ Tasks are one-time rewards - complete them all!</li>
              <li>✓ Check back for new tasks and challenges</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="modal-backdrop" onClick={() => setShowInfoModal(null)}>
          <div className="info-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowInfoModal(null)}>×</button>
            <div className="modal-header">
              <div className="modal-icon">ℹ️</div>
              <h3>Task Information</h3>
            </div>
            <div className="modal-body">
              <p>{getTaskInfo(showInfoModal)}</p>
            </div>
            <button 
              className="modal-close-btn"
              onClick={() => setShowInfoModal(null)}
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
