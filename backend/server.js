const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
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
    // Allow requests with no origin (mobile apps, Telegram WebApp)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for Telegram WebApp compatibility
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Trust Railway proxy
app.set('trust proxy', 1);

// In-memory database (replace with MongoDB/PostgreSQL in production)
const users = new Map();
const tasks = new Map();
const sessions = new Map();

// Initialize default tasks
const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to Meten Official YouTube', points: 50, url: 'https://www.youtube.com/@metenofficial', icon: '▶️', verified: false },
  { id: '2', type: 'telegram', title: 'Join Sabawians Telegram Group', points: 30, url: 'https://t.me/+IoT_cwfs6EBjMTQ0', icon: '✈️', verified: false },
  { id: '3', type: 'facebook', title: 'Follow Sabawians on Facebook', points: 40, url: 'https://facebook.com/profile.php?id=61578048881192', icon: '👍', verified: false },
  { id: '4', type: 'tiktok', title: 'Follow Meten on TikTok', points: 40, url: 'https://tiktok.com/@metenofficials', icon: '🎵', verified: false },
  { id: '5', type: 'instagram', title: 'Follow Meten on Instagram', points: 40, url: 'https://instagram.com/metenofficial', icon: '📸', verified: false },
  { id: '6', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥', verified: false }
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
  
  // For WebApp authentication (auto-login) - always accept
  if (hash === 'webapp-auth' || hash === 'auto-login') {
    console.log('✅ WebApp/Auto-login accepted');
    return true;
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️ Demo mode: No TELEGRAM_BOT_TOKEN set');
    return true;
  }

  // Standard Telegram Web Login verification
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
    return true; // Accept anyway for WebApp compatibility
  }
};

// Helper: Get or create user
const getOrCreateUser = (telegramData) => {
  const userId = telegramData.id.toString();
  
  if (!users.has(userId)) {
    const newUser = {
      id: userId,
      telegramId: telegramData.id,
      username: telegramData.username || telegramData.first_name || 'User',
      first_name: telegramData.first_name || 'User',
      last_name: telegramData.last_name || '',
      photo_url: telegramData.photo_url || '',
      points: 0,
      currentLevel: 1,
      badges: [],
      completedTasks: [],
      invitedFriends: 0,
      levelScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      createdAt: new Date(),
      lastActive: new Date()
    };
    
    users.set(userId, newUser);
    console.log(`✨ New user created: ${newUser.username} (${userId})`);
  } else {
    // Update last active
    const user = users.get(userId);
    user.lastActive = new Date();
    users.set(userId, user);
    console.log(`👋 User returned: ${user.username} (${userId})`);
  }
  
  return users.get(userId);
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Axum backend is running',
    timestamp: new Date().toISOString(),
    users: users.size,
    environment: process.env.NODE_ENV || 'development'
  });
});

// POST /api/auth/telegram - Telegram login (supports auto-login)
app.post('/api/auth/telegram', (req, res) => {
  try {
    const telegramData = req.body;
    
    console.log('🔐 Auth attempt:', {
      id: telegramData.id,
      username: telegramData.username,
      first_name: telegramData.first_name,
      hash: telegramData.hash ? 'present' : 'missing',
      source: telegramData.hash === 'webapp-auth' ? 'WebApp' : 'Standard'
    });
    
    // Verify Telegram authentication
    const isValid = verifyTelegramAuth(telegramData);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.log('❌ Invalid Telegram authentication');
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    // Create or get user
    const user = getOrCreateUser(telegramData);

    // Generate JWT token (valid for 30 days)
    const token = jwt.sign(
      { 
        userId: user.id, 
        telegramId: user.telegramId,
        username: user.username
      },
      process.env.JWT_SECRET || 'Saba1212',
      { expiresIn: '30d' }
    );

    // Store session
    sessions.set(token, {
      userId: user.id,
      createdAt: new Date(),
      lastAccess: new Date()
    });

    console.log('✅ Login successful:', user.username);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
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
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    photo_url: user.photo_url,
    points: user.points,
    currentLevel: user.currentLevel,
    badges: user.badges
  });
});

