import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://axum-backend-production.up.railway.app';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      if (token) {
        // Verify token and get fresh user data
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <h2>Not logged in</h2>
        <a href="/">Go to Homepage</a>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👋 Welcome, {user.first_name}!</h1>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Your Stats</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{user.points || 0}</div>
            <div style={styles.statLabel}>Points</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{user.currentLevel || 1}</div>
            <div style={styles.statLabel}>Level</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statValue}>{user.badges?.length || 0}</div>
            <div style={styles.statLabel}>Badges</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.buttonGrid}>
          <button style={styles.button}>
            <span style={styles.buttonIcon}>🎯</span>
            Complete Tasks
          </button>
          <button style={styles.button}>
            <span style={styles.buttonIcon}>📊</span>
            View Leaderboard
          </button>
          <button style={styles.button}>
            <span style={styles.buttonIcon}>🏆</span>
            My Rewards
          </button>
          <button style={styles.button}>
            <span style={styles.buttonIcon}>👥</span>
            Invite Friends
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Current Level</h2>
        <div style={styles.levelCard}>
          <h3 style={styles.levelName}>Level {user.currentLevel || 1}: The Awakening</h3>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: '30%'}}></div>
          </div>
          <p style={styles.progressText}>300 / 1000 points</p>
        </div>
      </div>

      <div style={styles.footer}>
        <p>⚔️ Queen Makeda's Quest - Sabawians Company</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    color: '#fff',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    paddingTop: '20px'
  },
  title: {
    fontSize: '32px',
    margin: '0',
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '20px',
    border: '1px solid rgba(255, 215, 0, 0.2)'
  },
  sectionTitle: {
    fontSize: '22px',
    marginTop: '0',
    marginBottom: '20px',
    color: '#FFD700'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px'
  },
  statBox: {
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#aaa'
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px'
  },
  button: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    border: 'none',
    borderRadius: '10px',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'scale(1.05)'
    }
  },
  buttonIcon: {
    fontSize: '20px'
  },
  levelCard: {
    textAlign: 'center'
  },
  levelName: {
    fontSize: '20px',
    color: '#50C878',
    marginBottom: '15px'
  },
  progressBar: {
    width: '100%',
    height: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #50C878 0%, #90EE90 100%)',
    transition: 'width 0.3s ease'
  },
  progressText: {
    color: '#aaa',
    fontSize: '14px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '40px',
    padding: '20px',
    color: '#666',
    fontSize: '14px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '20px'
  }
};

export default Dashboard;
