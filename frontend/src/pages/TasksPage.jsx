// src/pages/TasksPage.jsx
import React, { useState, useEffect } from 'react';
import './TasksPage.css';

const API_URL = 'https://axum-backend-production.up.railway.app';

export default function TasksPage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/tasks`, {
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

  const completeTask = async (taskId) => {
    setCompleting(taskId);
    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Task completed! +${data.reward.coins} coins`);
        fetchTasks(); // Refresh tasks
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task. Please try again.');
    } finally {
      setCompleting(null);
    }
  };

  const isCompleted = (taskId) => {
    return user?.completed_tasks?.includes(taskId) || false;
  };

  if (loading) {
    return (
      <div className="tasks-page">
        <div className="loading">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1>📋 Tasks</h1>
        <p className="subtitle">Complete tasks to earn coins and level up!</p>
        <div className="task-progress">
          <span>{user?.completed_tasks?.length || 0} / {tasks.length} completed</span>
        </div>
      </div>

      <div className="tasks-list">
        {tasks.map((task) => {
          const completed = isCompleted(task.id);
          
          return (
            <div 
              key={task.id}
              className={`task-item ${completed ? 'completed' : ''}`}
            >
              <div className="task-icon">
                {completed ? '✅' : task.category === 'social' ? '📱' : task.category === 'daily' ? '📅' : '🎯'}
              </div>
              
              <div className="task-info">
                <div className="task-title">{task.title}</div>
                <div className="task-description">{task.description}</div>
                <div className="task-reward">
                  Reward: 🪙 {task.reward.coins}
                  {task.reward.gems > 0 && ` + 💎 ${task.reward.gems}`}
                </div>
              </div>

              <div className="task-action">
                {completed ? (
                  <span className="completed-badge">Done</span>
                ) : (
                  <button 
                    className="complete-btn"
                    onClick={() => completeTask(task.id)}
                    disabled={completing === task.id}
                  >
                    {completing === task.id ? 'Doing...' : task.action || 'Complete'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="no-tasks">
          <p>No tasks available right now.</p>
          <small>Check back later for new tasks!</small>
        </div>
      )}
    </div>
  );
}