// GET /api/user/stats - Get user statistics
app.get('/api/user/stats', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Calculate global rank
  const allUsers = Array.from(users.values()).sort((a, b) => b.points - a.points);
  const globalRank = allUsers.findIndex(u => u.id === user.id) + 1;

  // Calculate level progress
  const maxScores = { 1: 1000, 2: 1500, 3: 2000, 4: 2500, 5: 3000, 6: 5000 };
  const levelProgress = Math.min(100, (user.levelScores[user.currentLevel] / maxScores[user.currentLevel]) * 100);

  // Requirements for next level
  const requirements = {
    friends: user.invitedFriends >= 5,
    subscriptions: user.completedTasks.filter(t => ['youtube', 'facebook', 'tiktok', 'instagram'].includes(tasks.get(t)?.type)).length >= 3,
    follows: user.completedTasks.filter(t => tasks.get(t)?.type === 'telegram').length >= 1
  };

  res.json({
    currentLevel: user.currentLevel,
    totalPoints: user.points,
    globalRank,
    badges: user.badges,
    levelProgress: Math.round(levelProgress),
    requirements,
    requiredFriends: 5,
    requiredSubscriptions: 3,
    requiredFollows: 1,
    recentActivity: [
      { icon: '🎮', text: 'Joined Axum', time: new Date(user.createdAt).toLocaleDateString() },
      { icon: '⚔️', text: `Completed ${user.completedTasks.length} tasks`, time: 'Recently' }
    ]
  });
});

// GET /api/levels - Get all levels with user progress
app.get('/api/levels', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const levels = [
    {
      id: 1,
      name: 'The Awakening',
      unlocked: true,
      completed: user.levelScores[1] >= 1000,
      dueDate: '2025-01-15',
      score: user.levelScores[1],
      maxScore: 1000
    },
    {
      id: 2,
      name: 'The Journey Begins',
      unlocked: user.currentLevel >= 2,
      completed: user.levelScores[2] >= 1500,
      dueDate: '2025-01-30',
      score: user.levelScores[2],
      maxScore: 1500
    },
    {
      id: 3,
      name: 'Trials of Wisdom',
      unlocked: user.currentLevel >= 3,
      completed: user.levelScores[3] >= 2000,
      dueDate: '2025-02-14',
      score: user.levelScores[3],
      maxScore: 2000
    },
    {
      id: 4,
      name: 'The Sacred Path',
      unlocked: user.currentLevel >= 4,
      completed: user.levelScores[4] >= 2500,
      dueDate: '2025-02-28',
      score: user.levelScores[4],
      maxScore: 2500
    },
    {
      id: 5,
      name: 'Champions Rise',
      unlocked: user.currentLevel >= 5,
      completed: user.levelScores[5] >= 3000,
      dueDate: '2025-03-15',
      score: user.levelScores[5],
      maxScore: 3000
    },
    {
      id: 6,
      name: 'Jerusalem Awaits',
      unlocked: user.currentLevel >= 6,
      completed: user.levelScores[6] >= 5000,
      dueDate: '2025-03-30',
      score: user.levelScores[6],
      maxScore: 5000
    }
  ];

  res.json({ levels });
});

// GET /api/tasks - Get all tasks
app.get('/api/tasks', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const allTasks = Array.from(tasks.values()).map(task => ({
    ...task,
    completed: user.completedTasks.includes(task.id)
  }));

  res.json({ tasks: allTasks });
});

