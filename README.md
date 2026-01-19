# London Ontario News Bot 🍁

Automated Facebook posting bot for London, Ontario news, weather, and events. Posts daily weather updates, top 10 news stories, and weekly events - all using free APIs and services.

## Features

- 🌤️ **Daily Weather Post** (7 AM EST) - Current conditions and forecast
- 📰 **Daily Top 10 News** (6 PM EST) - Latest local news from multiple sources
- 🎉 **Weekly Top 5 Events** (Monday 9 AM EST) - Upcoming community events
- 🚨 **Automatic Alerts** - Weather warnings and traffic incidents
- 🤖 **AI-Powered** - Uses Claude to write engaging posts
- 💰 **Free Hosting** - Runs on Vercel + GitHub Actions free tiers

## Tech Stack

- **Hosting**: Vercel (Serverless Functions)
- **Scheduling**: GitHub Actions (Cron Jobs)
- **AI**: Anthropic Claude API
- **Data Sources**: RSS feeds, web scraping (all free)
- **Social**: Facebook Graph API

## Setup Instructions

### 1. Get Your Facebook Credentials

#### Step 1: Create/Convert to Facebook Page
1. Go to https://www.facebook.com/pages/create
2. Create a Page for your news bot (if you don't have one)

#### Step 2: Create Facebook App
1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Choose "Business" type
4. Fill in app details
5. Add "Facebook Login" product

#### Step 3: Get Page Access Token
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app
3. Click "Generate Access Token"
4. Select your Page
5. Add permissions: `pages_manage_posts`, `pages_read_engagement`
6. Generate token
7. **Important**: Convert to long-lived token:
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```

#### Step 4: Get Page ID
1. Go to your Facebook Page
2. Click "About"
3. Scroll down to find Page ID
4. Or use: https://findmyfbid.com/

### 2. Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up for an account
3. Go to "API Keys"
4. Create a new key
5. Copy the key (starts with `sk-ant-...`)

**Cost**: ~$0.01 per post (very cheap!)

### 3. Deploy to Vercel

#### Option A: Deploy with Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Clone this repo:
   ```bash
   git clone <your-repo-url>
   cd london-news-bot
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Login to Vercel:
   ```bash
   vercel login
   ```

5. Deploy:
   ```bash
   vercel
   ```

6. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add these variables:
     - `FACEBOOK_PAGE_ACCESS_TOKEN`
     - `FACEBOOK_PAGE_ID`
     - `ANTHROPIC_API_KEY`
     - `CRON_SECRET` (generate a random string)

#### Option B: Deploy with GitHub Integration

1. Push this code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables (same as above)
6. Deploy!

### 4. Configure GitHub Actions

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VERCEL_WEATHER_ENDPOINT`: `https://your-project.vercel.app/api/cron/weather`
   - `VERCEL_NEWS_ENDPOINT`: `https://your-project.vercel.app/api/cron/news`
   - `VERCEL_EVENTS_ENDPOINT`: `https://your-project.vercel.app/api/cron/events`
   - `CRON_SECRET`: (same random string you used in Vercel)

3. Enable workflows:
   - Go to Actions tab
   - Enable workflows if prompted

### 5. Test Your Setup

You can manually trigger any workflow:

1. Go to GitHub repo → Actions
2. Select a workflow (e.g., "Daily Weather Post")
3. Click "Run workflow"
4. Check your Facebook page!

Or test locally:

```bash
# Create .env file with your credentials
cp .env.example .env
# Edit .env and add your keys

# Install dependencies
npm install

# Test weather post
node -e "require('./api/cron/weather')({headers:{}}, {status:(c)=>({json:(d)=>console.log(d)})})"
```

## Scheduling

The bot runs on these schedules (EST):

- **Weather**: Daily at 7:00 AM
- **News**: Daily at 6:00 PM  
- **Events**: Every Monday at 9:00 AM

To change schedules, edit the cron expressions in `.github/workflows/*.yml`:

```yaml
schedule:
  - cron: '0 12 * * *'  # Format: minute hour day month weekday (UTC)
```

**Tip**: Convert EST to UTC (EST + 5 hours). Use https://crontab.guru/ to help.

## Data Sources

### News Sources (RSS Feeds)
- CTV News London
- CBC London
- London Free Press
- Blackburn News

### Weather
- Weather.com (scraped, no API key needed)
- Or OpenWeatherMap API (free tier, optional)

### Events
- Tourism London website (scraped)
- London Public Library events (scraped)

### Alerts
- OPP West Region RSS feed
- Environment Canada weather alerts

## Cost Breakdown

| Service | Cost |
|---------|------|
| Vercel Hosting | **FREE** (100GB bandwidth/month) |
| GitHub Actions | **FREE** (2,000 minutes/month) |
| Claude API | **~$3/month** (100 posts) |
| Facebook API | **FREE** |
| **Total** | **~$3/month** |

## Troubleshooting

### "Error posting to Facebook"
- Verify your Page Access Token hasn't expired
- Check token permissions include `pages_manage_posts`
- Make sure you're using the Page ID, not your personal profile ID

### "Failed to fetch weather data"
- Weather.com might be blocking requests
- Solution: Add OpenWeatherMap API key (free tier)
- Get key: https://openweathermap.org/api

### "No news items found"
- RSS feeds might be temporarily down
- Check if news sites are accessible
- The bot will retry on next scheduled run

### GitHub Actions not running
- Check if workflows are enabled (Actions tab)
- Verify cron schedule is in UTC, not EST
- Make sure secrets are properly set

## Customization

### Change Post Times

Edit `.github/workflows/*.yml`:

```yaml
schedule:
  - cron: '0 14 * * *'  # 9 AM EST (2 PM UTC)
```

### Change News Sources

Edit `scrapers/news.js` and add your RSS feeds:

```javascript
const sources = [
  {
    name: 'Your News Source',
    url: 'https://example.com/rss',
    type: 'rss'
  }
];
```

### Customize Post Style

Edit prompts in `services/claude.js`:

```javascript
const prompt = `Create a funny/serious/casual post about...`;
```

## Security Notes

- Never commit `.env` file (it's in .gitignore)
- Use GitHub Secrets for sensitive data
- Use CRON_SECRET to prevent unauthorized endpoint access
- Rotate Facebook tokens periodically

## Support

If you encounter issues:

1. Check Vercel logs: https://vercel.com/dashboard
2. Check GitHub Actions logs: Repo → Actions → Select run
3. Test locally first before debugging deployment

## License

MIT License - feel free to modify and use!

---

Made with ❤️ for London, Ontario
