# Axum - Queen Makeda's Quest 🏛️

A gamified Telegram-integrated web application for growing social media engagement through an immersive narrative experience based on the legendary Queen Makeda of Saba.

[![Security: Fixed](https://img.shields.io/badge/security-fixed-green.svg)](./CODE_REVIEW_SUMMARY.md)
[![Code Quality: 4/5](https://img.shields.io/badge/code%20quality-4%2F5-brightgreen.svg)](./REVIEW_COMPLETE.md)
[![License: Proprietary](https://img.shields.io/badge/license-proprietary-blue.svg)](LICENSE)

## 🎮 Features

- **Ethiopian Cultural Heritage**: Inspired by Queen Makeda's journey to Jerusalem
- **6 Progressive Levels**: Unlock new challenges every 2 weeks
- **Social Integration**: YouTube, Facebook, TikTok, Instagram, and Telegram
- **Traditional Games**: Play Gebeta and other Ethiopian games
- **Competitive Leaderboards**: Top players compete for prizes
- **Daily Check-ins**: Earn rewards for consistent engagement
- **Referral System**: Invite friends and earn bonuses
- **Real Rewards**: Coins, gems, badges, and sponsor perks

## 🚀 Quick Start

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/Antzgech/axum-platform.git
cd axum-platform

# Run the setup script
./setup.sh

# Follow the prompts to configure your environment
```

### Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete guide for local development and production deployment
- **[Code Review Summary](./CODE_REVIEW_SUMMARY.md)** - Security audit and code quality analysis
- **[Review Complete](./REVIEW_COMPLETE.md)** - Final assessment and metrics
- **[Frontend README](./frontend/README.md)** - Detailed frontend documentation

## 🔧 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL 12.x or higher
- Telegram Bot Token (create via [@BotFather](https://t.me/botfather))

## 🐳 Docker Deployment

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🏗️ Architecture

```
axum-platform/
├── backend/           # Node.js/Express API server
│   ├── server.js     # Main server file
│   ├── bot.js        # Telegram bot implementation
│   └── Dockerfile    # Backend Docker configuration
├── frontend/         # React web application
│   ├── src/         # Source code
│   │   ├── pages/   # Page components
│   │   ├── components/ # Reusable components
│   │   └── games/   # Game implementations
│   └── Dockerfile   # Frontend Docker configuration
└── docker-compose.yml # Docker orchestration
```

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Parameterized Queries**: SQL injection prevention
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: No hardcoded secrets
- **Security Audit**: 0 vulnerabilities (CodeQL verified)

See [CODE_REVIEW_SUMMARY.md](./CODE_REVIEW_SUMMARY.md) for detailed security analysis.

## 🧪 Testing

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

## 📊 Project Status

- ✅ Security audit completed (0 vulnerabilities)
- ✅ Code review completed (4/5 rating)
- ✅ Production-ready configuration
- ✅ Docker support added
- ✅ Comprehensive documentation
- ⏳ Dependencies ready to install
- ⏳ Ready for deployment

## 🤝 Contributing

This is a proprietary project by Sabawians Company. For internal team members:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a PR for review

## 📝 Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secure-secret-min-32-chars
TELEGRAM_BOT_TOKEN=your-bot-token
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_TELEGRAM_BOT_USERNAME=YourBotUsername
```

## 🚀 Deployment Platforms

The application supports deployment on:

- **Railway** (Backend) - Current production backend
- **Vercel** (Frontend) - Current production frontend
- **Heroku** (Full stack)
- **Docker** (Any platform)
- **Custom VPS** (via Docker)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📱 Telegram Bot Setup

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Configure commands:
   - `/start` - Start the game
   - `/play` - Open the game
   - `/invite` - Get referral link
   - `/help` - Show help

## 🎨 Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Telegram Bot API
- Node-Telegram-Bot-API

**Frontend:**
- React 18
- React Router
- Axios
- CSS3 with custom design system

## 📄 License

This project is proprietary software owned by Sabawians Company.

## 📞 Support

For questions or issues:
- Email: sabawians@gmail.com
- Telegram: @SabaQuest_bot

---

**Built with ⚜️ by Sabawians Company**

*Walk in the footsteps of Queen Makeda*
