const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Default port fallback

// ---------- CORS ----------
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL,
        "https://t.me",
        "https://web.telegram.org"
      ].filter(Boolean); // Remove undefined values

      // Allow requests with no origin (like Railway health checks, curl, Postman)
      if (!origin) return callback(null, true);
      
      if (allowed.includes(origin)) return callback(null, true);
      if (/\.telegram\.org$/.test(origin)) return callback(null, true);

      // ✅ Allow in development or if no FRONTEND_URL is set
      if (!process.env.FRONTEND_URL) return callback(null, true);
      
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.set("trust proxy", 1);

// ---------- PostgreSQL ----------
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Test connection but don't block startup
  pool
    .query("SELECT NOW()")
    .then(() => console.log("✅ PostgreSQL Connected"))
    .catch((err) => {
      console.error("❌ DB Error:", err.message);
      console.error("⚠️  App will start but database operations will fail");
    });
} else {
  console.warn("⚠️  DATABASE_URL not set - database features disabled");
}

// ---------- Telegram Auth ----------
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-in-production";

function verifyTelegram(data) {
  if (!BOT_TOKEN) return false;
  
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
    // Check if database is available
    if (!pool) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { id, first_name, username, photo_url, auth_date, hash } = req.body;

    if (!id || !first_name || !auth_date || !hash) {
      return res.status(400).json({ error: "Invalid Telegram payload" });
    }

    if (!verifyTelegram(req.body)) {
      return res.status(403).json({ error: "Invalid Telegram authentication" });
    }

    let result = await pool.query(
      "SELECT * FROM tuser WHERE telegram_id=$1",
      [id]
    );

    let user;
    if (result.rows.length) {
      await pool.query(
        `UPDATE tuser
         SET username=$2, first_name=$3, photo_url=$4, last_active=NOW()
         WHERE telegram_id=$1`,
        [id, username || first_name, first_name, photo_url || ""]
      );
      result = await pool.query(
        "SELECT * FROM tuser WHERE telegram_id=$1",
        [id]
      );
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
    res.status(500).json({ error: "Auth failed", details: err.message });
  }
});

// ---------- Telegram Webhook ----------
let bot;
try {
  bot = require("./bot");
} catch (err) {
  console.warn("⚠️  Bot module not loaded:", err.message);
}

app.post("/webhook", (req, res) => {
  res.status(200).send("OK"); // respond immediately

  if (bot) {
    try {
      bot.processUpdate(req.body);
    } catch (err) {
      console.error("Webhook error:", err);
    }
  } else {
    console.warn("Bot not configured - webhook received but not processed");
  }
});

// ---------- Health Check ----------
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "SabaQuest Backend Running",
    timestamp: new Date().toISOString(),
    env: {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || "development",
      hasDatabase: !!pool,
      hasBotToken: !!BOT_TOKEN,
      hasFrontendUrl: !!process.env.FRONTEND_URL
    }
  });
});

// ---------- Additional Health Check Endpoint ----------
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// ---------- Start Server ----------
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💾 Database: ${pool ? "Connected" : "Not configured"}`);
  console.log(`🤖 Bot Token: ${BOT_TOKEN ? "Set" : "Not set"}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "Not set"}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
    if (pool) {
      pool.end().then(() => console.log("Database pool closed"));
    }
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, closing server...");
  server.close(() => {
    console.log("Server closed");
    if (pool) {
      pool.end().then(() => console.log("Database pool closed"));
    }
    process.exit(0);
  });
});