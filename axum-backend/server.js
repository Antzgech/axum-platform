require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = process.env.PORT || 5000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// SQLite DB
const DB_PATH = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open DB', err);
    process.exit(1);
  }
  console.log('Opened sqlite DB at', DB_PATH);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      telegram_id INTEGER UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      photo_url TEXT,
      points INTEGER DEFAULT 0,
      current_level INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );
  `);
});

// DB helpers
function getUserByTelegramId(telegramId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function insertUser(u) {
  const now = new Date().toISOString();
  const id = String(u.id);
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (id, telegram_id, username, first_name, last_name, phone, photo_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, u.id, u.username || u.first_name || `user_${id}`, u.first_name || null, u.last_name || null, u.phone || null, u.photo_url || null, now, now],
      function (err) {
        if (err) return reject(err);
        getUserByTelegramId(u.id).then(resolve).catch(reject);
      }
    );
  });
}

function updateUser(u, existing) {
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET username = ?, first_name = ?, last_name = ?, phone = ?, photo_url = ?, updated_at = ? WHERE telegram_id = ?`,
      [u.username || existing.username, u.first_name || existing.first_name, u.last_name || existing.last_name, u.phone || existing.phone, u.photo_url || existing.photo_url, now, u.id],
      function (err) {
        if (err) return reject(err);
        getUserByTelegramId(u.id).then(resolve).catch(reject);
      }
    );
  });
}

async function upsertTelegramUser(telegramUser) {
  if (!telegramUser || !telegramUser.id) throw new Error('telegramUser.id required');
  const existing = await getUserByTelegramId(telegramUser.id);
  if (existing) return updateUser(telegramUser, existing);
  return insertUser(telegramUser);
}

// API endpoint used by frontend to authenticate WebApp user
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const payload = req.body || {};
    const telegramUser = payload.id ? payload : (payload.user || payload.initDataUnsafe?.user || payload);
    if (!telegramUser || !telegramUser.id) return res.status(400).json({ error: 'No telegram user in request' });

    const user = await upsertTelegramUser(telegramUser);
    const token = jwt.sign({ userId: user.id, telegramId: user.telegram_id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, user });
  } catch (err) {
    console.error('POST /api/auth/telegram error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Telegram webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    console.log('Incoming update:', JSON.stringify(update).slice(0, 1000));

    if (update.message && update.message.text && update.message.text.startsWith('/start')) {
      const from = update.message.from;
      if (from && from.id) {
        await upsertTelegramUser({
          id: from.id,
          username: from.username,
          first_name: from.first_name,
          last_name: from.last_name,
          photo_url: null
        });

        const chatId = update.message.chat.id;
        const payload = {
          chat_id: chatId,
          text: "Welcome to Axum. Tap below to open the WebApp.",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Open Axum", web_app: { url: FRONTEND_URL } }]
            ]
          }
        };

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        try {
          await axios.post(url, payload);
        } catch (err) {
          console.error('sendMessage error:', err.response?.data || err.message);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.sendStatus(500);
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
  console.log('FRONTEND_URL:', FRONTEND_URL);
});
