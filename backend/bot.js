const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: false });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "⚜️ Welcome to Axum Kingdom ⚜️", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Enter the Kingdom",
            web_app: { url: process.env.FRONTEND_URL }
          }
        ]
      ]
    }
  });
});

module.exports = bot;