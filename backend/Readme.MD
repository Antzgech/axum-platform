# Axum Kingdom Backend - Railway Deployment Guide

## Quick Fix for "Dockerfile does not exist" Error

Railway is trying to use Docker instead of Nixpacks. Here's how to fix it:

### Option 1: Remove railway.json (Recommended)

Simply delete `railway.json` from your repository. Railway will automatically detect it's a Node.js project and use Nixpacks.

### Option 2: Use the Updated Files

Use the new `railway.json` and `nixpacks.toml` files provided.

## Files in This Package

- `server.js` - Main Express server
- `bot.js` - Telegram bot handler
- `package.json` - Dependencies with Node engine specification
- `railway.json` - Railway configuration (optional)
- `nixpacks.toml` - Explicit Nixpacks configuration (optional)
- `.env.example` - Environment variables template

## Deployment Steps

### 1. Set Up Your Railway Project

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository OR deploy from this directory

### 2. Configure Environment Variables

In Railway dashboard, add these environment variables:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
FRONTEND_URL=https://your-frontend-url.com
DATABASE_URL=postgresql://... (from Railway PostgreSQL)
JWT_SECRET=your_random_secret_key
PORT=3000
```

### 3. Add PostgreSQL Database

1. In Railway, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set the `DATABASE_URL` environment variable
3. Connect to your database and create the required table:

```sql
CREATE TABLE tuser (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  photo_url TEXT,
  current_level INT DEFAULT 1,
  coins INT DEFAULT 0,
  gems INT DEFAULT 0,
  points INT DEFAULT 0,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_telegram_id ON tuser(telegram_id);
```

### 4. Deploy

Railway will automatically:

- Detect Node.js project
- Run `npm install`
- Start with `node server.js`

### 5. Set Up Telegram Webhook

Once deployed, get your Railway URL (e.g., `https://your-app.railway.app`) and set the webhook:

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.railway.app/webhook
```

## Troubleshooting

### "Dockerfile does not exist" Error

- Delete `railway.json` from your repo, OR
- Use the updated `railway.json` provided
- Railway should auto-detect Node.js and use Nixpacks

### Build Fails

- Ensure `package.json` has correct dependencies
- Check Railway logs for specific errors
- Verify Node version is compatible (18.x or higher)

### Database Connection Issues

- Verify `DATABASE_URL` is set in Railway environment variables
- Ensure PostgreSQL service is running
- Check that SSL is properly configured

### Bot Not Responding

- Verify webhook is set correctly
- Check Railway logs for errors
- Ensure `TELEGRAM_BOT_TOKEN` is correct
- Make sure your Railway URL is accessible

## Project Structure

```
.
├── server.js           # Express server with API routes
├── bot.js              # Telegram bot configuration
├── package.json        # Dependencies
├── railway.json        # Railway config (optional)
├── nixpacks.toml       # Nixpacks config (optional)
└── .env.example        # Environment variables template
```

## API Endpoints

- `GET /` - Health check
- `POST /api/auth/telegram` - Telegram authentication
- `POST /webhook` - Telegram webhook endpoint

## Support

If you continue to have issues:

1. Check Railway build logs
2. Verify all environment variables are set
3. Ensure database table is created
4. Test locally first with `npm start`
