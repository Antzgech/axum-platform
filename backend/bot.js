const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Player';
  
  const message = `🏆 Welcome ${firstName}! 🏆\n\nClick Play to start your quest!`;
  
  const keyboard = {
    inline_keyboard: [[{
      text: '🎮 Play Queen Makeda\'s Quest',
      web_app: { url: process.env.FRONTEND_URL || 'https://axum-frontend-production.up.railway.app' }
    }]]
  };

  bot.sendMessage(chatId, message, { reply_markup: keyboard });
});

console.log('🤖 Bot initialized');

module.exports = bot;
```

### Step 3: Check Railway Variables

Go to Railway → Backend → Variables

**MUST HAVE:**
```
DATABASE_URL=postgresql://postgres:jlhaqjInCkqxooOUAorDmWNyuOsWFMUN@mainline.proxy.rlwy.net:34581/railway
TELEGRAM_BOT_TOKEN=8266515470:AAGMZc9KaJOKUH2hb4-Gqw6wcIFSrbf8FBQ
FRONTEND_URL=https://axum-frontend-production.up.railway.app
JWT_SECRET=Saba1212
NODE_ENV=production
PORT=5000
