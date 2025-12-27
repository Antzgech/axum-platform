const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS
const allowedOrigins = [
  'https://axum-frontend-production.up.railway.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.set('trust proxy', 1);

// PostgreSQL Connection
let pool = null;
let dbConnected = false;

async function connectDatabase() {
  try {
    const { Pool } = require('pg');
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.log('⚠️  No DATABASE_URL found, using in-memory storage');
      return false;
    }

    console.log('🔄 Connecting to PostgreSQL...');
    
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL Connected');
    
    // Create users table
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
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    `);
    
    dbConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Running in memory mode');
    dbConnected = false;
    return false;
  }
}

// In-memory storage fallback
const users = new Map();
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
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper: Verify Telegram authentication
const verifyTelegramAuth = (data) => {
  const { hash } = data;
  if (hash === 'webapp-auth' || hash === 'auto-login') {
    return true;
  }
  return true; // Accept all for now
};

// Helper: Get or create user
const getOrCreateUser = async (telegramData) => {
  const telegramId = telegramData.id;
  
  if (dbConnected && pool) {
    try {
      // Try database first
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
        console.log(`👋 User returned from DB: ${user.username}`);
        
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
      } else {
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
        console.log(`✨ New user created in DB: ${user.username}`);
        
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
    } catch (error) {
      console.error('Database error, using memory:', error.message);
    }
  }
  
  // Fallback to in-memory
  const userId = telegramId.toString();
  if (!users.has(userId)) {
    const newUser = {
      telegramId,
      username: telegramData.username || telegramData.first_name || 'User',
      first_name: telegramData.first_name || 'User',
      last_name: telegramData.last_name || '',
      photo_url: telegramData.photo_url || '',
      points: 0,
      currentLevel: 1,
      badges: [],
      completedTasks: [],
      invitedFriends: 0,
      levelScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };
    users.set(userId, newUser);
    console.log(`✨ New user in memory: ${newUser.username}`);
    return newUser;
  }
  
  const user = users.get(userId);
  console.log(`👋 User from memory: ${user.username}`);
  return user;
};

// Routes

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Axum backend is running',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'PostgreSQL' : 'In-memory',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.post('/api/auth/telegram', async (req, res) => {
  try {
    const telegramData = req.body;
    
    console.log('🔐 Auth:', telegramData.first_name, 'ID:', telegramData.id);
    
    const isValid = verifyTelegramAuth(telegramData);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid authentication' });
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
      createdAt: new Date()
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
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    if (dbConnected && pool) {
      const result = await pool.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [req.user.telegramId]
      );
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return res.json({
          id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          points: user.points,
          currentLevel: user.current_level,
          badges: user.badges || []
        });
      }
    }
    
    const userId = req.user.telegramId.toString();
    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.telegramId,
      username: user.username,
      first_name: user.first_name,
      points: user.points,
      currentLevel: user.currentLevel,
      badges: user.badges
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    let totalUsers = users.size;
    
    if (dbConnected && pool) {
      const result = await pool.query('SELECT COUNT(*) as count FROM users');
      totalUsers = parseInt(result.rows[0].count);
    }
    
    res.json({
      totalUsers,
      activeSessions: sessions.size,
      database: dbConnected ? 'PostgreSQL' : 'In-memory',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      totalUsers: users.size,
      activeSessions: sessions.size,
      database: 'In-memory',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/tasks', authenticateToken, (req, res) => {
  const allTasks = Array.from(tasks.values()).map(task => ({
    ...task,
    completed: false
  }));
  res.json({ tasks: allTasks });
});

// Start Telegram Bot
try {
  const bot = require('./bot');
  console.log('✅ Telegram Bot loaded');
} catch (error) {
  console.log('⚠️  Bot file not found:', error.message);
  console.log('   Create bot.js file to enable bot features');
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Initialize and start
async function start() {
  await connectDatabase();
  
  app.listen(PORT, () => {
    console.log(`
  ⚽️  Axum Backend Server - Sabawians Company
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'production'}
  🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '⚠️  Using default'}
  🤖 Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ @SabaQuest_bot' : '⚠️  Not configured'}
  💾 Database: ${dbConnected ? '✅ PostgreSQL' : '⚠️  In-memory'}
  📡 CORS: ${process.env.FRONTEND_URL || 'https://axum-frontend-production.up.railway.app'}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 Health: http://localhost:${PORT}/api/health
  📈 Stats: http://localhost:${PORT}/api/stats
  📧 Support: sabawians@gmail.com
    `);
  });
}

start();

module.exports = app;
