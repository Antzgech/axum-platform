// bot.js — FINAL PRODUCTION VERSION
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN missing");
  process.exit(1);
}

if (!FRONTEND_URL) {
  console.error("❌ FRONTEND_URL missing");
  process.exit(1);
}

if (!BACKEND_URL) {
  console.error("❌ BACKEND_URL missing");
  process.exit(1);
}

console.log("🤖 Initializing Telegram Bot...");

// Create bot in webhook mode
const bot = new TelegramBot(BOT_TOKEN, { webHook: true });

// Register webhook
const webhookUrl = `${BACKEND_URL}/webhook`;
bot.setWebHook(webhookUrl);
console.log("🔗 Webhook set:", webhookUrl);

// ---------------------- /start ----------------------
bot.onText(/\/start(.*)/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "Warrior";

  const message =
    `👑 *Welcome, ${name}!*` +
    `\n\n⚜️ *Queen Makeda's Quest*` +
    `\nBegin your journey and earn rewards!`;

  const keyboard = {
    inline_keyboard: [
      [{ text: "🎮 Enter the Kingdom", web_app: { url: FRONTEND_URL } }],
      [
        { text: "👥 Invite Friends", callback_data: "invite" },
        { text: "📋 Tasks", callback_data: "tasks" }
      ],
      [
        { text: "🏆 Leaderboard", callback_data: "leaderboard" },
        { text: "ℹ️ Help", callback_data: "help" }
      ]
    ]
  };

  await bot.sendMessage(chatId, message, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
});

// ---------------------- Callback Buttons ----------------------
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Always answer callback to remove Telegram loading spinner
  bot.answerCallbackQuery(query.id);

  if (data === "tasks") {
    return bot.sendMessage(chatId, "📋 Opening tasks...", {
      reply_markup: {
        inline_keyboard: [[{ text: "📋 Open Tasks", web_app: { url: FRONTEND_URL } }]],
      },
    });
  }

  if (data === "leaderboard") {
    return bot.sendMessage(chatId, "🏆 Opening leaderboard...", {
      reply_markup: {
        inline_keyboard: [[{ text: "🏆 View Rankings", web_app: { url: FRONTEND_URL } }]],
      },
    });
  }

  if (data === "help") {
    return bot.sendMessage(chatId, "ℹ️ Help menu coming up...");
  }

  if (data === "invite") {
    const referralCode = Buffer.from(query.from.id.toString()).toString("base64");
    const link = `https://t.me/SabaQuest_bot?start=ref_${referralCode}`;

    return bot.sendMessage(
      chatId,
      `👥 Share your referral link:\n${link}`
    );
  }
});

// Export bot for webhook processing in server.js
module.exports = bot;
