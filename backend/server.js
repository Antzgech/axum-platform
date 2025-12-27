const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.set('trust proxy', 1);

// PostgreSQL Connection
const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database and create tables
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('⚠️  App will run but data won\'t persist');
  } else {
    console.log('✅ PostgreSQL Connected:', res.rows[0].now);
    
    // Create tables
    pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) DEFAULT '',
        photo_url TEXT DEFAULT '',
        points INTEGER DEFAULT 0,
        current_level INTEGER DEFAULT 1,
        badges JSONB DEFAULT '[]'::jsonb,
        completed_tasks TEXT[] DEFAULT '{}',
        invited_friends INTEGER DEFAULT 0,
        level_scores JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `, (err) => {
      if (err) {
        console.error('❌ Table creation failed:', err.message);
      } else {
        console.log('✅ Users table ready');
      }
    });
  }
});

// In-memory storage
const tasks = new Map();
const sessions = new Map();

// Initialize tasks
const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to Meten Official YouTube', points: 50, url: 'https://www.youtube.com/@metenofficial', icon: '▶️' },
  { id: '2', type: 'telegram', title: 'Join Sabawians Telegram Group', points: 30, url: 'https://t.me/+IoT_cwfs6EBjMTQ0', icon: '✈️' },
  { id: '3', type: 'facebook', title: 'Follow Sabawians on Facebook', points: 40, url: 'https://facebook.com/profile.php?id=61578048881192', icon: '👍' },
  { id: '4', type: 'tiktok', title: 'Follow Meten on TikTok', points: 40, url: 'https://tiktok.com/@metenofficials', icon: '🎵' },
  { id: '5', type: 'instagram', title: 'Follow Meten on Instagram', points: 40, url: 'https://instagram.com/metenofficial', icon: '📸' },
  { id: '6', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥' }
];
defaultTasks.forEach(task => tasks.set(task.id, task));

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'Saba1212', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper functions
const getOrCreateUser = async (telegramData) => {
  const telegramId = telegramData.id;
  
  try {
    // Check if user exists
    const checkUser = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    
    if (checkUser.rows.length > 0) {
      // Update last active
      await pool.query(
        'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE telegram_id = $1',
        [telegramId]
      );
      const user = checkUser.rows[0];
      console.log(`👋 ${user.username} logged in`);
      return {
        telegramId: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
        points: user.points,
        currentLevel: user.current_level,
        badges: user.badges || [],
        completedTasks: user.completed_tasks || [],
        invitedFriends: user.invited_friends,
        levelScores: user.level_scores || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
      };
    }
    
    // Create new user
    const newUser = await pool.query(
      `INSERT INTO users (telegram_id, username, first_name, last_name, photo_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        telegramId,
        telegramData.username || telegramData.first_name || 'User',
        telegramData.first_name || 'User',
        telegramData.last_name || '',
        telegramData.photo_url || ''
      ]
    );
    
    const user = newUser.rows[0];
    console.log(`✨ NEW USER: ${user.username} (ID: ${telegramId})`);
    return {
      telegramId: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
      points: user.points,
      currentLevel: user.current_level,
      badges: user.badges || [],
      completedTasks: user.completed_tasks || [],
      invitedFriends: user.invited_friends,
      levelScores: user.level_scores || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };
  } catch (error) {
    console.error('Database error:', error.message);
    throw error;
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/telegram', async (req, res) => {
  try {
    const telegramData = req.body;
    console.log(`🔐 Auth: ${telegramData.first_name} (${telegramData.id})`);
    
    const user = await getOrCreateUser(telegramData);
    const token = jwt.sign(
      { userId: user.telegramId, telegramId: user.telegramId, username: user.username },
      process.env.JWT_SECRET || 'Saba1212',
      { expiresIn: '30d' }
    );

    sessions.set(token, { userId: user.telegramId, createdAt: new Date() });

    res.json({
      success: true,
      token,
      user: {
        id: user.telegramId,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
        points: user.points,
        currentLevel: user.currentLevel,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [req.user.telegramId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      points: user.points,
      currentLevel: user.current_level,
      badges: user.badges || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    res.json({
      totalUsers: parseInt(result.rows[0].count),
      activeSessions: sessions.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      totalUsers: 0,
      activeSessions: sessions.size,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT completed_tasks FROM users WHERE telegram_id = $1',
      [req.user.telegramId]
    );
    const completedTasks = result.rows[0]?.completed_tasks || [];
    const allTasks = Array.from(tasks.values()).map(task => ({
      ...task,
      completed: completedTasks.includes(task.id)
    }));
    res.json({ tasks: allTasks });
  } catch (error) {
    const allTasks = Array.from(tasks.values()).map(task => ({...task, completed: false}));
    res.json({ tasks: allTasks });
  }
});

app.post('/api/tasks/:id/complete', authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [req.user.telegramId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = result.rows[0];
    const task = tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const completedTasks = user.completed_tasks || [];
    if (completedTasks.includes(taskId)) {
      return res.status(400).json({ error: 'Task already completed' });
    }

    const newCompletedTasks = [...completedTasks, taskId];
    const newPoints = user.points + task.points;
    const levelScores = user.level_scores || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    levelScores[user.current_level] = (levelScores[user.current_level] || 0) + task.points;

    await pool.query(
      `UPDATE users SET completed_tasks = $1, points = $2, level_scores = $3 WHERE telegram_id = $4`,
      [newCompletedTasks, newPoints, JSON.stringify(levelScores), req.user.telegramId]
    );

    console.log(`✅ ${user.username} completed: ${task.title} (+${task.points})`);

    res.json({
      success: true,
      points: task.points,
      totalPoints: newPoints,
      levelProgress: Math.round((levelScores[user.current_level] / 1000) * 100)
    });
  } catch (error) {
    console.error('Task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT telegram_id, username, points, current_level FROM users ORDER BY points DESC LIMIT 50'
    );
    const rankings = result.rows.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      points: user.points,
      level: user.current_level,
      finalist: index < 30
    }));
    res.json({ rankings, finalists: rankings.slice(0, 30) });
  } catch (error) {
    res.json({ rankings: [], finalists: [] });
  }
});

// Load bot
try {
  require('./bot');
  console.log('✅ Telegram Bot loaded');
} catch (error) {
  console.log('⚠️  Bot file not found - create bot.js to enable bot features');
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`
  ⚽️  Axum Backend - Sabawians Company
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Port: ${PORT}
  🔐 JWT: ${process.env.JWT_SECRET ? '✅' : '⚠️'}
  🤖 Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ @SabaQuest_bot' : '⚠️'}
  💾 Database: PostgreSQL
  📡 Frontend: ${process.env.FRONTEND_URL}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;
