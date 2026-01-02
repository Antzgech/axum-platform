# Development and Deployment Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 12.x or higher (for production deployment)
- **Git**
- **Telegram Bot Token** (create via [@BotFather](https://t.me/botfather))

---

## 🚀 Quick Start - Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/Antzgech/axum-platform.git
cd axum-platform
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Environment Variables:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (use PostgreSQL connection string)
DATABASE_URL=postgresql://username:password@localhost:5432/axum_db

# JWT Authentication (CRITICAL - use a strong random secret)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Telegram Bot (get from @BotFather)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Generate a strong JWT_SECRET:**

```bash
# Use openssl to generate a secure secret
openssl rand -base64 32
```

**Start the backend:**

```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will be available at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required Environment Variables:**

```env
# API Configuration (point to your backend)
REACT_APP_API_URL=http://localhost:5000

# Telegram Bot Username (without @)
REACT_APP_TELEGRAM_BOT_USERNAME=YourBotUsername
```

**Start the frontend:**

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### 4. Database Setup

**Create PostgreSQL database:**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE axum_db;

# Create user (optional, if not using existing user)
CREATE USER axum_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE axum_db TO axum_user;

# Exit psql
\q
```

The backend will automatically create the required tables on first run.

---

## 🏗️ Production Deployment

### Option 1: Railway (Backend) + Vercel (Frontend)

This is the current production setup mentioned in the code.

#### Backend Deployment (Railway)

1. **Go to [Railway.app](https://railway.app)** and sign in
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select your repository** and choose the `backend` folder
4. **Add Environment Variables:**
   - `PORT` → 5000
   - `NODE_ENV` → production
   - `DATABASE_URL` → (Railway will provide this when you add PostgreSQL)
   - `JWT_SECRET` → (generate with `openssl rand -base64 32`)
   - `TELEGRAM_BOT_TOKEN` → (your bot token)
   - `FRONTEND_URL` → (your Vercel frontend URL)

5. **Add PostgreSQL:**
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway automatically sets `DATABASE_URL`

6. **Deploy:**
   - Railway auto-deploys on git push
   - Your backend URL: `https://your-app.up.railway.app`

#### Frontend Deployment (Vercel)

1. **Go to [Vercel.com](https://vercel.com)** and sign in
2. **Import Project** → "Import Git Repository"
3. **Select your repository**
4. **Configure Build Settings:**
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

5. **Add Environment Variables:**
   - `REACT_APP_API_URL` → your Railway backend URL
   - `REACT_APP_TELEGRAM_BOT_USERNAME` → your bot username (without @)

6. **Deploy:**
   - Click "Deploy"
   - Vercel auto-deploys on git push

### Option 2: Heroku (Full Stack)

#### Backend on Heroku

```bash
cd backend

# Login to Heroku
heroku login

# Create app
heroku create axum-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set TELEGRAM_BOT_TOKEN=your-token-here
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app

# Deploy
git subtree push --prefix backend heroku main
```

#### Frontend on Heroku

```bash
cd frontend

# Create app
heroku create axum-frontend

# Add buildpack
heroku buildpacks:set mars/create-react-app

# Set environment variables
heroku config:set REACT_APP_API_URL=https://axum-backend.herokuapp.com
heroku config:set REACT_APP_TELEGRAM_BOT_USERNAME=YourBotUsername

# Deploy
git subtree push --prefix frontend heroku main
```

### Option 3: Docker Deployment

**Backend Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose** (`docker-compose.yml`):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: axum_db
      POSTGRES_USER: axum_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      NODE_ENV: production
      DATABASE_URL: postgresql://axum_user:your_password@postgres:5432/axum_db
      JWT_SECRET: ${JWT_SECRET}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      FRONTEND_URL: http://localhost:3000
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      REACT_APP_API_URL: http://localhost:5000
      REACT_APP_TELEGRAM_BOT_USERNAME: ${BOT_USERNAME}
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Deploy with Docker:**

```bash
# Create .env file with secrets
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
echo "TELEGRAM_BOT_TOKEN=your-token" >> .env
echo "BOT_USERNAME=YourBotUsername" >> .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🔧 Configuration Checklist

### Backend Configuration

- [ ] `PORT` - Server port (default: 5000)
- [ ] `NODE_ENV` - Environment (development/production)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - **CRITICAL** - Strong random secret (min 32 chars)
- [ ] `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- [ ] `FRONTEND_URL` - Frontend URL for CORS

### Frontend Configuration

- [ ] `REACT_APP_API_URL` - Backend API URL
- [ ] `REACT_APP_TELEGRAM_BOT_USERNAME` - Bot username (without @)

### Telegram Bot Setup

1. **Create bot** with [@BotFather](https://t.me/botfather)
   - Send `/newbot` to @BotFather
   - Follow instructions to create bot
   - Save the bot token

2. **Configure bot**:
   ```
   /setdomain - Set your frontend domain
   /setdescription - Add bot description
   /setabouttext - Add about text
   ```

3. **Enable Web App**:
   - The bot should support inline buttons with `web_app` URLs
   - This is already configured in `backend/bot.js`

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Health Check

Test if backend is running:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "PostgreSQL",
  "bot": "active",
  "tasks": 20,
  "time": "2026-01-02T01:53:00.000Z"
}
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong JWT secrets** - Minimum 32 characters, random
3. **Use HTTPS in production** - Both backend and frontend
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Validate bot tokens** - The backend checks for required tokens
6. **Use environment-specific configs** - Different settings for dev/prod

---

## 📊 Monitoring & Logs

### Railway Logs

```bash
# View logs in Railway dashboard
# Or use Railway CLI
railway logs
```

### Heroku Logs

```bash
heroku logs --tail -a axum-backend
heroku logs --tail -a axum-frontend
```

### Docker Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🐛 Troubleshooting

### Backend won't start

1. **Check environment variables**:
   ```bash
   cd backend
   cat .env
   ```

2. **Verify database connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Check logs**:
   ```bash
   npm start
   # Look for error messages
   ```

### Frontend build fails

1. **Clear cache**:
   ```bash
   cd frontend
   rm -rf node_modules build
   npm install
   npm run build
   ```

2. **Check environment variables**:
   ```bash
   cat .env
   ```

### Database connection errors

1. **Verify PostgreSQL is running**:
   ```bash
   pg_isready
   ```

2. **Test connection string**:
   ```bash
   psql "postgresql://user:pass@host:5432/db" -c "SELECT version()"
   ```

### Telegram bot not responding

1. **Verify bot token**:
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
   ```

2. **Check bot polling in logs**:
   ```
   ✅ Bot polling started
   ✅ Bot ready! Commands: /start, /play, /invite, /help
   ```

---

## 📚 Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Deployment](https://create-react-app.dev/docs/deployment/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🎯 Next Steps After Deployment

1. **Test all features** in production environment
2. **Set up monitoring** (e.g., Sentry, LogRocket)
3. **Configure analytics** (if needed)
4. **Set up CI/CD** for automated testing and deployment
5. **Create backups** for database
6. **Document API endpoints** (consider adding Swagger)

---

**Need help?** Check the [CODE_REVIEW_SUMMARY.md](./CODE_REVIEW_SUMMARY.md) for detailed code analysis and recommendations.

**Last Updated:** January 2, 2026
