const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// In-memory database (replace with MongoDB/PostgreSQL in production)
const users = new Map();
const tasks = new Map();
const leaderboards = new Map();
const rewards = new Map();

// Initialize default tasks
const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to SABA YouTube Channel', points: 50, url: 'https://youtube.com/@saba', icon: '▶️' },
  { id: '2', type: 'telegram', title: 'Join Official Telegram Group', points: 30, url: 'https://t.me/axumgame', icon: '✈️' },
  { id: '3', type: 'facebook', title: 'Follow SABA on Facebook', points: 40, url: 'https://facebook.com/saba', icon: '👍' },
  { id: '4', type: 'tiktok', title: 'Follow on TikTok', points: 40, url: 'https://tiktok.com/@saba', icon: '🎵' },
  { id: '5', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥' }
];

defaultTasks.forEach(task => tasks.set(task.id, task));

// Middleware: Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'axum-secret-key-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper: Verify Telegram authentication
const verifyTelegramAuth = (data) => {
  const { hash, ...authData } = data;
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    // Demo mode - accept any auth in development
    console.log('⚠️ Demo mode: No TELEGRAM_BOT_TOKEN set');
    return true;
  }

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
};

// Helper: Get or create user
const getOrCreateUser = (telegramData) => {
  const userId = telegramData.id.toString();
  
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      telegramId: telegramData.id,
      username: telegramData.username || telegramData.first_name || 'User',
      first_name: telegramData.first_name || 'User',
      photo_url: telegramData.photo_url || '',
      points: 0,
      currentLevel: 1,
      badges: [],
      completedTasks: [],
      invitedFriends: 0,
      levelScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      createdAt: new Date(),
      lastActive: new Date()
    });
  } else {
    // Update last active
    const user = users.get(userId);
    user.lastActive = new Date();
    users.set(userId, user);
  }
  
  return users.get(userId);
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Axum backend is running' });
});

// POST /api/auth/telegram - Telegram login
app.post('/api/auth/telegram', (req, res) => {
  try {
    const telegramData = req.body;
    
    // Verify Telegram authentication
    const isValid = verifyTelegramAuth(telegramData);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    // Create or get user
    const user = getOrCreateUser(telegramData);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId },
      process.env.JWT_SECRET || 'axum-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
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
  const levelProgress = Math.min(100, (user.levelScores[user.currentLevel] / 1000) * 100);

  // Requirements for next level
  const requirements = {
    friends: user.invitedFriends >= 5,
    subscriptions: user.completedTasks.filter(t => ['youtube', 'facebook', 'tiktok'].includes(tasks.get(t)?.type)).length >= 3,
    follows: user.completedTasks.filter(t => tasks.get(t)?.type === 'telegram').length >= 1
  };

  res.json({
    currentLevel: user.currentLevel,
    totalPoints: user.points,
    globalRank,
    badges: user.badges,
    levelProgress,
    requirements,
    requiredFriends: 5,
    requiredSubscriptions: 3,
    requiredFollows: 1,
    recentActivity: [
      { icon: '🎮', text: 'Joined Axum', time: '1 hour ago' },
      { icon: '⚔️', text: 'Completed first task', time: '45 min ago' }
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
    user.badges.push({ name: 'First Steps', icon: '🏅' });
  }

  users.set(user.id, user);

  res.json({
    success: true,
    points: task.points,
    totalPoints: user.points,
    badges: user.badges
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
        finalist: index < 30 // Top 30 are finalists
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
        finalist: index < 5 // Top 5 per level are finalists
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
    finalists: finalists.slice(0, 30) // Ensure only 30 unique finalists
  });
});

// GET /api/rewards - Get user rewards
app.get('/api/rewards', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userRewards = rewards.get(user.id) || [];

  res.json({
    rewards: userRewards,
    totalCash: userRewards.filter(r => r.type === 'cash').reduce((sum, r) => sum + r.value, 0),
    totalPoints: user.points,
    badges: user.badges
  });
});

// POST /api/rewards/claim - Claim a reward
app.post('/api/rewards/claim', authenticateToken, (req, res) => {
  const { rewardId, paymentDetails } = req.body;
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // In production, integrate with Remitly API here
  console.log('Payment details:', paymentDetails);

  res.json({
    success: true,
    message: 'Reward claim submitted for processing'
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
  user.points += 20; // Bonus points for invite

  // Award badge for inviting friends
  if (user.invitedFriends >= 5 && !user.badges.some(b => b.name === 'Social Butterfly')) {
    user.badges.push({ name: 'Social Butterfly', icon: '🦋' });
  }

  users.set(user.id, user);

  res.json({
    success: true,
    invitedFriends: user.invitedFriends,
    bonusPoints: 20
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ⚜️  Axum Backend Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📡 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;
