const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME || "SabaQuest_bot";
const WEBAPP_URL = process.env.FRONTEND_URL;

if (!BOT_TOKEN) {
  console.log("⚠️ No TELEGRAM_BOT_TOKEN found. Bot will not run.");
}

async function sendStartMessage(chatId) {
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

  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, payload);
}

async function handleUpdate(update) {
  try {
    if (update.message && update.message.text === "/start") {
      const chatId = update.message.chat.id;
      await sendStartMessage(chatId);
    }
  } catch (err) {
    console.error("Bot error:", err.response?.data || err.message);
  }
}

module.exports = { handleUpdate };
