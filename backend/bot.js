// bot.js - Telegram Bot Handler
// Add this file to your backend

const TelegramBot = require('node-telegram-bot-api');

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://axum-frontend-production.up.railway.app';

// Welcome message and buttons
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Player';
  
  const welcomeMessage = `
🏆 *Welcome to Queen Makeda's Quest, ${firstName}!* 🏆

Embark on a legendary journey from Axum to Jerusalem!

✨ *What Awaits You:*
• 6 Epic Levels to conquer
• Real rewards and prizes 💰
• Compete on global leaderboards 📊
• Complete exciting tasks 🎮
• Earn badges and achievements 🏅

*Powered by Sabawians Company* ⚔️

Click the button below to begin your adventure! 👇
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🎮 Play Queen Makeda\'s Quest',
          web_app: { url: FRONTEND_URL }
        }
      ],
      [
        { text: '📊 Leaderboard', callback_data: 'leaderboard' },
        { text: '🎯 My Stats', callback_data: 'stats' }
      ],
      [
        { text: '📋 Tasks', callback_data: 'tasks' },
        { text: '🏆 Rewards', callback_data: 'rewards' }
      ],
      [
        { text: 'ℹ️ Help', callback_data: 'help' }
      ]
    ]
  };

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Handle /play command
bot.onText(/\/play/, (msg) => {
  const chatId = msg.chat.id;
  
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🎮 Play Now',
          web_app: { url: FRONTEND_URL }
        }
      ]
    ]
  };

  bot.sendMessage(chatId, '🎮 *Ready to play?* Click below to start!', {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📖 *How to Play Queen Makeda's Quest*

*Commands:*
/start - Begin your quest
/play - Open the game
/stats - View your statistics
/tasks - See available tasks
/leaderboard - View rankings
/rewards - Check your rewards
/help - Show this help message

*How it Works:*
1️⃣ Complete tasks (subscribe, follow, invite)
2️⃣ Earn points and badges
3️⃣ Progress through 6 levels
4️⃣ Compete on leaderboards
5️⃣ Win real rewards!

*Need Support?*
📧 Email: sabawians@gmail.com

*Happy questing!* ⚔️
  `.trim();

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Handle /stats command
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // You can fetch user stats from your database here
  const statsMessage = `
📊 *Your Statistics*

Click "Play" to view your full stats in the game!
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🎮 View Full Stats',
          web_app: { url: `${FRONTEND_URL}/dashboard` }
        }
      ]
    ]
  };

  bot.sendMessage(chatId, statsMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Handle /tasks command
bot.onText(/\/tasks/, (msg) => {
  const chatId = msg.chat.id;
  
  const tasksMessage = `
📋 *Available Tasks*

✅ Subscribe to YouTube - 50 points
✅ Join Telegram Group - 30 points
✅ Follow on Facebook - 40 points
✅ Follow on TikTok - 40 points
✅ Follow on Instagram - 40 points
✅ Invite 5 Friends - 100 points

Click below to complete tasks!
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🎯 Complete Tasks',
          web_app: { url: `${FRONTEND_URL}/tasks` }
        }
      ]
    ]
  };

  bot.sendMessage(chatId, tasksMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Handle /leaderboard command
bot.onText(/\/leaderboard/, (msg) => {
  const chatId = msg.chat.id;
  
  const leaderboardMessage = `
🏆 *Global Leaderboard*

Click below to view top players and finalists!
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📊 View Leaderboard',
          web_app: { url: `${FRONTEND_URL}/leaderboard` }
        }
      ]
    ]
  };

  bot.sendMessage(chatId, leaderboardMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Handle /rewards command
bot.onText(/\/rewards/, (msg) => {
  const chatId = msg.chat.id;
  
  const rewardsMessage = `
🏆 *Your Rewards*

Click below to view and claim your rewards!
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '💰 View Rewards',
          web_app: { url: `${FRONTEND_URL}/rewards` }
        }
      ]
    ]
  };

  bot.sendMessage(chatId, rewardsMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Handle callback queries (button clicks)
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  switch(data) {
    case 'leaderboard':
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, '📊 Opening leaderboard...', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏆 View Leaderboard', web_app: { url: `${FRONTEND_URL}/leaderboard` } }]
          ]
        }
      });
      break;
      
    case 'stats':
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, '📈 Opening your stats...', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 View Stats', web_app: { url: `${FRONTEND_URL}/dashboard` } }]
          ]
        }
      });
      break;
      
    case 'tasks':
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, '📋 Opening tasks...', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 View Tasks', web_app: { url: `${FRONTEND_URL}/tasks` } }]
          ]
        }
      });
      break;
      
    case 'rewards':
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, '💰 Opening rewards...', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏆 View Rewards', web_app: { url: `${FRONTEND_URL}/rewards` } }]
          ]
        }
      });
      break;
      
    case 'help':
      bot.answerCallbackQuery(query.id);
      const helpMsg = `
📖 *Need Help?*

Email: sabawians@gmail.com
Telegram Support: @AxumSupport

Visit our FAQ in the game for more help!
      `.trim();
      bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
      break;
      
    default:
      bot.answerCallbackQuery(query.id);
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Bot polling error:', error);
});

console.log('🤖 Telegram Bot is running...');

module.exports = bot;
