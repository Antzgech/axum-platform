const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

console.log("🔄 Starting Axum Backend...");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------
// LOAD TELEGRAM BOT (CRITICAL!)
// ---------------------------
const bot = require('./bot.js');
if (bot) {
  console.log("✅ Telegram Bot loaded successfully");
} else {
  console.log("⚠️  Telegram Bot NOT loaded - check TELEGRAM_BOT_TOKEN");
}

// ---------------------------
// CORS + JSON
// ---------------------------
const FRONTEND_URL = process.env.FRONTEND_URL;
console.log("🌐 FRONTEND_URL:", FRONTEND_URL || "not set ❌");

app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ],
  credentials: true
}));

app.use(express.json());
app.set("trust proxy", 1);

// ---------------------------
// PostgreSQL
// ---------------------------
const DATABASE_URL = process.env.DATABASE_URL;
console.log("📡 DATABASE_URL:", DATABASE_URL ? "Found ✅" : "Missing ❌");

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Init DB with coins and gems columns
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Users table created/verified");

    // Add coins and gems columns if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='coins') THEN
          ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='gems') THEN
          ALTER TABLE users ADD COLUMN gems INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log("✅ Database schema updated");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_telegram_id ON users(telegram_id);
      CREATE INDEX IF NOT EXISTS idx_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_points ON users(points DESC);
    `);
    console.log("✅ Indexes created");

    const count = await pool.query("SELECT COUNT(*) FROM users");
    console.log(`📊 Current users in database: ${count.rows[0].count}`);
  } catch (error) {
    console.error("❌ Database error:", error.message);
  }
})();

// ---------------------------
// In-memory tasks
// ---------------------------
const tasks = new Map();
[
  {
    id: "1",
    type: "youtube",
    title: "Subscribe to Meten Official YouTube",
    points: 50,
    url: "https://www.youtube.com/@metenofficial",
    icon: "▶️",
  },
  {
    id: "2",
    type: "telegram",
    title: "Join Sabawians Telegram Group",
    points: 30,
    url: "https://t.me/+IoT_cwfs6EBjMTQ0",
    icon: "✈️",
  },
  {
    id: "3",
    type: "facebook",
    title: "Follow on Facebook",
    points: 40,
    url: "https://facebook.com/profile.php?id=61578048881192",
    icon: "👍",
  },
  {
    id: "4",
    type: "tiktok",
    title: "Follow on TikTok",
    points: 40,
    url: "https://tiktok.com/@metenofficials",
    icon: "🎵",
  },
  {
    id: "5",
    type: "instagram",
    title: "Follow on Instagram",
    points: 40,
    url: "https://instagram.com/metenofficial",
    icon: "📸",
  },
].forEach((t) => tasks.set(t.id, t));

console.log(`✅ Loaded ${tasks.size} tasks`);

// ---------------------------
// Auth middleware (JWT)
// ---------------------------
const JWT_SECRET = process.env.JWT_SECRET || "Saba1212";

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ---------------------------
// Health
// ---------------------------
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    database: "PostgreSQL", 
    bot: bot ? "active" : "inactive",
    time: new Date() 
  });
});

// ---------------------------
// Telegram Auth
// ---------------------------
app.post("/api/auth/telegram", async (req, res) => {
  try {
    console.log("🔐 /api/auth/telegram called");
    console.log("📥 Body:", req.body);

    const { id, first_name, last_name, username, photo_url } = req.body || {};

    if (!id || !first_name) {
      console.log("❌ Invalid Telegram user payload");
      return res.status(400).json({ error: "Invalid Telegram user" });
    }

    console.log(`🔐 Login attempt: ${first_name} (ID: ${id})`);

    let dbUser = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [id]
    );

    let user;
    if (dbUser.rows.length > 0) {
      await pool.query(
        "UPDATE users SET last_active = NOW(), username = $2, first_name = $3, last_name = $4, photo_url = $5 WHERE telegram_id = $1",
        [id, username || first_name, first_name, last_name || "", photo_url || ""]
      );
      dbUser = await pool.query(
        "SELECT * FROM users WHERE telegram_id = $1",
        [id]
      );
      user = dbUser.rows[0];
      console.log(`👋 Existing user: ${user.username}`);
    } else {
      const newUser = await pool.query(
        `INSERT INTO users 
         (telegram_id, username, first_name, last_name, photo_url) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          id,
          username || first_name || "User",
          first_name || "User",
          last_name || "",
          photo_url || "",
        ]
      );
      user = newUser.rows[0];
      console.log(`✨ NEW USER CREATED: ${user.username} (ID: ${id})`);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegram_id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.telegram_id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        photo_url: user.photo_url,
        points: user.points,
        coins: user.coins || 0,
        gems: user.gems || 0,
        current_level: user.current_level,
        badges: user.badges || [],
        completed_tasks: user.completed_tasks || [],
        invited_friends: user.invited_friends || 0,
      },
    });
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    res.status(500).json({ error: "Auth failed", details: error.message });
  }
});

