const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// 🔧 MIDDLEWARE (must be first)
// ===============================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); // REQUIRED for Telegram webhook


// ===============================
// 🤖 TELEGRAM BOT LOGIC
// ===============================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME || "SabaQuest_bot";
const WEBAPP_URL = process.env.FRONTEND_URL;

async function sendStartMessage(chatId) {
  const payload = {
    chat_id: chatId,
    text: "Welcome to SabaQuest! Tap below to begin your journey.",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open SabaQuest",
            web_app: { url: WEBAPP_URL }
          }
        ]
      ]
    }
  };

  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, payload);
}

async function handleUpdate(update) {
  try {
    if (update.message && update.message.text === "/start") {
      const chatId = update.message.chat.id;
      await sendStartMessage(chatId);
    }
  } catch (err) {
    console.error("Bot error:", err.response?.data || err.message);
  }
}

// Telegram webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    console.log("Incoming update:", JSON.stringify(req.body, null, 2));
    await handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});



// ===============================
// 🗄️ IN-MEMORY DATABASE
// ===============================

const users = new Map();
const tasks = new Map();
const rewards = new Map();

const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to SABA YouTube Channel', points: 50, url: 'https://youtube.com/@saba', icon: '▶️' },
  { id: '2', type: 'telegram', title: 'Join Official Telegram Group', points: 30, url: 'https://t.me/axumgame', icon: '✈️' },
  { id: '3', type: 'facebook', title: 'Follow SABA on Facebook', points: 40, url: 'https://facebook.com/saba', icon: '👍' },
  { id: '4', type: 'tiktok', title: 'Follow on TikTok', points: 40, url: 'https://tiktok.com/@saba', icon: '🎵' },
  { id: '5', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥' }
];

defaultTasks.forEach(task => tasks.set(task.id, task));


// ===============================
// 🔐 AUTH HELPERS
// ===============================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'axum-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const verifyTelegramAuth = (data) => {
  const { hash, ...authData } = data;

  if (!process.env.TELEGRAM_BOT_TOKEN) return true;

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
    const user = users.get(userId);
    user.lastActive = new Date();
    users.set(userId, user);
  }

  return users.get(userId);
};


// ===============================
// 🌐 API ROUTES
// ===============================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Axum backend is running' });
});

app.post('/api/auth/telegram', (req, res) => {
  try {
    const telegramData = req.body;

    const isValid = verifyTelegramAuth(telegramData);
    if (!isValid && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    const user = getOrCreateUser(telegramData);

    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId },
      process.env.JWT_SECRET || 'axum-secret-key',
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


// ===============================
// 🏁 START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(`
  ⚜️  Axum Backend Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📡 WebApp URL: ${WEBAPP_URL}
  🤖 Bot username: ${BOT_USERNAME}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;
