const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const { handleUpdate } = require('./bot');

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

const users = new Map();

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

    res.json({ token, user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Axum backend running on port ${PORT}`);
});

module.exports = app;