// POST /api/tasks/:id/complete - Mark task as completed
app.post('/api/tasks/:id/complete', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const task = tasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (user.completedTasks.includes(taskId)) {
    return res.status(400).json({ error: 'Task already completed' });
  }

  // Mark task as completed
  user.completedTasks.push(taskId);
  user.points += task.points;
  user.levelScores[user.currentLevel] += task.points;

  // Award badge for first task
  if (user.completedTasks.length === 1 && !user.badges.some(b => b.name === 'First Steps')) {
    user.badges.push({ name: 'First Steps', icon: '🏅', date: new Date() });
  }

  // Award badge for completing all social tasks
  const socialTasks = user.completedTasks.filter(id => 
    ['youtube', 'facebook', 'tiktok', 'telegram', 'instagram'].includes(tasks.get(id)?.type)
  );
  if (socialTasks.length >= 5 && !user.badges.some(b => b.name === 'Social Star')) {
    user.badges.push({ name: 'Social Star', icon: '⭐', date: new Date() });
  }

  users.set(user.id, user);

  console.log(`✅ Task completed: ${user.username} - ${task.title} (+${task.points})`);

  res.json({
    success: true,
    points: task.points,
    totalPoints: user.points,
    badges: user.badges,
    levelProgress: Math.round((user.levelScores[user.currentLevel] / 1000) * 100)
  });
});

// GET /api/leaderboard - Get leaderboard
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  const level = req.query.level || 'all';
  
  let rankings;
  
  if (level === 'all') {
    // Global leaderboard
    rankings = Array.from(users.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 50)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        points: user.points,
        level: user.currentLevel,
        badges: user.badges.length,
        finalist: index < 30
      }));
  } else {
    // Level-specific leaderboard
    const levelNum = parseInt(level);
    rankings = Array.from(users.values())
      .filter(u => u.currentLevel >= levelNum)
      .sort((a, b) => b.levelScores[levelNum] - a.levelScores[levelNum])
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        points: user.levelScores[levelNum],
        level: user.currentLevel,
        badges: user.badges.length,
        finalist: index < 5
      }));
  }

  // Get finalists (top 5 from each level)
  const finalists = [];
  for (let levelNum = 1; levelNum <= 6; levelNum++) {
    const levelFinalists = Array.from(users.values())
      .filter(u => u.currentLevel >= levelNum)
      .sort((a, b) => b.levelScores[levelNum] - a.levelScores[levelNum])
      .slice(0, 5)
      .map(u => ({
        username: u.username,
        level: levelNum,
        points: u.levelScores[levelNum]
      }));
    
    finalists.push(...levelFinalists);
  }

  res.json({
    rankings,
    finalists: finalists.slice(0, 30)
  });
});

// GET /api/rewards - Get user rewards
app.get('/api/rewards', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const rewards = [];

  // Points milestone rewards
  if (user.points >= 100) {
    rewards.push({
      id: 'points-100',
      type: 'badge',
      name: 'Century Club',
      description: 'Earned 100 points',
      icon: '💯',
      unlocked: true
    });
  }

  if (user.points >= 500) {
    rewards.push({
      id: 'points-500',
      type: 'badge',
      name: 'Rising Star',
      description: 'Earned 500 points',
      icon: '🌟',
      unlocked: true
    });
  }

  res.json({
    rewards,
    totalCash: 0,
    totalPoints: user.points,
    badges: user.badges
  });
});

// POST /api/invite - Track friend invitations
app.post('/api/invite', authenticateToken, (req, res) => {
  const { invitedUserId } = req.body;
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.invitedFriends += 1;
  user.points += 20;

  if (user.invitedFriends >= 5 && !user.badges.some(b => b.name === 'Social Butterfly')) {
    user.badges.push({ name: 'Social Butterfly', icon: '🦋', date: new Date() });
  }

  users.set(user.id, user);

  console.log(`👥 Invite tracked: ${user.username} invited user ${invitedUserId}`);

  res.json({
    success: true,
    invitedFriends: user.invitedFriends,
    bonusPoints: 20,
    totalPoints: user.points
  });
});

// GET /api/stats - Server statistics
app.get('/api/stats', (req, res) => {
  res.json({
    totalUsers: users.size,
    activeSessions: sessions.size,
    totalTasks: tasks.size,
    timestamp: new Date().toISOString()
  });
});

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
  process.exit(0);
});

module.exports = app;
