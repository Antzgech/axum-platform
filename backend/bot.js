const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://axum-frontend-production.up.railway.app';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables!');
  process.exit(1);
}

// Create bot - NO POLLING (webhook mode for Railway)
const bot = new TelegramBot(BOT_TOKEN, {
  polling: false,
  webHook: false
});

console.log('🤖 Telegram Bot initialized (webhook mode)');

// Suppress polling errors
bot.on('polling_error', () => {});
bot.on('error', () => {});

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Warrior';
  
  try {
    const message = `👋 Welcome, ${firstName}!\n\n🏛️ *Queen Makeda's Quest*\n\nEmbark on an epic journey from Axum to Jerusalem!\n\n🎮 Play games\n💰 Earn coins & gems\n⭐ Level up\n👥 Invite friends\n\nReady to begin your adventure?`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🎮 Play Now',
            web_app: { url: FRONTEND_URL }
          }
        ],
        [
          { text: '📋 Tasks', callback_data: 'tasks' },
          { text: '👥 Invite', callback_data: 'invite' }
        ],
        [
          { text: '🏆 Leaderboard', callback_data: 'leaderboard' },
          { text: 'ℹ️ Help', callback_data: 'help' }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }).catch(err => {
      console.log('Send message error:', err.message);
    });

    console.log(`✅ /start command from ${firstName} (${chatId})`);
  } catch (error) {
    console.log('Start command error:', error.message);
  }
});

// /play command
bot.onText(/\/play/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🎮 Open Game',
            web_app: { url: FRONTEND_URL }
          }
        ]
      ]
    };

    await bot.sendMessage(chatId, '🎮 Ready to play? Click below to start!', {
      reply_markup: keyboard
    }).catch(err => {
      console.log('Send message error:', err.message);
    });

    console.log(`✅ /play command from ${chatId}`);
  } catch (error) {
    console.log('Play command error:', error.message);
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const helpText = `🏛️ *Queen Makeda's Quest - Help*\n\n*Commands:*\n/start - Start the game\n/play - Open game\n/help - Show this help\n\n*How to Play:*\n1. Tap Queen Makeda to earn coins\n2. Complete tasks for rewards\n3. Invite friends to get bonuses\n4. Level up to unlock new features\n\n*Features:*\n🎮 Ethiopian Games (Gebeta)\n📅 Daily Check-in Rewards\n👥 Referral System\n🏆 Leaderboard\n⭐ 6 Levels to Master\n\nGood luck, Warrior! 🗡️`;

    await bot.sendMessage(chatId, helpText, {
      parse_mode: 'Markdown'
    }).catch(err => {
      console.log('Send message error:', err.message);
    });

    console.log(`✅ /help command from ${chatId}`);
  } catch (error) {
    console.log('Help command error:', error.message);
  }
});

// Handle callback queries (button clicks)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    // Answer callback to remove loading state
    await bot.answerCallbackQuery(query.id).catch(() => {});

    if (data === 'tasks') {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '📋 Open Tasks',
              web_app: { url: `${FRONTEND_URL}/tasks` }
            }
          ]
        ]
      };

      await bot.sendMessage(chatId, '📋 Complete tasks to earn coins and gems!', {
        reply_markup: keyboard
      }).catch(err => {
        console.log('Send message error:', err.message);
      });
    } 
    else if (data === 'invite') {
      const userId = query.from.id;
      const referralCode = Buffer.from(userId.toString()).toString('base64');
      const referralLink = `https://t.me/SabaQuest_bot?start=ref_${referralCode}`;

      await bot.sendMessage(
        chatId,
        `👥 *Invite Friends!*\n\nShare your link and earn rewards when friends join:\n\n${referralLink}\n\n*Rewards:*\n🎁 1 friend: 50 coins + 1 gem\n🎉 5 friends: 300 coins + 3 gems\n🏆 10 friends: 750 coins + 10 gems`,
        { parse_mode: 'Markdown' }
      ).catch(err => {
        console.log('Send message error:', err.message);
      });
    }
    else if (data === 'leaderboard') {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🏆 View Leaderboard',
              web_app: { url: `${FRONTEND_URL}/leaderboard` }
            }
          ]
        ]
      };

      await bot.sendMessage(chatId, '🏆 See who are the top warriors!', {
        reply_markup: keyboard
      }).catch(err => {
        console.log('Send message error:', err.message);
      });
    }
    else if (data === 'help') {
      const helpText = `🏛️ *Queen Makeda's Quest*\n\n*How to Play:*\n1. Tap Queen Makeda to earn coins\n2. Complete tasks for rewards\n3. Invite friends to get bonuses\n4. Level up to unlock new features\n\nGood luck! 🗡️`;

      await bot.sendMessage(chatId, helpText, {
        parse_mode: 'Markdown'
      }).catch(err => {
        console.log('Send message error:', err.message);
      });
    }

    console.log(`✅ Callback query: ${data} from ${chatId}`);
  } catch (error) {
    console.log('Callback query error:', error.message);
  }
});

// Handle web app data (if needed)
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  console.log('Web app data received:', msg.web_app_data.data);
  
  try {
    await bot.sendMessage(chatId, 'Thanks for using the app!').catch(err => {
      console.log('Send message error:', err.message);
    });
  } catch (error) {
    console.log('Web app data error:', error.message);
  }
});

// Error handling
bot.on('error', (error) => {
  // Silently ignore errors (Railway webhook issues)
});

bot.on('polling_error', (error) => {
  // Silently ignore polling errors
});

console.log('✅ Bot commands registered:');
console.log('   /start - Start the game');
console.log('   /play - Open game');
console.log('   /help - Show help');

module.exports = bot;
