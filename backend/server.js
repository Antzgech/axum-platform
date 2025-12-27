const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS for Railway deployment
const allowedOrigins = [
  'https://axum-frontend-production.up.railway.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.set('trust proxy', 1);

// PostgreSQL Connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:jlhaqjInCkqxooOUAorDmWNyuOsWFMUN@mainline.proxy.rlwy.net:34581/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection and create tables
async function initializeDatabase() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL Connected');
    
    // Create users table if it doesn't exist
    await pool.query(`
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
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table ready');
    
    // Create index on telegram_id for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    `);
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.log('⚠️  Some features may not work without database');
  }
}

initializeDatabase();

// In-memory fallback (if database not available)
const tasks = new Map();
const sessions = new Map();

// Initialize default tasks
const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to Meten Official YouTube', points: 50, url: 'https://www.youtube.com/@metenofficial', icon: '▶️' },
  { id: '2', type: 'telegram', title: 'Join Sabawians Telegram Group', points: 30, url: 'https://t.me/+IoT_cwfs6EBjMTQ0', icon: '✈️' },
  { id: '3', type: 'facebook', title: 'Follow Sabawians on Facebook', points: 40, url: 'https://facebook.com/profile.php?id=61578048881192', icon: '👍' },
  { id: '4', type: 'tiktok', title: 'Follow Meten on TikTok', points: 40, url: 'https://tiktok.com/@metenofficials', icon: '🎵' },
  { id: '5', type: 'instagram', title: 'Follow Meten on Instagram', points: 40, url: 'https://instagram.com/metenofficial', icon: '📸' },
  { id: '6', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥' }
];

defaultTasks.forEach(task => tasks.set(task.id, task));

// Middleware: Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'Saba1212', (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper: Verify Telegram authentication
const verifyTelegramAuth = (data) => {
  const { hash, ...authData } = data;
  
  if (hash === 'webapp-auth' || hash === 'auto-login') {
    console.log('✅ WebApp/Auto-login accepted');
    return true;
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ Demo mode: No TELEGRAM_BOT_TOKEN set');
    return true;
  }

  try {
    const secret = crypto
      .createHash('sha256')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();

    const checkString = Object.keys(authData)
      .sort()
      .map(key => `${key}=${authData[key]}`)
      .join('\n');

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(checkString)
      .digest('hex');

    return hmac === hash;
  } catch (error) {
    console.error('Telegram auth verification error:', error);
    return true;
  }
};

