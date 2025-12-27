const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://axum-frontend-production.up.railway.app';

if (!BOT_TOKEN) {
  console.log('⚠️  No TELEGRAM_BOT_TOKEN - bot disabled');
  module.exports = null;
  return;
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Player';
  
  const message = `🏆 *Welcome to Queen Makeda's Quest, ${firstName}!* 🏆

Embark on a legendary journey from Axum to Jerusalem!

✨ *Features:*
• 6 Epic Levels
• Real Rewards 💰
• Global Leaderboards 📊
• Exciting Tasks 🎮

*Sabawians Company* ⚔️

Click Play below to start! 👇`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '🎮 Play Queen Makeda\'s Quest', web_app: { url: FRONTEND_URL } }],
      [
        { text: '📊 Leaderboard', callback_data: 'leaderboard' },
        { text: '🎯 My Stats', callback_data: 'stats' }
      ],
      [{ text: 'ℹ️ Help', callback_data: 'help' }]
    ]
  };

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Other commands
bot.onText(/\/help/, (msg) => {
  const helpMsg = `📖 *How to Play*

/start - Begin your quest
/play - Open the game
/help - Show this message

*Support:* sabawians@gmail.com`;
  bot.sendMessage(msg.chat.id, helpMsg, { parse_mode: 'Markdown' });
});

bot.onText(/\/play/, (msg) => {
  const keyboard = {
    inline_keyboard: [[{
      text: '🎮 Play Now',
      web_app: { url: FRONTEND_URL }
    }]]
  };
  bot.sendMessage(msg.chat.id, 'Ready to play? Click below!', { reply_markup: keyboard });
});

// Button callbacks
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  
  bot.answerCallbackQuery(query.id);
  
  switch(query.data) {
    case 'leaderboard':
    case 'stats':
    case 'help':
      bot.sendMessage(chatId, 'Opening in game...', {
        reply_markup: {
          inline_keyboard: [[{
            text: '🎮 Open Game',
            web_app: { url: FRONTEND_URL }
          }]]
        }
      });
      break;
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.log('Bot error:', error.code);
});

console.log('🤖 Telegram Bot initialized');

module.exports = bot;
