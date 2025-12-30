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
        "https://web.telegram.org",  
    "https://telegram.org",         
    "https://t.me"                 

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

// Init DB with all columns
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

    // Add missing columns if they don't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='coins') THEN
          ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='gems') THEN
          ALTER TABLE users ADD COLUMN gems INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_checkin') THEN
          ALTER TABLE users ADD COLUMN last_checkin DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='checkin_streak') THEN
          ALTER TABLE users ADD COLUMN checkin_streak INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_checkins') THEN
          ALTER TABLE users ADD COLUMN total_checkins INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='achievements') THEN
          ALTER TABLE users ADD COLUMN achievements JSONB DEFAULT '[]'::jsonb;
        END IF;
      END $$;
    `);
    console.log("✅ Database schema updated");

    const count = await pool.query("SELECT COUNT(*) FROM users");
    console.log(`📊 Current users in database: ${count.rows[0].count}`);
  } catch (error) {
    console.error("❌ Database error:", error.message);
  }
})();

// ---------------------------
// TASKS - 20 TOTAL
// ---------------------------
const tasks = new Map();
[
  {
    id: "1",
    type: "youtube",
    title: "Subscribe to Meten Official YouTube",
    description: "Subscribe and turn on notifications",
    points: 50,
    url: "https://www.youtube.com/@metenofficial",
    icon: "▶️",
  },
  {
    id: "2",
    type: "telegram",
    title: "Join Sabawians Telegram Group",
    description: "Join our community and say hello",
    points: 30,
    url: "https://t.me/+IoT_cwfs6EBjMTQ0",
    icon: "✈️",
  },
  {
    id: "3",
    type: "facebook",
    title: "Follow on Facebook",
    description: "Like our page and stay updated",
    points: 40,
    url: "https://facebook.com/profile.php?id=61578048881192",
    icon: "👍",
  },
  {
    id: "4",
    type: "tiktok",
    title: "Follow on TikTok",
    description: "Follow and watch our videos",
    points: 40,
    url: "https://tiktok.com/@metenofficials",
    icon: "🎵",
  },
  {
    id: "5",
    type: "instagram",
    title: "Follow on Instagram",
    description: "Follow us for daily updates",
    points: 40,
    url: "https://instagram.com/metenofficial",
    icon: "📸",
  },
  {
    id: "6",
    type: "twitter",
    title: "Follow on Twitter/X",
    description: "Follow and retweet our pinned post",
    points: 50,
    url: "https://twitter.com/yourhandle",
    icon: "🐦",
  },
  {
    id: "7",
    type: "youtube",
    title: "Watch Latest Video",
    description: "Watch our latest video (3+ minutes)",
    points: 30,
    url: "https://www.youtube.com/@metenofficial/videos",
    icon: "📺",
  },
  {
    id: "8",
    type: "telegram",
    title: "Join Announcement Channel",
    description: "Get exclusive updates and news",
    points: 25,
    url: "https://t.me/yourchannel",
    icon: "📢",
  },
  {
    id: "9",
    type: "share",
    title: "Share to 3 Friends",
    description: "Share the game with 3 Telegram friends",
    points: 100,
    url: null,
    icon: "🎁",
  },
  {
    id: "10",
    type: "instagram",
    title: "Share Instagram Story",
    description: "Share our post on your story",
    points: 75,
    url: "https://instagram.com/metenofficial",
    icon: "📱",
  },
  {
    id: "11",
    type: "engagement",
    title: "Play 5 Times",
    description: "Play the game 5 times",
    points: 150,
    url: null,
    icon: "🎮",
  },
  {
    id: "12",
    type: "engagement",
    title: "Reach Level 2",
    description: "Level up to Level 2",
    points: 200,
    url: null,
    icon: "⭐",
  },
  {
    id: "13",
    type: "engagement",
    title: "Collect 500 Coins",
    description: "Earn a total of 500 coins",
    points: 100,
    url: null,
    icon: "💰",
  },
  {
    id: "14",
    type: "engagement",
    title: "Login 3 Days Straight",
    description: "Login for 3 consecutive days",
    points: 250,
    url: null,
    icon: "📅",
  },
  {
    id: "15",
    type: "invite",
    title: "Invite 1 Friend",
    description: "Invite your first friend",
    points: 50,
    url: null,
    icon: "👤",
  },
  {
    id: "16",
    type: "invite",
    title: "Invite 5 Friends",
    description: "Grow your network",
    points: 300,
    url: null,
    icon: "👥",
  },
  {
    id: "17",
    type: "invite",
    title: "Invite 10 Friends",
    description: "Build your empire",
    points: 750,
    url: null,
    icon: "👨‍👩‍👧‍👦",
  },
  {
    id: "18",
    type: "engagement",
    title: "Tap Queen 50 Times",
    description: "Show your dedication",
    points: 200,
    url: null,
    icon: "👑",
  },
  {
    id: "19",
    type: "engagement",
    title: "Earn 50 Gems",
    description: "Collect precious gems",
    points: 300,
    url: null,
    icon: "💎",
  },
  {
    id: "20",
    type: "special",
    title: "Join Premium Club",
    description: "Unlock exclusive benefits",
    points: 1000,
    url: null,
    icon: "⚜️",
  }
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
// DAILY CHECK-IN REWARDS
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
// Health
// ---------------------------
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    database: "PostgreSQL", 
    bot: bot ? "active" : "inactive",
    tasks: tasks.size,
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
// Get current user
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
      tasks: tasks.size
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
// DAILY CHECK-IN ENDPOINTS
// ---------------------------
app.post("/api/checkin/claim", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const userRes = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];
    const today = new Date().toDateString();
    const lastCheckin = user.last_checkin ? new Date(user.last_checkin).toDateString() : null;

    if (lastCheckin === today) {
      return res.status(400).json({ 
        error: "Already checked in today",
        nextCheckin: "Come back tomorrow!"
      });
    }

    let newStreak = 1;
    if (lastCheckin) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastCheckin === yesterdayStr) {
        newStreak = (user.checkin_streak || 0) + 1;
      } else {
        newStreak = 1;
      }
    }

    const streakDay = newStreak > 7 ? ((newStreak - 1) % 7) + 1 : newStreak;
    const rewards = DAILY_REWARDS[streakDay] || { coins: 50, gems: 2, bonus: "Daily reward!" };

    await pool.query(
      `UPDATE users 
       SET coins = coins + $1,
           gems = gems + $2,
           last_checkin = CURRENT_DATE,
           checkin_streak = $3,
           total_checkins = COALESCE(total_checkins, 0) + 1,
           last_active = NOW()
       WHERE telegram_id = $4`,
      [rewards.coins, rewards.gems, newStreak, telegramId]
    );

    console.log(`✅ CHECK-IN: ${user.username} - Day ${newStreak} (+${rewards.coins} coins, +${rewards.gems} gems)`);

    res.json({
      success: true,
      streak: newStreak,
      rewards: rewards,
      totalCheckins: (user.total_checkins || 0) + 1,
      message: rewards.bonus
    });

  } catch (err) {
    console.error("Check-in error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/checkin/status", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const userRes = await pool.query(
      "SELECT last_checkin, checkin_streak, total_checkins FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];
    const today = new Date().toDateString();
    const lastCheckin = user.last_checkin ? new Date(user.last_checkin).toDateString() : null;

    const canClaim = lastCheckin !== today;
    const streak = user.checkin_streak || 0;
    const streakDay = streak >= 7 ? ((streak % 7) || 7) : (streak + 1);
    const nextRewards = DAILY_REWARDS[streakDay] || { coins: 50, gems: 2, bonus: "Daily reward!" };

    res.json({
      canClaim,
      streak,
      totalCheckins: user.total_checkins || 0,
      lastCheckin: user.last_checkin,
      nextRewards
    });

  } catch (err) {
    console.error("Check-in status error:", err.message);
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









