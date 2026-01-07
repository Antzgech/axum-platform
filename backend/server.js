const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

console.log("🔄 Starting SabaQuest Backend...");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------
// CORS + JSON
// ---------------------------
const FRONTEND_URL = process.env.FRONTEND_URL;
console.log("🌐 FRONTEND_URL:", FRONTEND_URL || "not set ❌");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://axum-frontend-production.up.railway.app",
      "https://web.telegram.org",
      "https://telegram.org",
      "https://t.me",
      /\.telegram\.org$/,
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors https://*.telegram.org https://web.telegram.org https://t.me 'self'"
  );
  next();
});

// ---------------------------
// PostgreSQL
// ---------------------------
const DATABASE_URL = process.env.DATABASE_URL;
console.log("📡 DATABASE_URL:", DATABASE_URL ? "Found ✅" : "Missing ❌");

const isLocalDb =
  DATABASE_URL && (DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1"));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

// DB sanity check
(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL Connected:", new Date().toISOString());
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
})();

// ---------------------------
// In-memory tasks
// ---------------------------
const tasks = new Map();
[
  { id: "1", type: "youtube", title: "Subscribe to Meten Official YouTube", points: 50, url: "https://www.youtube.com/@metenofficial", icon: "▶️" },
  { id: "2", type: "telegram", title: "Join Sabawians Telegram Group", points: 30, url: "https://t.me/+IoT_cwfs6EBjMTQ0", icon: "✈️" },
  { id: "3", type: "facebook", title: "Follow on Facebook", points: 40, url: "https://facebook.com/profile.php?id=61578048881192", icon: "👍" },
  { id: "4", type: "tiktok", title: "Follow on TikTok", points: 40, url: "https://tiktok.com/@metenofficials", icon: "🎵" },
  { id: "5", type: "instagram", title: "Follow on Instagram", points: 40, url: "https://instagram.com/metenofficial", icon: "📸" },
  { id: "6", type: "invite", title: "Invite 5 Friends", points: 100, url: null, icon: "👥" },
].forEach((t) => tasks.set(t.id, t));

// ---------------------------
// JWT Middleware
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
  res.json({ status: "ok", time: new Date() });
});

