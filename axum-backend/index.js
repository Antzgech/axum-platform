const { handleUpdate } = require('./bot');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
app.post('/webhook', async (req, res) => {
  try {
    await handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

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


// ===============================
// 🔥 TELEGRAM BOT LOGIC
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
    await handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});


// ===============================
// 🔥 AUTH HELPERS
// ===============================

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

//
