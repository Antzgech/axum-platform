const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: false,
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Welcome to SabaQuest! ⚜️", {
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
