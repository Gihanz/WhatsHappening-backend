# Quick Setup Guide

Follow these steps to get your London Ontario News Bot running in 30 minutes!

## Prerequisites

- GitHub account
- Vercel account (free)
- Facebook Page
- Anthropic API account (for Claude)

## Step-by-Step Setup

### Part 1: Get Your API Keys (15 minutes)

#### 1. Facebook Page Access Token

**A. Create Facebook App**
1. Visit: https://developers.facebook.com/apps/create/
2. Choose "Business" → Click "Next"
3. Enter app name: "London News Bot"
4. Click "Create App"

**B. Configure App**
1. Dashboard → Add Product → Select "Facebook Login"
2. Settings → Basic → Copy "App ID" and "App Secret"

**C. Get Page Token**
1. Visit: https://developers.facebook.com/tools/explorer/
2. Select your app from dropdown
3. Click "Generate Access Token"
4. Select permissions:
   - ✅ pages_manage_posts
   - ✅ pages_read_engagement
5. Click "Generate Access Token"
6. Copy the token (save it temporarily)

**D. Get Long-Lived Token** (Important!)

Run this in terminal (replace YOUR_APP_ID, YOUR_APP_SECRET, SHORT_TOKEN):

```bash
curl "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_TOKEN"
```

Save the returned `access_token` - this is your long-lived token!

**E. Get Page ID**
1. Go to your Facebook Page
2. Click "About" tab
3. Scroll to "Page ID" or use: https://findmyfbid.com/

#### 2. Anthropic API Key

1. Visit: https://console.anthropic.com/
2. Sign up / Login
3. Click "Get API Keys"
4. Create new key
5. Copy the key (starts with `sk-ant-`)

#### 3. Create CRON_SECRET

Generate a random string (for security):

```bash
openssl rand -base64 32
```

Or just use: `your-random-secret-string-12345`

---

### Part 2: Deploy to Vercel (10 minutes)

#### Option 1: One-Click Deploy (Easiest)

1. Click this button: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
2. Connect your GitHub account
3. Create new repository from this template
4. Add environment variables:
   - `FACEBOOK_PAGE_ACCESS_TOKEN` → Your long-lived token
   - `FACEBOOK_PAGE_ID` → Your page ID
   - `ANTHROPIC_API_KEY` → Your Claude API key
   - `CRON_SECRET` → Your random string
5. Click "Deploy"
6. Wait 2 minutes
7. Copy your Vercel URL (e.g., `https://london-news-bot.vercel.app`)

#### Option 2: Manual Deploy

1. Clone this repo:
   ```bash
   git clone https://github.com/yourusername/london-news-bot
   cd london-news-bot
   ```

2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Login:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Add environment variables in Vercel dashboard

---

### Part 3: Setup GitHub Actions (5 minutes)

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `VERCEL_WEATHER_ENDPOINT` | `https://YOUR-PROJECT.vercel.app/api/cron/weather` |
| `VERCEL_NEWS_ENDPOINT` | `https://YOUR-PROJECT.vercel.app/api/cron/news` |
| `VERCEL_EVENTS_ENDPOINT` | `https://YOUR-PROJECT.vercel.app/api/cron/events` |
| `CRON_SECRET` | Same random string from Vercel |

5. Replace `YOUR-PROJECT` with your actual Vercel project URL

---

### Part 4: Test Your Bot (5 minutes)

#### Test Manually in GitHub

1. Go to your repo → "Actions" tab
2. Click "Daily Weather Post"
3. Click "Run workflow" → "Run workflow"
4. Wait 30 seconds
5. Check your Facebook page!

#### Test Locally (Optional)

```bash
# Create .env file
cp .env.example .env

# Edit .env and add your keys
nano .env

# Install dependencies
npm install

# Run test
node test-local.js
```

---

## Verification Checklist

- ✅ Facebook Page Access Token is long-lived (not expired)
- ✅ Vercel deployment successful
- ✅ Environment variables set in Vercel
- ✅ GitHub secrets configured
- ✅ Manual workflow test successful
- ✅ Post appeared on Facebook page

---

## Schedule Summary

Once setup is complete, your bot will automatically post:

| Post Type | Schedule | Time (EST) |
|-----------|----------|------------|
| Weather | Daily | 7:00 AM |
| News | Daily | 6:00 PM |
| Events | Weekly (Monday) | 9:00 AM |

---

## Troubleshooting

### "Invalid OAuth access token"
→ Your Facebook token expired. Get a new long-lived token (Part 1D)

### "GitHub Action failed"
→ Check that your Vercel endpoints are correct
→ Verify CRON_SECRET matches in both Vercel and GitHub

### "No posts appearing"
→ Check Vercel logs: Vercel Dashboard → Your Project → Logs
→ Check GitHub Actions logs: Actions tab → Select failed run

### Need Help?
1. Check Vercel logs first
2. Check GitHub Actions logs
3. Try manual workflow trigger
4. Test locally with `node test-local.js`

---

## What's Next?

Your bot is now running! Here are some ideas:

- **Customize schedules** - Edit `.github/workflows/*.yml`
- **Add more news sources** - Edit `scrapers/news.js`
- **Change post style** - Edit `services/claude.js`
- **Add images** - Enhance posts with weather icons/maps

---

**Estimated Setup Time**: 30 minutes
**Monthly Cost**: ~$3 (Claude API only)
**Maintenance**: Zero! It's fully automated 🎉
