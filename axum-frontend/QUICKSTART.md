# Axum Frontend - Quick Start Guide

## 📦 What You Have

A complete, production-ready React frontend for the Axum gamification platform featuring:

✅ **6 Beautifully Designed Pages**
- Home page with Telegram login
- Onboarding with Queen Makeda's story
- Dashboard with user stats
- Game page with 6 levels
- Leaderboard with rankings and finalists
- Rewards, Tasks, and Sponsors pages

✅ **Ethiopian-Inspired Design**
- Custom color palette (gold, emerald, deep red)
- Cinzel & Cormorant Garamond fonts
- Sophisticated animations and transitions
- Fully responsive mobile-first design

✅ **Complete Feature Set**
- Telegram Web Login integration
- Level progression system
- Leaderboard with finalist tracking
- Task management (YouTube, Facebook, TikTok, Telegram)
- Rewards system with payment modal
- Sponsor showcase

## 🚀 Getting Started in 3 Steps

### Step 1: Extract & Install
```bash
# Extract the archive
tar -xzf axum-frontend.tar.gz
cd axum-frontend

# Install dependencies
npm install
```

### Step 2: Configure
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings:
# REACT_APP_API_URL=http://localhost:5000
# REACT_APP_TELEGRAM_BOT_USERNAME=YourBotUsername
```

### Step 3: Run
```bash
# Start development server
npm start

# Opens at http://localhost:3000
```

## 📂 Project Structure

```
axum-frontend/
├── src/
│   ├── components/          # Navbar & Footer
│   ├── pages/              # All 8 pages + CSS
│   ├── App.jsx             # Main app with routing
│   └── App.css             # Design system & variables
├── public/
│   └── index.html          # HTML template
├── package.json            # Dependencies
├── README.md               # Full documentation
├── DEPLOYMENT.md           # Deployment guide
└── vercel.json            # Vercel configuration
```

## 🎨 Design Highlights

### Color System
```css
--gold-primary: #D4AF37    /* Royal gold */
--emerald: #1E5F3E         /* Ethiopian green */
--deep-red: #8B1A1A        /* Traditional red */
--bg-primary: #0F0F0F      /* Dark background */
```

### Typography
- **Headers**: Cinzel (regal, uppercase)
- **Body**: Cormorant Garamond (elegant, readable)

### Key Animations
- Fade in on page load
- Slide in for cards
- Hover effects with gold glow
- Floating icons
- Progress bar animations

## 🔧 Customization Points

### 1. Branding Colors
Edit `src/App.css` lines 4-15 to change the color scheme

### 2. Story Content
Edit `src/pages/OnboardingPage.jsx` lines 8-40 to modify the story

### 3. Sponsor Logos
Edit `src/pages/SponsorsPage.jsx` lines 5-12 to add/update sponsors

### 4. Level Names
Edit `src/pages/GamePage.jsx` lines 23-28 to customize level titles

### 5. Task Types
Edit `src/pages/TasksPage.jsx` lines 20-28 to add/modify tasks

## 📡 API Integration

The frontend expects these endpoints from your backend:

```
POST /api/auth/telegram      - Telegram login
GET  /api/auth/me            - Current user
GET  /api/user/stats         - Dashboard data
GET  /api/levels             - Game levels
GET  /api/leaderboard        - Rankings
GET  /api/tasks              - Available tasks
POST /api/tasks/:id/complete - Complete task
GET  /api/rewards            - User rewards
```

All authenticated requests need:
```
Authorization: Bearer <token>
```

## 🚢 Deployment to Vercel

### Quick Deploy
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add REACT_APP_API_URL production
vercel env add REACT_APP_TELEGRAM_BOT_USERNAME production

# Redeploy
vercel --prod
```

### Via GitHub
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy automatically

See `DEPLOYMENT.md` for detailed instructions.

## 🎮 Game Mechanics Explained

### Level System
- 6 levels total
- Unlock every 2 weeks
- Must complete requirements: invites, subscriptions, follows
- Each level has different point values

### Rewards & Leaderboard
- Top 10 per level get rewards every bi-weekly cycle
- Once in top 10, can't re-enter that level's top 10
- Top 5 from each level become finalists (30 total)
- If qualifying in multiple levels, assigned to highest

### Points & Progression
- Earn points by completing tasks
- Tasks include: YouTube subscribe, Telegram join, Facebook follow, TikTok follow, invite friends
- Points unlock levels and improve leaderboard ranking

## 📱 Mobile Experience

Fully responsive with breakpoints:
- **Mobile**: < 768px (single column layouts)
- **Tablet**: 768-1023px (2 column grids)
- **Desktop**: 1024px+ (full layouts)

All components adapt gracefully with:
- Collapsible navigation
- Stacked cards on mobile
- Touch-friendly buttons
- Optimized font sizes

## 🐛 Common Issues & Solutions

### Telegram Login Not Showing
- Check bot username in .env
- Verify domain in BotFather settings
- Inspect browser console for errors

### API Errors
- Verify API_URL in .env
- Check CORS settings on backend
- Ensure backend is running

### Build Errors
- Delete node_modules and reinstall
- Clear npm cache: `npm cache clean --force`
- Check Node version (requires 16+)

## 📚 Documentation Files

- **README.md**: Complete project documentation
- **DEPLOYMENT.md**: Step-by-step deployment guide
- **This file**: Quick start reference

## 🔐 Security Notes

- Never commit .env files
- Use HTTPS in production
- Validate Telegram auth on backend
- Implement rate limiting on API
- Keep dependencies updated

## 📈 Next Steps

1. **Customize**: Update colors, fonts, content
2. **Backend**: Set up API endpoints
3. **Telegram**: Configure bot with BotFather
4. **Test**: Run locally and test all features
5. **Deploy**: Push to Vercel with environment variables
6. **Monitor**: Check analytics and user feedback

## 💡 Pro Tips

- Use Vercel preview deployments for testing
- Enable Vercel Analytics for insights
- Set up automatic GitHub deployments
- Create separate bots for dev/prod environments
- Monitor backend API response times

## 🎯 Success Checklist

Before going live:
- [ ] All pages load without errors
- [ ] Telegram login works
- [ ] API endpoints respond correctly
- [ ] Mobile version looks good
- [ ] Environment variables are set
- [ ] Sponsor logos are updated
- [ ] Story content is finalized
- [ ] CORS is configured
- [ ] Domain is set up (if using custom domain)
- [ ] Analytics are enabled

---

## Need Help?

Refer to:
1. `README.md` for complete documentation
2. `DEPLOYMENT.md` for deployment details
3. Code comments for implementation details

**Ready to launch Queen Makeda's quest! ⚜️**

Good luck with your Axum platform!
