const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://axum-frontend-production.up.railway.app';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found!');
  process.exit(1);
}

console.log('🤖 Initializing Telegram Bot...');
console.log('🌐 Frontend URL:', FRONTEND_URL);

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

console.log('✅ Bot polling started');

// /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Warrior';
  const startParam = match[1].trim();
  
  console.log(`📱 /start from ${firstName} (${chatId})`, startParam ? `with param: ${startParam}` : '');

  try {
    const message = `👋 *Welcome, ${firstName}!*\n\n` +
      `🏛️ *Queen Makeda's Quest*\n\n` +
      `Embark on an epic journey from Axum to Jerusalem!\n\n` +
      `🎮 Play games to earn coins\n` +
      `💰 Complete tasks for rewards\n` +
      `⭐ Level up your character\n` +
      `👥 Invite friends to get bonuses\n\n` +
      `*Ready to begin your adventure?*`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🎮 Play Now',
            web_app: { url: FRONTEND_URL }
          }
        ],
        [
          { text: '👥 Invite Friends', callback_data: 'invite' },
          { text: '📋 Tasks', callback_data: 'tasks' }
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
    });

    console.log(`✅ Welcome sent to ${firstName}`);
  } catch (error) {
    console.error('❌ Start error:', error.message);
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

    await bot.sendMessage(
      chatId, 
      '🎮 *Ready to play?*\n\nClick below to start your adventure!',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );

    console.log(`✅ /play sent to ${chatId}`);
  } catch (error) {
    console.error('❌ Play error:', error.message);
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const helpText = `🏛️ *Queen Makeda's Quest - Help*\n\n` +
      `*Commands:*\n` +
      `/start - Start the game\n` +
      `/play - Open game\n` +
      `/invite - Get referral link\n` +
      `/help - Show this help\n\n` +
      `*How to Play:*\n` +
      `1️⃣ Tap Queen Makeda to earn coins\n` +
      `2️⃣ Play Gebeta game for rewards\n` +
      `3️⃣ Complete daily tasks\n` +
      `4️⃣ Invite friends to get bonuses\n` +
      `5️⃣ Level up to unlock features\n\n` +
      `*Features:*\n` +
      `🎲 Ethiopian Games (Gebeta)\n` +
      `📅 Daily Check-in Rewards\n` +
      `👥 Referral System\n` +
      `🏆 Global Leaderboard\n` +
      `⭐ 6 Levels to Master\n\n` +
      `Good luck on your journey! 🗡️`;

    await bot.sendMessage(chatId, helpText, {
      parse_mode: 'Markdown'
    });

    console.log(`✅ /help sent to ${chatId}`);
  } catch (error) {
    console.error('❌ Help error:', error.message);
  }
});

// /invite command
bot.onText(/\/invite/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    const referralCode = Buffer.from(userId.toString()).toString('base64');
    const referralLink = `https://t.me/SabaQuest_bot?start=ref_${referralCode}`;

    const message = `👥 *Invite Friends & Earn Rewards!*\n\n` +
      `Share your personal link:\n` +
      `${referralLink}\n\n` +
      `*Your Rewards:*\n` +
      `🎁 1 friend: 50 coins + 1 gem\n` +
      `🎉 5 friends: 300 coins + 3 gems\n` +
      `🏆 10 friends: 750 coins + 10 gems\n` +
      `👑 25 friends: 2000 coins + 25 gems\n` +
      `💎 50 friends: 5000 coins + 50 gems\n\n` +
      `*Friend's Reward:*\n` +
      `🎁 25 coins welcome bonus\n\n` +
      `Start sharing now! 🚀`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '✈️ Share on Telegram',
            url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🏛️ Join me in Queen Makeda\'s Quest! Play games, earn rewards, and level up!')}`
          }
        ]
      ]
    };

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    console.log(`✅ /invite sent to user ${userId}`);
  } catch (error) {
    console.error('❌ Invite error:', error.message);
  }
});

// Handle callback queries (button clicks)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  console.log(`🔘 Callback: ${data} from user ${userId}`);

  try {
    // Answer callback immediately
    await bot.answerCallbackQuery(query.id);

    if (data === 'tasks') {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '📋 Open Tasks',
              web_app: { url: `${FRONTEND_URL}` }
            }
          ]
        ]
      };

      await bot.sendMessage(
        chatId,
        '📋 *Complete Tasks & Earn Rewards!*\n\n' +
        'Click below to see all available tasks.\n\n' +
        'Tasks include:\n' +
        '• Social media follows\n' +
        '• Daily check-ins\n' +
        '• Friend invitations\n' +
        '• Game achievements',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } 
    else if (data === 'invite') {
      const referralCode = Buffer.from(userId.toString()).toString('base64');
      const referralLink = `https://t.me/SabaQuest_bot?start=ref_${referralCode}`;

      const message = `👥 *Your Referral Link:*\n\n${referralLink}\n\n` +
        `*Rewards:*\n` +
        `🎁 1 friend: 50🪙 + 1💎\n` +
        `🎉 5 friends: 300🪙 + 3💎\n` +
        `🏆 10 friends: 750🪙 + 10💎`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '✈️ Share Now',
              url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me in Queen Makeda\'s Quest!')}`
            }
          ]
        ]
      };

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }
    else if (data === 'leaderboard') {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🏆 View Rankings',
              web_app: { url: `${FRONTEND_URL}` }
            }
          ]
        ]
      };

      await bot.sendMessage(
        chatId,
        '🏆 *Global Leaderboard*\n\n' +
        'See who are the top warriors of Axum!\n\n' +
        'Rankings based on:\n' +
        '⭐ Level\n' +
        '🪙 Coins\n' +
        '✅ Tasks completed',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    }
    else if (data === 'help') {
      const helpText = `🏛️ *Queen Makeda's Quest*\n\n` +
        `*How to Play:*\n` +
        `1️⃣ Tap Queen Makeda for coins\n` +
        `2️⃣ Play Gebeta game\n` +
        `3️⃣ Complete tasks\n` +
        `4️⃣ Invite friends\n` +
        `5️⃣ Level up!\n\n` +
        `Good luck! 🗡️`;

      await bot.sendMessage(chatId, helpText, {
        parse_mode: 'Markdown'
      });
    }

    console.log(`✅ Callback handled: ${data}`);
  } catch (error) {
    console.error('❌ Callback error:', error.message);
  }
});

// Error handlers
bot.on('polling_error', (error) => {
  console.log('⚠️ Polling error (ignored):', error.code);
});

bot.on('error', (error) => {
  console.log('⚠️ Bot error (ignored):', error.code);
});

console.log('✅ Bot ready! Commands: /start, /play, /invite, /help');

module.exports = bot;
