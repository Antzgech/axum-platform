// Minimal backend using JSON file storage for users
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const DB_FILE = path.join(__dirname, 'users.json');

function readUsers() {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('readUsers error', e);
    return [];
  }
}
function writeUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}
function upsertTelegramUserSync(u) {
  if (!u || !u.id) throw new Error('telegramUser.id required');
  const users = readUsers();
  const idx = users.findIndex(x => String(x.telegram_id) === String(u.id));
  const now = new Date().toISOString();
  if (idx >= 0) {
    users[idx] = {
      ...users[idx],
      username: u.username || users[idx].username,
      first_name: u.first_name || users[idx].first_name,
      last_name: u.last_name || users[idx].last_name,
      phone: u.phone || users[idx].phone,
      photo_url: u.photo_url || users[idx].photo_url,
      updated_at: now
    };
  } else {
    users.push({
      id: String(u.id),
      telegram_id: u.id,
      username: u.username || u.first_name || `user_${u.id}`,
      first_name: u.first_name || null,
      last_name: u.last_name || null,
      phone: u.phone || null,
      photo_url: u.photo_url || null,
      points: 0,
      current_level: 1,
      created_at: now,
      updated_at: now
    });
  }
  writeUsers(users);
  return users.find(x => String(x.telegram_id) === String(u.id));
}

const app = express();
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Frontend posts Telegram user object here
app.post('/api/auth/telegram', (req, res) => {
  try {
    const payload = req.body || {};
    const telegramUser = payload.id ? payload : (payload.user || payload.initDataUnsafe?.user || payload);
    if (!telegramUser || !telegramUser.id) return res.status(400).json({ error: 'No telegram user in request' });
    const user = upsertTelegramUserSync(telegramUser);
    const token = jwt.sign({ userId: user.id, telegramId: user.telegram_id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, user });
  } catch (err) {
    console.error('POST /api/auth/telegram error:', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Telegram webhook: set webhook to https://<your-backend>/webhook
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    if (update.message && update.message.text && update.message.text.startsWith('/start')) {
      const from = update.message.from;
      if (from && from.id) {
        upsertTelegramUserSync({
          id: from.id,
          username: from.username,
          first_name: from.first_name,
          last_name: from.last_name,
          photo_url: null
        });

        const chatId = update.message.chat.id;
        if (BOT_TOKEN) {
          const payload = {
            chat_id: chatId,
            text: "Welcome to Axum. Tap below to open the WebApp.",
            reply_markup: {
              inline_keyboard: [[{ text: "Open Axum", web_app: { url: FRONTEND_URL } }]]
            }
          };
          const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
          try { await axios.post(url, payload); } catch (e) { console.error('sendMessage error', e?.response?.data || e.message); }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('webhook error', err);
    res.sendStatus(500);
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`Backend (JSON DB) listening on ${PORT}`));