// ---------------------------
// Get current user (for refreshing)
// ---------------------------
app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [req.user.telegramId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    res.json({
      id: user.telegram_id,
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
      points: user.points,
      coins: user.coins || 0,
      gems: user.gems || 0,
      current_level: user.current_level,
      badges: user.badges || [],
      completed_tasks: user.completed_tasks || [],
      invited_friends: user.invited_friends || 0,
    });
  } catch (error) {
    console.error("❌ Get user error:", error.message);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ---------------------------
// Stats
// ---------------------------
app.get("/api/stats", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM users");
    res.json({
      totalUsers: parseInt(result.rows[0].count),
      database: "PostgreSQL Connected ✅",
      bot: bot ? "Bot Active 🤖" : "Bot Inactive ⚠️",
    });
  } catch (error) {
    res.json({ totalUsers: 0, database: "Error: " + error.message });
  }
});

// ---------------------------
// Tasks
// ---------------------------
app.get("/api/tasks", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT completed_tasks FROM users WHERE telegram_id = $1",
      [req.user.telegramId]
    );
    const completed = result.rows[0]?.completed_tasks || [];
    const allTasks = Array.from(tasks.values()).map((t) => ({
      ...t,
      completed: completed.includes(t.id),
    }));
    res.json({ tasks: allTasks });
  } catch (error) {
    res.json({
      tasks: Array.from(tasks.values()).map((t) => ({
        ...t,
        completed: false,
      })),
    });
  }
});

app.post("/api/tasks/:id/complete", auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = tasks.get(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const userRes = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [req.user.telegramId]
    );
    if (userRes.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const u = userRes.rows[0];
    const completed = u.completed_tasks || [];

    if (completed.includes(taskId)) {
      return res.status(400).json({ error: "Already completed" });
    }

    const newCompleted = [...completed, taskId];
    const newPoints = u.points + task.points;
    const levelScores = u.level_scores || {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
    };
    levelScores[u.current_level] =
      (levelScores[u.current_level] || 0) + task.points;

    await pool.query(
      "UPDATE users SET completed_tasks = $1, points = $2, level_scores = $3 WHERE telegram_id = $4",
      [newCompleted, newPoints, JSON.stringify(levelScores), req.user.telegramId]
    );

    console.log(
      `✅ TASK COMPLETED: ${u.username} - ${task.title} (+${task.points} points)`
    );

    res.json({ success: true, points: task.points, totalPoints: newPoints });
  } catch (error) {
    console.error("Task error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Game result
// ---------------------------
const GAME_COOLDOWN_MS = 60 * 1000;

app.post("/api/game/result", async (req, res) => {
  try {
    const { userId, coinReward = 0, gemReward = 0, score = 0, duration = 20 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const userRes = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];

    if (user.last_game_played) {
      const last = new Date(user.last_game_played).getTime();
      const now = Date.now();
      if (now - last < GAME_COOLDOWN_MS) {
        const wait = Math.ceil((GAME_COOLDOWN_MS - (now - last)) / 1000);
        return res.status(429).json({
          error: "Cooldown active",
          waitSeconds: wait,
        });
      }
    }

    const coinsToAdd = Number(coinReward) || 0;
    const gemsToAdd = Number(gemReward) || 0;

    const updated = await pool.query(
      `UPDATE users
       SET coins = coins + $1,
           gems = gems + $2,
           last_game_played = NOW(),
           last_active = NOW()
       WHERE telegram_id = $3
       RETURNING id, telegram_id, username, coins, gems`,
      [coinsToAdd, gemsToAdd, userId]
    );

    return res.json({
      success: true,
      coinsAdded: coinsToAdd,
      gemsAdded: gemsToAdd,
      user: updated.rows[0],
      cooldownSeconds: 60,
    });

  } catch (err) {
    console.error("❌ Game result error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Add coin (Makeda tap)
// ---------------------------
app.post("/api/user/add-coin", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const updated = await pool.query(
      `UPDATE users
       SET coins = coins + 1,
           last_active = NOW()
       WHERE telegram_id = $1
       RETURNING coins, gems`,
      [telegramId]
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      coins: updated.rows[0].coins,
      gems: updated.rows[0].gems
    });

  } catch (err) {
    console.error("Makeda coin error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// 404
// ---------------------------
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ---------------------------
// Start
// ---------------------------
app.listen(PORT, () => {
  console.log(`
  ⚽️  Axum Backend - Sabawians Company
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server: http://localhost:${PORT}
  💾 Database: PostgreSQL
  🤖 Bot: @SabaQuest_bot
  📋 Tasks: ${tasks.size} loaded
  🔗 Referral system: Active
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Test: /api/health | /api/stats
  `);
});
