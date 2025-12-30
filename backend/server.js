const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

console.log("🔄 Starting Axum Backend...");

const app = express();
const PORT = process.env.PORT || 5000;

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

// Init DB
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
        invited_by TEXT DEFAULT NULL,
        level_scores JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb,
        last_game_played TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Users table created/verified");

    // Add new columns if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='invited_by') THEN
          ALTER TABLE users ADD COLUMN invited_by TEXT DEFAULT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='users' AND column_name='invited_friends') THEN
          ALTER TABLE users ADD COLUMN invited_friends INTEGER DEFAULT 0;
        END IF;

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
    
    // Update NULL values
    await pool.query(`
      UPDATE users SET coins = 0 WHERE coins IS NULL;
      UPDATE users SET gems = 0 WHERE gems IS NULL;
      UPDATE users SET invited_friends = 0 WHERE invited_friends IS NULL;
    `);
    
    console.log("✅ Database schema updated");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
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
    points: 20,
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
    points: 20,
    url: "https://facebook.com/profile.php?id=61578048881192",
    icon: "👍",
  },
  {
    id: "4",
    type: "tiktok",
    title: "Follow on TikTok",
    points: 30,
    url: "https://tiktok.com/@metenofficials",
    icon: "🎵",
  },
  {
    id: "5",
    type: "instagram",
    title: "Follow on Instagram",
    points: 20,
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
  res.json({ status: "ok", database: "PostgreSQL", time: new Date() });
});

// ---------------------------
// Telegram Auth
// ---------------------------
app.post("/api/auth/telegram", async (req, res) => {
  try {
    console.log("🔐 /api/auth/telegram called");

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
        points: user.points || 0,
        coins: user.coins || 0,
        gems: user.gems || 0,
        current_level: user.current_level,
        badges: user.badges || [],
        invited_friends: user.invited_friends || 0,
        invited_by: user.invited_by || null,
      },
    });
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    res.status(500).json({ error: "Auth failed", details: error.message });
  }
});

// ---------------------------
// Get current user (NEW ENDPOINT!)
// ---------------------------
app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const userRes = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [req.user.telegramId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];
    
    res.json({
      id: user.telegram_id,
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
      points: user.points || 0,
      coins: user.coins || 0,
      gems: user.gems || 0,
      current_level: user.current_level,
      badges: user.badges || [],
      invited_friends: user.invited_friends || 0,
      invited_by: user.invited_by || null,
    });
  } catch (error) {
    console.error("❌ Get user error:", error.message);
    res.status(500).json({ error: "Server error" });
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
    });
  } catch (error) {
    res.json({ totalUsers: 0, database: "Error: " + error.message });
  }
});

// ---------------------------
// REFERRAL TRACKING
// ---------------------------
app.post("/api/referral/check", async (req, res) => {
  try {
    const { telegram_id, referred_by } = req.body;
    
    console.log(`🔗 Referral check: ${telegram_id} referred by ${referred_by}`);

    if (!telegram_id) {
      return res.status(400).json({ error: "Missing telegram_id" });
    }

    const userCheck = await pool.query(
      "SELECT invited_by, telegram_id FROM users WHERE telegram_id = $1",
      [telegram_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userCheck.rows[0];

    if (user.invited_by) {
      console.log(`⚠️ User ${telegram_id} already has referrer: ${user.invited_by}`);
      return res.json({ 
        success: false, 
        message: "User already has referrer",
        referred_by: user.invited_by 
      });
    }

    if (!referred_by) {
      return res.json({ success: false, message: "No referrer provided" });
    }

    if (referred_by === telegram_id || referred_by === telegram_id.toString()) {
      console.log(`⚠️ Self-referral attempt blocked: ${telegram_id}`);
      return res.json({ success: false, message: "Cannot refer yourself" });
    }

    const referrerCheck = await pool.query(
      "SELECT telegram_id, invited_friends, coins FROM users WHERE telegram_id = $1",
      [referred_by]
    );

    if (referrerCheck.rows.length === 0) {
      console.log(`⚠️ Referrer not found: ${referred_by}`);
      return res.json({ success: false, message: "Referrer not found" });
    }

    const referrer = referrerCheck.rows[0];

    await pool.query(
      "UPDATE users SET invited_by = $1 WHERE telegram_id = $2",
      [referred_by, telegram_id]
    );

    const newInvitedCount = (referrer.invited_friends || 0) + 1;
    const newCoins = (referrer.coins || 0) + 100;

    await pool.query(
      "UPDATE users SET invited_friends = $1, coins = $2 WHERE telegram_id = $3",
      [newInvitedCount, newCoins, referred_by]
    );

    console.log(`✅ REFERRAL SUCCESS: ${referred_by} invited ${telegram_id} (+100 coins, total: ${newInvitedCount} friends)`);

    res.json({ 
      success: true, 
      referrer: referred_by,
      coins_awarded: 100,
      total_invites: newInvitedCount
    });

  } catch (error) {
    console.error("❌ Referral check error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Tasks
// ---------------------------
app.get("/api/tasks", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;
    
    const userRes = await pool.query(
      "SELECT completed_tasks FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const completedTasks = userRes.rows[0].completed_tasks || [];

    const tasksWithStatus = Array.from(tasks.values()).map(task => ({
      ...task,
      completed: completedTasks.includes(task.id)
    }));

    res.json({ tasks: tasksWithStatus });

  } catch (error) {
    console.error("❌ Tasks fetch error:", error.message);
    res.json({
      tasks: Array.from(tasks.values()).map(t => ({
        ...t,
        completed: false,
      })),
    });
  }
});

app.post("/api/tasks/:id/complete", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;
    const taskId = req.params.id;

    const task = tasks.get(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const userRes = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const u = userRes.rows[0];
    const completed = u.completed_tasks || [];

    if (completed.includes(taskId)) {
      console.log(`⚠️ Task ${taskId} already completed by ${u.username}`);
      return res.status(400).json({ 
        error: "Task already completed",
        success: false
      });
    }

    const newCompleted = [...completed, taskId];
    const newCoins = (u.coins || 0) + task.points;
    
    const levelScores = u.level_scores || {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
    };
    levelScores[u.current_level] = (levelScores[u.current_level] || 0) + task.points;

    await pool.query(
      "UPDATE users SET completed_tasks = $1, coins = $2, level_scores = $3 WHERE telegram_id = $4",
      [newCompleted, newCoins, JSON.stringify(levelScores), telegramId]
    );

    console.log(`✅ TASK COMPLETED: ${u.username} - ${task.title} (+${task.points} coins, total: ${newCoins})`);

    res.json({ 
      success: true, 
      points: task.points, 
      totalCoins: newCoins,
      completedTasks: newCompleted
    });

  } catch (error) {
    console.error("❌ Task completion error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Game
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

    console.log(`🎮 Game completed: ${user.username} (+${coinsToAdd} coins, +${gemsToAdd} gems)`);

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
// Add coin when Makeda tapped
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
    console.error("❌ Makeda coin error:", err.message);
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
