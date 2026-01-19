# 🎉 Your London Ontario News Bot is Ready!

I've created a complete, production-ready Facebook automation bot that uses **zero paid APIs** (except Claude API which costs ~$3/month).

## 📦 What's Included

### Core Components
- ✅ **3 Vercel Serverless Functions** - Weather, News, Events
- ✅ **3 GitHub Actions Workflows** - Automated scheduling
- ✅ **Free Data Scrapers** - News (RSS), Weather, Events, Alerts
- ✅ **Claude AI Integration** - Writes engaging posts
- ✅ **Facebook Posting** - Automatic publishing
- ✅ **Local Testing Tools** - Test before deploying

### Project Structure
```
london-news-bot/
├── api/cron/           # Vercel serverless functions
│   ├── weather.js      # Daily weather post
│   ├── news.js         # Daily news post
│   └── events.js       # Weekly events post
├── scrapers/           # Free data collection
│   ├── weather.js      # Weather data (no API key needed!)
│   ├── news.js         # RSS feeds from 4 local sources
│   └── events.js       # Events from Tourism London & Library
├── services/
│   ├── claude.js       # AI post generation
│   └── facebook.js     # Facebook Graph API
├── .github/workflows/  # Automated scheduling
│   ├── daily-weather.yml   # 7 AM daily
│   ├── daily-news.yml      # 6 PM daily
│   └── weekly-events.yml   # Monday 9 AM
├── test-local.js       # Test everything locally
├── README.md           # Full documentation
└── SETUP.md            # Step-by-step setup guide
```

## 🚀 Quick Start (30 Minutes)

### 1. Get API Keys (15 min)
- Facebook Page Access Token + Page ID
- Anthropic API Key
- Random CRON_SECRET

**See SETUP.md for detailed instructions!**

### 2. Deploy to Vercel (10 min)
```bash
npm install -g vercel
vercel
# Add environment variables in dashboard
```

### 3. Configure GitHub Actions (5 min)
Add these secrets in GitHub:
- VERCEL_WEATHER_ENDPOINT
- VERCEL_NEWS_ENDPOINT
- VERCEL_EVENTS_ENDPOINT
- CRON_SECRET

### 4. Test It!
Go to Actions tab → Run workflow → Check Facebook!

## 💰 Cost Breakdown

| Service | Monthly Cost |
|---------|-------------|
| Vercel Hosting | FREE |
| GitHub Actions | FREE |
| Claude API | ~$3 |
| Facebook API | FREE |
| **TOTAL** | **~$3/month** |

## 📅 Posting Schedule

Your bot will automatically post:

- **Weather**: Every day at 7:00 AM EST
- **Top 10 News**: Every day at 6:00 PM EST
- **Top 5 Events**: Every Monday at 9:00 AM EST

## 🔧 Features

### Smart Data Collection
- Scrapes 4 London, ON news sources (CTV, CBC, Free Press, Blackburn)
- Gets weather without API key (scrapes weather.com)
- Collects events from Tourism London & Library
- Monitors OPP alerts and weather warnings

### AI-Powered Posts
Claude writes:
- Engaging weather updates with emojis
- Professional news summaries
- Exciting event listings
- Community-focused tone

### Zero Maintenance
- Fully automated with GitHub Actions
- Self-healing (retries on failure)
- No servers to manage
- Runs on free tiers

## 🎯 What Makes This Special

✅ **No Pain AI Usage** - Set it and forget it
✅ **Free Hosting** - Vercel + GitHub Actions
✅ **No Paid APIs** - Only Claude (super cheap)
✅ **Professional Quality** - Production-ready code
✅ **Easy Customization** - Change sources, times, style
✅ **Local Testing** - Test before deploying

## 📚 Documentation

- **README.md** - Complete technical documentation
- **SETUP.md** - Step-by-step setup guide (non-technical)
- **test-local.js** - Test script for local development

## 🔐 Security

- Uses long-lived Facebook tokens
- CRON_SECRET prevents unauthorized access
- Never commits sensitive data (.env in .gitignore)
- GitHub Secrets for credentials

## 🛠️ Customization

### Change Post Times
Edit `.github/workflows/*.yml`:
```yaml
schedule:
  - cron: '0 14 * * *'  # 9 AM EST
```

### Add News Sources
Edit `scrapers/news.js`:
```javascript
const sources = [
  { name: 'New Source', url: 'https://...', type: 'rss' }
];
```

### Change Writing Style
Edit `services/claude.js` prompts

## 🐛 Troubleshooting

**Facebook Error?**
→ Check token hasn't expired (get new long-lived token)

**No Posts?**
→ Check Vercel logs in dashboard
→ Check GitHub Actions logs

**News Not Loading?**
→ RSS feeds may be temporarily down
→ Bot will retry on next schedule

## 📖 Next Steps

1. **Read SETUP.md** - Complete setup guide
2. **Get your API keys** - Facebook, Anthropic
3. **Deploy to Vercel** - One command!
4. **Test manually** - Verify it works
5. **Let it run!** - Automated from now on

## 💡 Future Ideas

- Add weather maps/images
- Include traffic updates
- Add polls for engagement
- Tweet the same content
- Add Instagram Stories

---

## Need Help?

1. Check **SETUP.md** for step-by-step instructions
2. Run `node test-local.js` to test locally
3. Check Vercel logs for errors
4. Check GitHub Actions logs

---

**Made with ❤️ for London, Ontario**

Your bot is ready to go! Just follow SETUP.md and you'll be posting in 30 minutes. 🚀