// ---------------------------
// Telegram Auth (with hash verification)
// ---------------------------
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function checkTelegramAuth(data, botToken) {
  const { hash, ...rest } = data;

  const dataCheckArr = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`);

  const dataCheckString = dataCheckArr.join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();

  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  return hmac === hash;
}

app.post("/api/auth/telegram", async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body || {};

    if (!id || !first_name || !auth_date || !hash) {
      return res.status(400).json({ error: "Invalid Telegram payload" });
    }

    const isLocalRequest = req.headers.host?.includes("localhost");

    if (!isLocalRequest && TELEGRAM_BOT_TOKEN) {
      const isValid = checkTelegramAuth(
        {
          id,
          first_name,
          last_name: last_name || "",
          username: username || "",
          photo_url: photo_url || "",
          auth_date,
          hash,
        },
        TELEGRAM_BOT_TOKEN
      );

      if (!isValid) {
        return res.status(403).json({ error: "Invalid Telegram authentication" });
      }
    }

    let dbUser = await pool.query("SELECT * FROM tuser WHERE telegram_id = $1", [id]);

    let user;

    if (dbUser.rows.length > 0) {
      await pool.query(
        `UPDATE tuser 
         SET last_active = NOW(),
             username = $2,
             first_name = $3,
             last_name = $4,
             photo_url = $5
         WHERE telegram_id = $1`,
        [id, username || first_name, first_name, last_name || "", photo_url || ""]
      );

      dbUser = await pool.query("SELECT * FROM tuser WHERE telegram_id = $1", [id]);
      user = dbUser.rows[0];
    } else {
      const newUser = await pool.query(
        `INSERT INTO tuser 
         (telegram_id, username, first_name, last_name, photo_url, current_level, coins, gems, points,
          last_checkin, checkin_streak, total_checkins, weekly_chest_claimed_week, last_streak_restore)
         VALUES ($1, $2, $3, $4, $5, 1, 0, 0, 0, NULL, 0, 0, NULL, NULL)
         RETURNING *`,
        [
          id,
          username || first_name || "User",
          first_name || "User",
          last_name || "",
          photo_url || "",
        ]
      );

      user = newUser.rows[0];
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
      user,
    });
  } catch (error) {
    res.status(500).json({ error: "Auth failed" });
  }
});

// ---------------------------
// Get Authenticated User (full data for Dashboard)
// ---------------------------
app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const { telegramId } = req.user;

    const result = await pool.query("SELECT * FROM tuser WHERE telegram_id = $1", [telegramId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Tasks
// ---------------------------
app.get("/api/tasks", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT completed_tasks FROM tuser WHERE telegram_id = $1",
      [req.user.telegramId]
    );

    const rawCompleted = result.rows[0]?.completed_tasks || {};
    const completedIds = Object.keys(rawCompleted);

    const allTasks = Array.from(tasks.values()).map((t) => ({
      ...t,
      completed: completedIds.includes(t.id),
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

// ---------------------------
// Add Coin (returns updated full user)
// ---------------------------
app.post("/api/user/add-coin", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const updated = await pool.query(
      `UPDATE tuser
       SET coins = coins + 1,
           last_active = NOW()
       WHERE telegram_id = $1
       RETURNING *`,
      [telegramId]
    );

    if (!updated.rowCount) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: updated.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Daily Check-In Rewards Table
// ---------------------------
const DAILY_REWARDS = {
  1: { coins: 10, gems: 0 },
  2: { coins: 20, gems: 0 },
  3: { coins: 30, gems: 1 },
  4: { coins: 40, gems: 1 },
  5: { coins: 50, gems: 2 },
  6: { coins: 60, gems: 2 },
  7: { coins: 100, gems: 5 },
};

// Weekly chest rewards (triggered after 7-day streak)
const WEEKLY_CHEST_REWARD = {
  coins: 300,
  gems: 10,
};

// Streak restore cost (in gems)
const STREAK_RESTORE_COST = 5;

// ---------------------------
// Server time (for countdowns)
// ---------------------------
app.get("/api/time", (req, res) => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  res.json({
    serverTime: now.toISOString(),
    msUntilMidnight,
  });
});

// ---------------------------
// Daily Check-In System
// ---------------------------
app.get("/api/checkin/status", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const result = await pool.query(
      "SELECT last_checkin, checkin_streak, total_checkins, weekly_chest_claimed_week FROM tuser WHERE telegram_id = $1",
      [telegramId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const now = new Date();
    const todayStr = now.toDateString();
    const lastCheckinStr = user.last_checkin ? new Date(user.last_checkin).toDateString() : null;

    const canClaim = lastCheckinStr !== todayStr;

    // Determine current week number (ISO week)
    const getWeekNumber = (date) => {
      const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
      return `${tmp.getUTCFullYear()}-W${weekNo}`;
    };

    const currentWeek = getWeekNumber(now);
    const weeklyChestClaimedWeek = user.weekly_chest_claimed_week;

    const canClaimWeeklyChest =
      (user.checkin_streak || 0) >= 7 && weeklyChestClaimedWeek !== currentWeek;

    res.json({
      canClaim,
      streak: user.checkin_streak || 0,
      totalCheckins: user.total_checkins || 0,
      canClaimWeeklyChest,
      currentWeek,
      weeklyChestClaimedWeek,
    });
  } catch (err) {
    console.error("Check-in status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/checkin/claim", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const result = await pool.query(
      "SELECT last_checkin, checkin_streak, total_checkins, coins, gems FROM tuser WHERE telegram_id = $1",
      [telegramId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const now = new Date();
    const todayStr = now.toDateString();
    const lastCheckinStr = user.last_checkin ? new Date(user.last_checkin).toDateString() : null;

    if (lastCheckinStr === todayStr) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    // Calculate streak
    let newStreak = user.checkin_streak || 0;
    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

    if (lastCheckinStr === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const rewardDay = ((newStreak - 1) % 7) + 1;
    const rewards = DAILY_REWARDS[rewardDay];

    if (!rewards) {
      return res.status(500).json({ error: "Invalid reward day" });
    }

    await pool.query(
      `UPDATE tuser 
       SET last_checkin = NOW(),
           checkin_streak = $1,
           total_checkins = total_checkins + 1,
           coins = coins + $2,
           gems = gems + $3
       WHERE telegram_id = $4`,
      [newStreak, rewards.coins, rewards.gems, telegramId]
    );

    res.json({
      success: true,
      rewards,
      newStreak,
    });
  } catch (err) {
    console.error("Check-in claim error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Weekly chest claim
// ---------------------------
app.post("/api/checkin/weekly-chest", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const result = await pool.query(
      "SELECT checkin_streak, weekly_chest_claimed_week, coins, gems FROM tuser WHERE telegram_id = $1",
      [telegramId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const now = new Date();

    const getWeekNumber = (date) => {
      const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
      return `${tmp.getUTCFullYear()}-W${weekNo}`;
    };

    const currentWeek = getWeekNumber(now);

    if ((user.checkin_streak || 0) < 7) {
      return res.status(400).json({ error: "Streak less than 7 days" });
    }

    if (user.weekly_chest_claimed_week === currentWeek) {
      return res.status(400).json({ error: "Weekly chest already claimed this week" });
    }

    await pool.query(
      `UPDATE tuser
       SET weekly_chest_claimed_week = $1,
           coins = coins + $2,
           gems = gems + $3
       WHERE telegram_id = $4`,
      [currentWeek, WEEKLY_CHEST_REWARD.coins, WEEKLY_CHEST_REWARD.gems, telegramId]
    );

    res.json({
      success: true,
      rewards: WEEKLY_CHEST_REWARD,
      week: currentWeek,
    });
  } catch (err) {
    console.error("Weekly chest claim error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Streak restore (using gems)
// ---------------------------
app.post("/api/checkin/restore-streak", auth, async (req, res) => {
  try {
    const telegramId = req.user.telegramId;

    const result = await pool.query(
      "SELECT last_checkin, checkin_streak, gems, last_streak_restore FROM tuser WHERE telegram_id = $1",
      [telegramId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const now = new Date();
    const todayStr = now.toDateString();
    const lastCheckinStr = user.last_checkin ? new Date(user.last_checkin).toDateString() : null;

    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
    const twoDaysAgoStr = new Date(Date.now() - 2 * 86400000).toDateString();

    // You can only restore if you missed exactly 1 day (gap of one day)
    if (!(lastCheckinStr === twoDaysAgoStr && todayStr !== yesterdayStr)) {
      return res.status(400).json({ error: "No restorable streak gap" });
    }

    if ((user.gems || 0) < STREAK_RESTORE_COST) {
      return res.status(400).json({ error: "Not enough gems" });
    }

    // Optional: prevent multiple restores per day
    if (user.last_streak_restore) {
      const lastRestoreStr = new Date(user.last_streak_restore).toDateString();
      if (lastRestoreStr === todayStr) {
        return res.status(400).json({ error: "Streak already restored today" });
      }
    }

    await pool.query(
      `UPDATE tuser
       SET gems = gems - $1,
           checkin_streak = checkin_streak + 1,
           last_streak_restore = NOW()
       WHERE telegram_id = $2`,
      [STREAK_RESTORE_COST, telegramId]
    );

    res.json({
      success: true,
      cost: STREAK_RESTORE_COST,
      newStreak: (user.checkin_streak || 0) + 1,
    });
  } catch (err) {
    console.error("Streak restore error:", err);
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
  ⚜️  SabaQuest Backend
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server: http://localhost:${PORT}
  💾 Database: PostgreSQL
  🤖 Bot: @SabaQuest_bot
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
