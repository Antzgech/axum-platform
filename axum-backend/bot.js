const axios = require('axios');

// ===============================
// 🔐 Load Environment Variables
// ===============================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME || "SabaQuest_bot";
const WEBAPP_URL = process.env.FRONTEND_URL;

// Debug: confirm token is loaded
console.log("Loaded BOT_TOKEN prefix:", BOT_TOKEN?.slice(0, 10));
console.log("Loaded BOT_USERNAME:", BOT_USERNAME);
console.log("Loaded WEBAPP_URL:", WEBAPP_URL);

// If token missing, warn
if (!BOT_TOKEN) {
  console.log("⚠️ No TELEGRAM_BOT_TOKEN found. Bot will not run.");
}


// ===============================
// 🤖 Send Start Message
// ===============================
async function sendStartMessage(chatId) {
  console.log("Sending start message to:", chatId);

  const payload = {
    chat_id: chatId,
    text: "Welcome to SabaQuest! Tap below to start your journey.",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open SabaQuest",
            web_app: { url: WEBAPP_URL }
          }
        ]
      ]
    }
  };

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    console.log("Calling Telegram API:", url);

    await axios.post(url, payload);

    console.log("Start message sent successfully");
  } catch (err) {
    console.error("❌ Telegram sendMessage error:", err.response?.data || err.message);
  }
}


// ===============================
// 🤖 Handle Incoming Updates
// ===============================
async function handleUpdate(update) {
  try {
    console.log("handleUpdate received:", JSON.stringify(update, null, 2));

    if (update.message && update.message.text === "/start") {
      const chatId = update.message.chat.id;
      await sendStartMessage(chatId);
    }
  } catch (err) {
    console.error("❌ Bot error:", err.response?.data || err.message);
  }
}


// ===============================
// 📤 Export Handler
// ===============================
module.exports = { handleUpdate };
