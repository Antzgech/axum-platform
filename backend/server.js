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



/*



// ENHANCED server.js - ADD THESE SECTIONS

// ---------------------------
// EXPANDED TASKS (20 total)
// ---------------------------
const tasks = new Map();
[
  // Existing tasks
  {
    id: "1",
    type: "youtube",
    title: "Subscribe to Meten Official YouTube",
    description: "Subscribe and turn on notifications",
    points: 50,
    url: "https://www.youtube.com/@metenofficial",
    icon: "▶️",
    difficulty: "easy"
  },
  {
    id: "2",
    type: "telegram",
    title: "Join Sabawians Telegram Group",
    description: "Join our community and say hello",
    points: 30,
    url: "https://t.me/+IoT_cwfs6EBjMTQ0",
    icon: "✈️",
    difficulty: "easy"
  },
  {
    id: "3",
    type: "facebook",
    title: "Follow on Facebook",
    description: "Like our page and stay updated",
    points: 40,
    url: "https://facebook.com/profile.php?id=61578048881192",
    icon: "👍",
    difficulty: "easy"
  },
  {
    id: "4",
    type: "tiktok",
    title: "Follow on TikTok",
    description: "Follow and watch our videos",
    points: 40,
    url: "https://tiktok.com/@metenofficials",
    icon: "🎵",
    difficulty: "easy"
  },
  {
    id: "5",
    type: "instagram",
    title: "Follow on Instagram",
    description: "Follow us for daily updates",
    points: 40,
    url: "https://instagram.com/metenofficial",
    icon: "📸",
    difficulty: "easy"
  },
  
  // NEW SOCIAL TASKS
  {
    id: "6",
    type: "twitter",
    title: "Follow on Twitter/X",
    description: "Follow and retweet our pinned post",
    points: 50,
    url: "https://twitter.com/yourhandle",
    icon: "🐦",
    difficulty: "easy"
  },
  {
    id: "7",
    type: "youtube",
    title: "Watch Latest Video",
    description: "Watch our latest video (3+ minutes)",
    points: 30,
    url: "https://www.youtube.com/@metenofficial/videos",
    icon: "📺",
    difficulty: "easy"
  },
  {
    id: "8",
    type: "telegram",
    title: "Join Announcement Channel",
    description: "Get exclusive updates and news",
    points: 25,
    url: "https://t.me/yourchannel",
    icon: "📢",
    difficulty: "easy"
  },
  {
    id: "9",
    type: "share",
    title: "Share to 3 Friends",
    description: "Share the game with 3 Telegram friends",
    points: 100,
    url: null,
    icon: "🎁",
    difficulty: "medium"
  },
  {
    id: "10",
    type: "instagram",
    title: "Share Instagram Story",
    description: "Share our post on your story",
    points: 75,
    url: "https://instagram.com/metenofficial",
    icon: "📱",
    difficulty: "medium"
  },
  
  // ENGAGEMENT TASKS
  {
    id: "11",
    type: "engagement",
    title: "Play 5 Times",
    description: "Play the game 5 times",
    points: 150,
    url: null,
    icon: "🎮",
    difficulty: "medium"
  },
  {
    id: "12",
    type: "engagement",
    title: "Reach Level 2",
    description: "Level up to Level 2",
    points: 200,
    url: null,
    icon: "⭐",
    difficulty: "medium"
  },
  {
    id: "13",
    type: "engagement",
    title: "Collect 500 Coins",
    description: "Earn a total of 500 coins",
    points: 100,
    url: null,
    icon: "💰",
    difficulty: "medium"
  },
  {
    id: "14",
    type: "engagement",
    title: "Login 3 Days Straight",
    description: "Login for 3 consecutive days",
    points: 250,
    url: null,
    icon: "📅",
    difficulty: "hard"
  },
  
  // REFERRAL TASKS
  {
    id: "15",
    type: "invite",
    title: "Invite 1 Friend",
    description: "Invite your first friend",
    points: 50,
    url: null,
    icon: "👤",
    difficulty: "easy"
  },
  {
    id: "16",
    type: "invite",
    title: "Invite 5 Friends",
    description: "Grow your network",
    points: 300,
    url: null,
    icon: "👥",
    difficulty: "medium"
  },
  {
    id: "17",
    type: "invite",
    title: "Invite 10 Friends",
    description: "Build your empire",
    points: 750,
    url: null,
    icon: "👨‍👩‍👧‍👦",
    difficulty: "hard"
  },
  
  // PREMIUM TASKS
  {
    id: "18",
    type: "engagement",
    title: "Tap Queen 50 Times",
    description: "Show your dedication",
    points: 200,
    url: null,
    icon: "👑",
    difficulty: "hard"
  },
  {
    id: "19",
    type: "engagement",
    title: "Earn 50 Gems",
    description: "Collect precious gems",
    points: 300,
    url: null,
    icon: "💎",
    difficulty: "hard"
  },
  {
    id: "20",
    type: "special",
    title: "Join Premium Club",
    description: "Unlock exclusive benefits",
    points: 1000,
    url: null,
    icon: "⚜️",
    difficulty: "legendary"
  }
].forEach((t) => tasks.set(t.id, t));

console.log(`✅ Loaded ${tasks.size} tasks`);

// ---------------------------
// DAILY CHECK-IN SYSTEM
// ---------------------------

// Add to database schema
// ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checkin DATE;
// ALTER TABLE users ADD COLUMN IF NOT EXISTS checkin_streak INTEGER DEFAULT 0;
// ALTER TABLE users ADD COLUMN IF NOT EXISTS total_checkins INTEGER DEFAULT 0;

// Daily check-in rewards (escalating)
const DAILY_REWARDS = {
  1: { coins: 10, gems: 0, bonus: "First day!" },
  2: { coins: 20, gems: 0, bonus: "Keep going!" },
  3: { coins: 30, gems: 1, bonus: "3 day streak!" },
  4: { coins: 40, gems: 1, bonus: "Almost there!" },
  5: { coins: 50, gems: 2, bonus: "5 day streak!" },
  6: { coins: 60, gems: 2, bonus: "One more!" },
  7: { coins: 100, gems: 5, bonus: "🎉 Week Complete!" },
  // After 7 days, cycle repeats with 50 coins + 2 gems
};

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

    // Check if already checked in today
    if (lastCheckin === today) {
      return res.status(400).json({ 
        error: "Already checked in today",
        nextCheckin: "Come back tomorrow!"
      });
    }

    // Calculate streak
    let newStreak = 1;
    if (lastCheckin) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastCheckin === yesterdayStr) {
        // Consecutive day
        newStreak = (user.checkin_streak || 0) + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    // Get rewards based on streak
    const streakDay = newStreak > 7 ? ((newStreak - 1) % 7) + 1 : newStreak;
    const rewards = DAILY_REWARDS[streakDay] || { coins: 50, gems: 2, bonus: "Daily reward!" };

    // Update database
    await pool.query(
      `UPDATE users 
       SET coins = coins + $1,
           gems = gems + $2,
           last_checkin = CURRENT_DATE,
           checkin_streak = $3,
           total_checkins = total_checkins + 1,
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

// Get check-in status
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
    const streakDay = streak > 7 ? ((streak - 1) % 7) + 1 : (streak + 1);
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
// ACHIEVEMENT SYSTEM
// ---------------------------

const ACHIEVEMENTS = {
  first_tap: {
    id: "first_tap",
    title: "First Steps",
    description: "Tap Queen Makeda for the first time",
    icon: "👑",
    reward: { coins: 10, gems: 0 },
    requirement: { type: "taps", value: 1 }
  },
  coin_collector_100: {
    id: "coin_collector_100",
    title: "Coin Collector",
    description: "Collect 100 coins",
    icon: "💰",
    reward: { coins: 50, gems: 1 },
    requirement: { type: "coins", value: 100 }
  },
  coin_collector_500: {
    id: "coin_collector_500",
    title: "Treasure Hunter",
    description: "Collect 500 coins",
    icon: "🏆",
    reward: { coins: 100, gems: 2 },
    requirement: { type: "coins", value: 500 }
  },
  coin_collector_1000: {
    id: "coin_collector_1000",
    title: "Wealthy Merchant",
    description: "Collect 1,000 coins",
    icon: "👑",
    reward: { coins: 200, gems: 5 },
    requirement: { type: "coins", value: 1000 }
  },
  task_master_5: {
    id: "task_master_5",
    title: "Getting Started",
    description: "Complete 5 tasks",
    icon: "✅",
    reward: { coins: 50, gems: 1 },
    requirement: { type: "tasks", value: 5 }
  },
  task_master_10: {
    id: "task_master_10",
    title: "Task Master",
    description: "Complete 10 tasks",
    icon: "🎯",
    reward: { coins: 150, gems: 3 },
    requirement: { type: "tasks", value: 10 }
  },
  social_butterfly: {
    id: "social_butterfly",
    title: "Social Butterfly",
    description: "Complete all social media tasks",
    icon: "🦋",
    reward: { coins: 200, gems: 5 },
    requirement: { type: "social_tasks", value: 5 }
  },
  friend_maker_1: {
    id: "friend_maker_1",
    title: "First Friend",
    description: "Invite 1 friend",
    icon: "👤",
    reward: { coins: 25, gems: 1 },
    requirement: { type: "invites", value: 1 }
  },
  friend_maker_5: {
    id: "friend_maker_5",
    title: "Social Connector",
    description: "Invite 5 friends",
    icon: "👥",
    reward: { coins: 150, gems: 3 },
    requirement: { type: "invites", value: 5 }
  },
  friend_maker_10: {
    id: "friend_maker_10",
    title: "Community Leader",
    description: "Invite 10 friends",
    icon: "👨‍👩‍👧‍👦",
    reward: { coins: 500, gems: 10 },
    requirement: { type: "invites", value: 10 }
  },
  level_up_2: {
    id: "level_up_2",
    title: "Rising Star",
    description: "Reach Level 2",
    icon: "⭐",
    reward: { coins: 100, gems: 2 },
    requirement: { type: "level", value: 2 }
  },
  level_up_3: {
    id: "level_up_3",
    title: "Elite Warrior",
    description: "Reach Level 3",
    icon: "⚔️",
    reward: { coins: 300, gems: 5 },
    requirement: { type: "level", value: 3 }
  },
  daily_warrior_3: {
    id: "daily_warrior_3",
    title: "Dedicated",
    description: "Login 3 days in a row",
    icon: "📅",
    reward: { coins: 100, gems: 2 },
    requirement: { type: "streak", value: 3 }
  },
  daily_warrior_7: {
    id: "daily_warrior_7",
    title: "Loyal Servant",
    description: "Login 7 days in a row",
    icon: "🔥",
    reward: { coins: 300, gems: 5 },
    requirement: { type: "streak", value: 7 }
  },
  gem_collector_10: {
    id: "gem_collector_10",
    title: "Gem Collector",
    description: "Collect 10 gems",
    icon: "💎",
    reward: { coins: 200, gems: 5 },
    requirement: { type: "gems", value: 10 }
  }
};

// Check and award achievements
app.post("/api/achievements/check", auth, async (req, res) => {
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
    const earned = user.achievements || [];
    const newAchievements = [];

    // Check each achievement
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (earned.includes(achievement.id)) continue; // Already earned

      let qualifies = false;

      switch (achievement.requirement.type) {
        case "coins":
          qualifies = user.coins >= achievement.requirement.value;
          break;
        case "gems":
          qualifies = user.gems >= achievement.requirement.value;
          break;
        case "tasks":
          qualifies = (user.completed_tasks || []).length >= achievement.requirement.value;
          break;
        case "social_tasks":
          const socialTasks = (user.completed_tasks || []).filter(id => 
            ["1", "2", "3", "4", "5", "6"].includes(id)
          );
          qualifies = socialTasks.length >= achievement.requirement.value;
          break;
        case "invites":
          qualifies = (user.invited_friends || 0) >= achievement.requirement.value;
          break;
        case "level":
          qualifies = user.current_level >= achievement.requirement.value;
          break;
        case "streak":
          qualifies = (user.checkin_streak || 0) >= achievement.requirement.value;
          break;
      }

      if (qualifies) {
        newAchievements.push(achievement);
      }
    }

    // Award new achievements
    if (newAchievements.length > 0) {
      const newEarned = [...earned, ...newAchievements.map(a => a.id)];
      const totalCoins = newAchievements.reduce((sum, a) => sum + a.reward.coins, 0);
      const totalGems = newAchievements.reduce((sum, a) => sum + a.reward.gems, 0);

      await pool.query(
        `UPDATE users 
         SET achievements = $1,
             coins = coins + $2,
             gems = gems + $3,
             last_active = NOW()
         WHERE telegram_id = $4`,
        [JSON.stringify(newEarned), totalCoins, totalGems, telegramId]
      );

      console.log(`🏆 ACHIEVEMENTS: ${user.username} earned ${newAchievements.length} achievements!`);

      res.json({
        success: true,
        newAchievements,
        totalCoins,
        totalGems
      });
    } else {
      res.json({
        success: true,
        newAchievements: [],
        totalCoins: 0,
        totalGems: 0
      });
    }

  } catch (err) {
    console.error("Achievement check error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all achievements
app.get("/api/achievements", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const userRes = await pool.query(
      "SELECT achievements FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    const earned = userRes.rows[0]?.achievements || [];

    const allAchievements = Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      earned: earned.includes(achievement.id)
    }));

    res.json({ achievements: allAchievements });

  } catch (err) {
    console.error("Get achievements error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// REFERRAL SYSTEM
// ---------------------------

// Generate referral code
app.get("/api/referral/code", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;
    
    // Referral code is just the telegram_id encoded
    const referralCode = Buffer.from(telegramId.toString()).toString('base64');
    const referralLink = `https://t.me/SabaQuest_bot?start=ref_${referralCode}`;

    res.json({
      referralCode,
      referralLink,
      telegramId
    });

  } catch (err) {
    console.error("Referral code error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Process referral (call this on new user registration)
app.post("/api/referral/claim", async (req, res) => {
  try {
    const { newUserId, referralCode } = req.body;

    if (!referralCode) {
      return res.json({ success: false, message: "No referral code" });
    }

    // Decode referral code to get referrer's telegram_id
    const referrerId = Buffer.from(referralCode, 'base64').toString();

    if (referrerId === newUserId.toString()) {
      return res.status(400).json({ error: "Cannot refer yourself" });
    }

    // Check if referrer exists
    const referrerRes = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [referrerId]
    );

    if (referrerRes.rows.length === 0) {
      return res.status(404).json({ error: "Referrer not found" });
    }

    // Reward referrer
    const REFERRAL_BONUS = 50; // coins per referral
    const REFERRAL_GEMS = 1;   // gems per referral

    await pool.query(
      `UPDATE users 
       SET invited_friends = invited_friends + 1,
           coins = coins + $1,
           gems = gems + $2
       WHERE telegram_id = $3`,
      [REFERRAL_BONUS, REFERRAL_GEMS, referrerId]
    );

    // Give bonus to new user too
    await pool.query(
      `UPDATE users 
       SET coins = coins + 25
       WHERE telegram_id = $1`,
      [newUserId]
    );

    console.log(`🎁 REFERRAL: User ${referrerId} referred ${newUserId} (+${REFERRAL_BONUS} coins)`);

    res.json({
      success: true,
      referrerBonus: { coins: REFERRAL_BONUS, gems: REFERRAL_GEMS },
      newUserBonus: { coins: 25 }
    });

  } catch (err) {
    console.error("Referral claim error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get referral stats
app.get("/api/referral/stats", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const userRes = await pool.query(
      "SELECT invited_friends FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const invitedFriends = userRes.rows[0].invited_friends || 0;
    const totalEarned = invitedFriends * 50; // 50 coins per friend
    const gemsEarned = invitedFriends * 1;   // 1 gem per friend

    res.json({
      invitedFriends,
      totalEarned: { coins: totalEarned, gems: gemsEarned },
      nextMilestone: invitedFriends < 5 ? 5 : (invitedFriends < 10 ? 10 : 25)
    });

  } catch (err) {
    console.error("Referral stats error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});








*/
