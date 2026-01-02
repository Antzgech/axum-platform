# Quick Reference - Axum Platform 🎯

## 🚀 Getting Started (Choose One)

### Option 1: Quick Setup Script (Easiest)
```bash
./setup.sh
```

### Option 2: Docker (Fastest)
```bash
cp .env.example .env
# Edit .env with your values
docker-compose up -d
```

### Option 3: Manual Setup
```bash
# Backend
cd backend && npm install && cp .env.example .env
# Edit backend/.env, then:
npm start

# Frontend (new terminal)
cd frontend && npm install && cp .env.example .env
# Edit frontend/.env, then:
npm start
```

---

## 📋 Essential Commands

### Development
```bash
# Start backend (from backend/)
npm start              # Production mode
npm run dev           # Development mode with auto-reload

# Start frontend (from frontend/)
npm start             # Development server
npm run build         # Production build

# Docker
docker-compose up -d           # Start all services
docker-compose logs -f         # View logs
docker-compose down           # Stop all services
```

### Testing
```bash
# Backend health check
curl http://localhost:5000/api/health

# Run tests
cd backend && npm test
cd frontend && npm test
```

### Database
```bash
# Create database
createdb axum_db

# Connect to database
psql axum_db
```

---

## 🔐 Required Environment Variables

### Backend (.env)
```bash
# REQUIRED
DATABASE_URL=postgresql://user:pass@host:5432/axum_db
JWT_SECRET=your-secure-secret-min-32-chars  # Generate: openssl rand -base64 32
TELEGRAM_BOT_TOKEN=1234567890:ABCDEF...     # Get from @BotFather

# Optional
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```bash
# REQUIRED
REACT_APP_API_URL=http://localhost:5000
REACT_APP_TELEGRAM_BOT_USERNAME=YourBotUsername
```

---

## 🌐 Default URLs

| Service | Local | Production Example |
|---------|-------|-------------------|
| Frontend | http://localhost:3000 | https://your-app.vercel.app |
| Backend | http://localhost:5000 | https://your-app.railway.app |
| Database | localhost:5432 | (Railway/Heroku provides) |

---

## 📁 Project Structure

```
axum-platform/
├── backend/              # API Server (Node.js/Express)
│   ├── server.js        # Main server
│   ├── bot.js           # Telegram bot
│   ├── .env.example     # Environment template
│   └── Dockerfile       # Docker config
├── frontend/            # Web App (React)
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── games/      # Game implementations
│   ├── .env.example    # Environment template
│   └── Dockerfile      # Docker config
├── docker-compose.yml  # Docker orchestration
├── setup.sh            # Quick setup script
└── DEPLOYMENT_GUIDE.md # Full documentation
```

---

## 🔧 Common Issues & Solutions

### Backend won't start
```bash
# Check environment variables
cat backend/.env

# Check if port is already in use
lsof -i :5000

# Verify database connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Frontend build fails
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules build
npm install
npm run build
```

### Database connection error
```bash
# Verify PostgreSQL is running
pg_isready

# Check connection string format
postgresql://username:password@host:port/database
```

### Telegram bot not responding
```bash
# Verify bot token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Check backend logs for bot initialization messages
```

---

## 🎯 Quick Deployment

### Railway (Backend)
1. Go to railway.app
2. Connect GitHub repo
3. Add PostgreSQL service
4. Set environment variables
5. Deploy from backend folder

### Vercel (Frontend)
1. Go to vercel.com
2. Import GitHub repo
3. Set root directory to `frontend`
4. Add environment variables
5. Deploy

### Docker (Anywhere)
```bash
docker-compose up -d
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project overview |
| `DEPLOYMENT_GUIDE.md` | Complete deployment instructions |
| `CODE_REVIEW_SUMMARY.md` | Security audit results |
| `REVIEW_COMPLETE.md` | Final assessment |
| `setup.sh` | Automated setup script |

---

## 🔗 Useful Links

- **Telegram Bot Setup**: https://t.me/botfather
- **Railway**: https://railway.app
- **Vercel**: https://vercel.com
- **Docker Docs**: https://docs.docker.com
- **PostgreSQL Docs**: https://postgresql.org/docs

---

## 📞 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review `CODE_REVIEW_SUMMARY.md` for code insights
3. Email: sabawians@gmail.com
4. Telegram: @SabaQuest_bot

---

**Last Updated**: January 2, 2026  
**Version**: 1.0.0
