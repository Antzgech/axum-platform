import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './TasksPage.css';

function TasksPage({ user }) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

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
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task) => {
    // Special handling for invite task
    if (task.type === 'invite') {
      setShowInviteModal(true);
      return;
    }

    // Open social media link
    if (task.url) {
      window.open(task.url, '_blank');
    }
    
    // Wait a moment for user to complete action
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
          
          // Show success notification
          showNotification(`✅ +${data.points} coins earned!`);
          
          // Refresh tasks
          fetchTasks();
          
          // Trigger parent to refresh user data
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('userUpdated'));
          }
        }
      } catch (error) {
        console.error('Failed to complete task:', error);
        showNotification('❌ Failed to complete task');
      }
    }, 1500);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    showNotification('✅ Invite link copied!');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`🏰 Join me on Queen Makeda's Quest!\n\nEarn rewards, complete challenges, and climb the leaderboard!\n\n`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`🏰 Join me on Queen Makeda's Quest! Earn rewards and complete challenges: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const showNotification = (message) => {
    // Create notification element
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

  const filteredTasks = activeTab === 'all' 
    ? tasks 
    : tasks.filter(t => t.type === activeTab);

  const taskCategories = [
    { id: 'all', label: 'All Tasks', icon: '📋' },
    { id: 'youtube', label: 'YouTube', icon: '▶️' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
    { id: 'facebook', label: 'Facebook', icon: '👍' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
    { id: 'instagram', label: 'Instagram', icon: '📸' },
    { id: 'invite', label: 'Invite', icon: '👥' }
  ];

  const getTaskStats = () => {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const points = tasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.points, 0);
    
    return { completed, total, points };
  };

  const stats = getTaskStats();

  return (
    <div className="tasks-page">
      {/* Header Section */}
      <div className="tasks-header">
        <div className="tasks-header-content">
          <div className="tasks-icon-large">📜</div>
          <h1 className="tasks-title">Queen's Tasks</h1>
          <p className="tasks-subtitle">Complete social quests to earn rewards</p>
        </div>

        {/* Stats Cards */}
        <div className="tasks-stats">
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completed}/{stats.total}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🪙</div>
            <div className="stat-content">
              <div className="stat-value">{stats.points}</div>
              <div className="stat-label">Earned</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-value">{tasks.length - stats.completed}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="tasks-tabs">
        {taskCategories.map(category => (
          <button
            key={category.id}
            className={`tab-btn ${activeTab === category.id ? 'active' : ''}`}
            onClick={() => setActiveTab(category.id)}
          >
            <span className="tab-icon">{category.icon}</span>
            <span className="tab-label">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="tasks-loading">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="tasks-grid">
          {filteredTasks.map((task, index) => (
            <div 
              key={task.id} 
              className={`task-card ${task.completed ? 'completed' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Task Badge */}
              {task.completed && (
                <div className="task-badge">
                  <span>✓</span>
                </div>
              )}

              {/* Task Icon */}
              <div className="task-icon-wrapper">
                <span className="task-icon">{task.icon}</span>
              </div>

              {/* Task Content */}
              <div className="task-content">
                <h3 className="task-title">{task.title}</h3>
                <div className="task-reward">
                  <span className="reward-icon">🪙</span>
                  <span className="reward-value">+{task.points}</span>
                  <span className="reward-label">coins</span>
                </div>
              </div>

              {/* Task Action Button */}
              <button
                className={`task-btn ${task.completed ? 'completed-btn' : 'action-btn'}`}
                onClick={() => !task.completed && handleCompleteTask(task)}
                disabled={task.completed}
              >
                {task.completed ? (
                  <>
                    <span className="btn-icon">✓</span>
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">→</span>
                    <span>Start Task</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="tasks-empty">
          <div className="empty-icon">🎉</div>
          <h3>No tasks in this category</h3>
          <p>Try selecting a different category</p>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="invite-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInviteModal(false)}>
              ×
            </button>

            <div className="modal-header">
              <div className="modal-icon">👥</div>
              <h2>Invite Friends</h2>
              <p>Share your unique link and earn rewards!</p>
            </div>

            <div className="modal-content">
              {/* Invite Link */}
              <div className="invite-link-box">
                <input 
                  type="text" 
                  value={inviteLink} 
                  readOnly 
                  className="invite-link-input"
                />
                <button 
                  className="copy-btn"
                  onClick={handleCopyInviteLink}
                >
                  {copySuccess ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>

              {/* Share Buttons */}
              <div className="share-buttons">
                <button className="share-btn telegram-btn" onClick={handleShareTelegram}>
                  <span className="share-icon">✈️</span>
                  <span>Share on Telegram</span>
                </button>

                <button className="share-btn whatsapp-btn" onClick={handleShareWhatsApp}>
                  <span className="share-icon">💬</span>
                  <span>Share on WhatsApp</span>
                </button>
              </div>

              {/* Invite Stats */}
              <div className="invite-stats">
                <div className="invite-stat">
                  <div className="stat-number">{user?.invited_friends || 0}</div>
                  <div className="stat-text">Friends Invited</div>
                </div>
                <div className="invite-stat">
                  <div className="stat-number">🪙 100</div>
                  <div className="stat-text">Per Friend</div>
                </div>
              </div>

              {/* Rewards Info */}
              <div className="rewards-info">
                <h4>🎁 Rewards</h4>
                <ul>
                  <li>💰 100 coins for each friend who joins</li>
                  <li>🎯 Bonus points when they complete tasks</li>
                  <li>👑 Special badges for top inviters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

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
  );
}

export default TasksPage;