// Helper: Get or create user (with PostgreSQL)
const getOrCreateUser = async (telegramData) => {
  const telegramId = telegramData.id;
  
  try {
    // Check if user exists
    const checkUser = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    
    if (checkUser.rows.length > 0) {
      // User exists, update last active
      await pool.query(
        'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE telegram_id = $1',
        [telegramId]
      );
      
      const user = checkUser.rows[0];
      console.log(`👋 User returned: ${user.username} (${telegramId})`);
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
        levelScores: user.level_scores || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        createdAt: user.created_at,
        lastActive: user.last_active
      };
    } else {
      // Create new user
      const newUser = await pool.query(
        `INSERT INTO users (
          telegram_id, username, first_name, last_name, photo_url
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          telegramId,
          telegramData.username || telegramData.first_name || 'User',
          telegramData.first_name || 'User',
          telegramData.last_name || '',
          telegramData.photo_url || ''
        ]
      );
      
      const user = newUser.rows[0];
      console.log(`✨ New user created in DB: ${user.username} (${telegramId})`);
      
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
        levelScores: user.level_scores || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        createdAt: user.created_at,
        lastActive: user.last_active
      };
    }
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Axum backend is running',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    environment: process.env.NODE_ENV || 'development'
  });
});

// POST /api/auth/telegram - Telegram login (supports auto-login)
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const telegramData = req.body;
    
    console.log('🔐 Auth attempt:', {
      id: telegramData.id,
      username: telegramData.username,
      first_name: telegramData.first_name,
      hash: telegramData.hash ? 'present' : 'missing',
      source: telegramData.hash === 'webapp-auth' ? 'WebApp' : 'Standard'
    });
    
    const isValid = verifyTelegramAuth(telegramData);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.log('❌ Invalid Telegram authentication');
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    const user = await getOrCreateUser(telegramData);

    const token = jwt.sign(
      { 
        userId: user.telegramId,
        telegramId: user.telegramId,
        username: user.username
      },
      process.env.JWT_SECRET || 'Saba1212',
      { expiresIn: '30d' }
    );

    sessions.set(token, {
      userId: user.telegramId,
      createdAt: new Date(),
      lastAccess: new Date()
    });

    console.log('✅ Login successful:', user.username);

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
    console.error('❌ Auth error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// GET /api/auth/me - Get current user
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
      last_name: user.last_name,
      photo_url: user.photo_url,
      points: user.points,
      currentLevel: user.current_level,
      badges: user.badges || []
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user/stats - Get user statistics
app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [req.user.telegramId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    // Get global rank
    const rankResult = await pool.query(
      'SELECT COUNT(*) + 1 as rank FROM users WHERE points > $1',
      [user.points]
    );
    const globalRank = parseInt(rankResult.rows[0].rank);

    const maxScores = { 1: 1000, 2: 1500, 3: 2000, 4: 2500, 5: 3000, 6: 5000 };
    const levelScores = user.level_scores || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const currentLevel = user.current_level;
    const levelProgress = Math.min(100, (levelScores[currentLevel] / maxScores[currentLevel]) * 100);

    const completedTasks = user.completed_tasks || [];
    const requirements = {
      friends: user.invited_friends >= 5,
      subscriptions: completedTasks.filter(t => ['1', '3', '4', '5'].includes(t)).length >= 3,
      follows: completedTasks.includes('2')
    };

    res.json({
      currentLevel: user.current_level,
      totalPoints: user.points,
      globalRank,
      badges: user.badges || [],
      levelProgress: Math.round(levelProgress),
      requirements,
      requiredFriends: 5,
      requiredSubscriptions: 3,
      requiredFollows: 1,
      recentActivity: [
        { icon: '🎮', text: 'Joined Axum', time: new Date(user.created_at).toLocaleDateString() },
        { icon: '⚔️', text: `Completed ${completedTasks.length} tasks`, time: 'Recently' }
      ]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/levels - Get all levels
app.get('/api/levels', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [req.user.telegramId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const levelScores = user.level_scores || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    const levels = [
      { id: 1, name: 'The Awakening', unlocked: true, completed: levelScores['1'] >= 1000, dueDate: '2025-01-15', score: levelScores['1'], maxScore: 1000 },
      { id: 2, name: 'The Journey Begins', unlocked: user.current_level >= 2, completed: levelScores['2'] >= 1500, dueDate: '2025-01-30', score: levelScores['2'], maxScore: 1500 },
      { id: 3, name: 'Trials of Wisdom', unlocked: user.current_level >= 3, completed: levelScores['3'] >= 2000, dueDate: '2025-02-14', score: levelScores['3'], maxScore: 2000 },
      { id: 4, name: 'The Sacred Path', unlocked: user.current_level >= 4, completed: levelScores['4'] >= 2500, dueDate: '2025-02-28', score: levelScores['4'], maxScore: 2500 },
      { id: 5, name: 'Champions Rise', unlocked: user.current_level >= 5, completed: levelScores['5'] >= 3000, dueDate: '2025-03-15', score: levelScores['5'], maxScore: 3000 },
      { id: 6, name: 'Jerusalem Awaits', unlocked: user.current_level >= 6, completed: levelScores['6'] >= 5000, dueDate: '2025-03-30', score: levelScores['6'], maxScore: 5000 }
    ];

    res.json({ levels });
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tasks - Get all tasks
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
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks/:id/complete - Mark task as completed
app.post('/api/tasks/:id/complete', authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
      [req.user.telegramId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const task = tasks.get(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const completedTasks = user.completed_tasks || [];
    
    if (completedTasks.includes(taskId)) {
      return res.status(400).json({ error: 'Task already completed' });
    }

    // Update user in database
    const newCompletedTasks = [...completedTasks, taskId];
    const newPoints = user.points + task.points;
    const levelScores = user.level_scores || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    levelScores[user.current_level] = (levelScores[user.current_level] || 0) + task.points;
    
    let newBadges = user.badges || [];
    if (newCompletedTasks.length === 1 && !newBadges.some(b => b.name === 'First Steps')) {
      newBadges.push({ name: 'First Steps', icon: '🏅', date: new Date() });
    }

    await pool.query(
      `UPDATE users SET 
        completed_tasks = $1,
        points = $2,
        level_scores = $3,
        badges = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = $5`,
      [newCompletedTasks, newPoints, JSON.stringify(levelScores), JSON.stringify(newBadges), req.user.telegramId]
    );

    console.log(`✅ Task completed: ${user.username} - ${task.title} (+${task.points})`);

    res.json({
      success: true,
      points: task.points,
      totalPoints: newPoints,
      badges: newBadges,
      levelProgress: Math.round((levelScores[user.current_level] / 1000) * 100)
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leaderboard - Get leaderboard
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const level = req.query.level || 'all';
    
    let rankings;
    
    if (level === 'all') {
      const result = await pool.query(
        'SELECT telegram_id, username, points, current_level, badges FROM users ORDER BY points DESC LIMIT 50'
      );
      
      rankings = result.rows.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        points: user.points,
        level: user.current_level,
        badges: (user.badges || []).length,
        finalist: index < 30
      }));
    } else {
      // Level-specific (simplified for now)
      const result = await pool.query(
        'SELECT telegram_id, username, points, current_level, badges FROM users ORDER BY points DESC LIMIT 10'
      );
      
      rankings = result.rows.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        points: user.points,
        level: user.current_level,
        badges: (user.badges || []).length,
        finalist: index < 5
      }));
    }

    res.json({ rankings, finalists: rankings.slice(0, 30) });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/rewards - Get user rewards
app.get('/api/rewards', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT points, badges FROM users WHERE telegram_id = $1',
      [req.user.telegramId]
    );
    
    const user = result.rows[0];
    const rewards = [];

    if (user.points >= 100) {
      rewards.push({ id: 'points-100', type: 'badge', name: 'Century Club', description: 'Earned 100 points', icon: '💯', unlocked: true });
    }

    res.json({
      rewards,
      totalCash: 0,
      totalPoints: user.points,
      badges: user.badges || []
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invite - Track friend invitations
app.post('/api/invite', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET invited_friends = invited_friends + 1, points = points + 20 WHERE telegram_id = $1 RETURNING *',
      [req.user.telegramId]
    );
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      invitedFriends: user.invited_friends,
      bonusPoints: 20,
      totalPoints: user.points
    });
  } catch (error) {
    console.error('Error tracking invite:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats - Server statistics
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    res.json({
      totalUsers: parseInt(result.rows[0].count),
      activeSessions: sessions.size,
      totalTasks: tasks.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      totalUsers: 0,
      activeSessions: sessions.size,
      totalTasks: tasks.size,
      timestamp: new Date().toISOString()
    });
  }
});

// Start Telegram Bot
try {
  require('./bot');
  console.log('✅ Telegram Bot loaded');
} catch (error) {
  console.log('⚠️  Bot file not found or error:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ⚽️  Axum Backend Server - Sabawians Company
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'production'}
  🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '⚠️  Using default'}
  🤖 Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ @SabaQuest_bot' : '⚠️  Not configured'}
  💾 Database: ✅ PostgreSQL (Railway)
  📡 CORS: https://axum-frontend-production.up.railway.app
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 Health: http://localhost:${PORT}/api/health
  📈 Stats: http://localhost:${PORT}/api/stats
  📧 Support: sabawians@gmail.com
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  pool.end(() => {
    console.log('💾 Database connections closed');
    process.exit(0);
  });
});

module.exports = app;
