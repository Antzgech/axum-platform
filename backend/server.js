const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

console.log("🔄 Starting Axum Backend...");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------
// LOAD TELEGRAM BOT
// ---------------------------
const bot = require("./bot.js");
if (bot) {
  console.log("🤖 Telegram Bot loaded successfully");
} else {
  console.log("⚠️ Telegram Bot NOT loaded - check TELEGRAM_BOT_TOKEN");
}

// ---------------------------
// CORS + JSON
// ---------------------------
const FRONTEND_URL = process.env.FRONTEND_URL;
console.log("🌐 FRONTEND_URL:", FRONTEND_URL || "not set ❌");

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "https://web.telegram.org",
      "https://telegram.org",
      "https://t.me",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.set("trust proxy", 1);

// ---------------------------
// DATABASE MODE
// ---------------------------
const DATABASE_URL = process.env.DATABASE_URL;
const DB_DISABLED = DATABASE_URL === "none";

console.log("📡 DATABASE_URL:", DB_DISABLED ? "Disabled (local mode)" : "Found ✅");

let pool = null;

if (!DB_DISABLED) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  console.log("🟡 Local mode: Database disabled — skipping PostgreSQL connection");
}

// ---------------------------
// JWT
// ---------------------------
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET not found in environment variables!");
  console.error("⚠️ Using a secure JWT_SECRET is critical for production!");
  process.exit(1);
}

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const auth = authenticateToken;

// ---------------------------
// DAILY REWARDS
// ---------------------------
const DAILY_REWARDS = {
  1: { coins: 10, gems: 0, bonus: "First day!" },
  2: { coins: 20, gems: 0, bonus: "Keep going!" },
  3: { coins: 30, gems: 1, bonus: "3 day streak!" },
  4: { coins: 40, gems: 1, bonus: "Almost there!" },
  5: { coins: 50, gems: 2, bonus: "5 day streak!" },
  6: { coins: 60, gems: 2, bonus: "One more!" },
  7: { coins: 100, gems: 5, bonus: "🎉 Week Complete!" },
};

// ---------------------------
// TASKS (20)
// ---------------------------
const tasks = new Map();
[
  // your 20 tasks unchanged...
].forEach((t) => tasks.set(t.id, t));

console.log(`✅ Loaded ${tasks.size} tasks`);

// ---------------------------
// INIT DATABASE (ONLY IN PRODUCTION)
// ---------------------------
if (!DB_DISABLED) {
  (async () => {
    try {
      const result = await pool.query("SELECT NOW()");
      console.log("✅ PostgreSQL Connected:", result.rows[0].now);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          username VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) DEFAULT '',
          photo_url TEXT DEFAULT '',
          points INTEGER DEFAULT 0,
          coins INTEGER DEFAULT 0,
          gems INTEGER DEFAULT 0,
          current_level INTEGER DEFAULT 1,
          badges JSONB DEFAULT '[]'::jsonb,
          completed_tasks TEXT[] DEFAULT '{}',
          invited_friends INTEGER DEFAULT 0,
          level_scores JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb,
          last_game_played TIMESTAMP,
          last_checkin DATE,
          checkin_streak INTEGER DEFAULT 0,
          total_checkins INTEGER DEFAULT 0,
          achievements JSONB DEFAULT '[]'::jsonb,
          total_taps INTEGER DEFAULT 0,
          games_played INTEGER DEFAULT 0,
          referred_by BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("✅ Users table created/verified");

      const count = await pool.query("SELECT COUNT(*) FROM users");
      console.log(`📊 Current users in database: ${count.rows[0].count}`);
    } catch (error) {
      console.error("❌ Database error:", error.message);
    }
  })();
} else {
  console.log("🟡 Skipping DB initialization (local mode)");
}

// ---------------------------
// HEALTH
// ---------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: DB_DISABLED ? "Disabled (local)" : "PostgreSQL",
    bot: bot ? "active" : "inactive",
    tasks: tasks.size,
    time: new Date(),
  });
});

// ---------------------------
// AUTH (LOCAL MODE RETURNS MOCK USER)
// ---------------------------
app.post("/api/auth/telegram", async (req, res) => {
  if (DB_DISABLED) {
    return res.json({
      success: true,
      token: jwt.sign({ telegramId: 1, username: "LocalUser" }, JWT_SECRET),
      user: {
        telegram_id: 1,
        username: "LocalUser",
        first_name: "Local",
        last_name: "Dev",
        coins: 0,
        gems: 0,
        current_level: 1,
        badges: [],
        completed_tasks: [],
        invited_friends: 0,
      },
    });
  }

  // original DB logic...
});

// ---------------------------
// ALL OTHER ENDPOINTS
// If DB is disabled, return mock responses
// ---------------------------
const dbGuard = (req, res, next) => {
  if (DB_DISABLED) {
    return res.json({ error: "Database disabled in local mode" });
  }
  next();
};

app.get("/api/auth/me", dbGuard, auth, async (req, res) => {
  // original logic...
});

app.get("/api/stats", dbGuard, async (req, res) => {
  // original logic...
});

app.get("/api/leaderboard", dbGuard, auth, async (req, res) => {
  // original logic...
});

app.get("/api/tasks", dbGuard, auth, async (req, res) => {
  // original logic...
});

app.post("/api/tasks/:id/complete", dbGuard, auth, async (req, res) => {
  // original logic...
});

app.post("/api/game/result", dbGuard, async (req, res) => {
  // original logic...
});

app.post("/api/user/add-coin", dbGuard, auth, async (req, res) => {
  // original logic...
});

app.post("/api/checkin/claim", dbGuard, auth, async (req, res) => {
  // original logic...
});

app.get("/api/checkin/status", dbGuard, auth, async (req, res) => {
  // original logic...
});

// ---------------------------
// 404
// ---------------------------
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ---------------------------
// START SERVER
// ---------------------------
app.listen(PORT, () => {
  console.log(`
  ⚽️ Axum Backend - Sabawians Company
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server: http://localhost:${PORT}
  💾 Database: ${DB_DISABLED ? "Disabled (local mode)" : "PostgreSQL"}
  🤖 Bot: @SabaQuest_bot
  📋 Tasks: ${tasks.size} loaded
  🔗 Referral system: Active
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Test: /api/health | /api/stats
  `);
});
