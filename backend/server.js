// server.js — FINAL CLEAN VERSION
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      /\.telegram\.org$/,
      "https://t.me",
      "https://web.telegram.org"
    ],
    credentials: true,
  })
);

app.use(express.json());
app.set("trust proxy", 1);

// PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test DB
pool.query("SELECT NOW()")
  .then(() => console.log("✅ PostgreSQL Connected"))
  .catch((err) => console.error("❌ DB Error:", err.message));

// Telegram Auth
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

function verifyTelegram(data) {
  const { hash, ...rest } = data;

  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secret).update(checkString).digest("hex");

  return hmac === hash;
}

app.post("/api/auth/telegram", async (req, res) => {
  try {
    const { id, first_name, username, photo_url, auth_date, hash } = req.body;

    if (!id || !first_name || !auth_date || !hash)
      return res.status(400).json({ error: "Invalid Telegram payload" });

    if (!verifyTelegram(req.body))
      return res.status(403).json({ error: "Invalid Telegram authentication" });

    let result = await pool.query("SELECT * FROM tuser WHERE telegram_id=$1", [id]);

    let user;
    if (result.rows.length) {
      await pool.query(
        `UPDATE tuser SET username=$2, first_name=$3, photo_url=$4, last_active=NOW()
         WHERE telegram_id=$1`,
        [id, username || first_name, first_name, photo_url || ""]
      );
      result = await pool.query("SELECT * FROM tuser WHERE telegram_id=$1", [id]);
      user = result.rows[0];
    } else {
      const insert = await pool.query(
        `INSERT INTO tuser 
         (telegram_id, username, first_name, photo_url, current_level, coins, gems, points)
         VALUES ($1,$2,$3,$4,1,0,0,0)
         RETURNING *`,
        [id, username || first_name, first_name, photo_url || ""]
      );
      user = insert.rows[0];
    }

    const token = jwt.sign(
      { telegramId: user.telegram_id, userId: user.id },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ success: true, token, user });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Auth failed" });
  }
});

// JWT Middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// Protected routes
app.get("/api/auth/me", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM tuser WHERE telegram_id=$1",
    [req.user.telegramId]
  );
  res.json(result.rows[0]);
});

// Telegram Webhook
const bot = require("./bot");

app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health
app.get("/", (req, res) => {
  res.send("SabaQuest Backend Running");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
