const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.FRONTEND_URL;

console.log("Loaded BOT_TOKEN prefix:", BOT_TOKEN?.slice(0, 10));
console.log("Loaded WEBAPP_URL:", WEBAPP_URL);

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
    console.error("Telegram sendMessage error:", err.response?.data || err.message);
  }
}

async function handleUpdate(update) {
  try {
    console.log("handleUpdate received:", JSON.stringify(update, null, 2));

    if (update.message && update.message.text === "/start") {
      const chatId = update.message.chat.id;
      await sendStartMessage(chatId);
    }
  } catch (err) {
    console.error("Bot error:", err.response?.data || err.message);
  }
}

module.exports = { handleUpdate };
