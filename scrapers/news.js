const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

/**
 * Fetch news from London, Ontario sources
 */
async function getNews() {
  const sources = [
    {
      name: 'CTV News London',
      url: 'https://london.ctvnews.ca/rss/ctv-news-london-1.822377',
      type: 'rss'
    },
    {
      name: 'CBC London',
      url: 'https://www.cbc.ca/cmlink/rss-canada-london',
      type: 'rss'
    },
    {
      name: 'London Free Press',
      url: 'https://lfpress.com/feed',
      type: 'rss'
    },
    {
      name: 'Blackburn News',
      url: 'https://blackburnnews.com/london/feed/',
      type: 'rss'
    }
  ];

  const allNews = [];

  for (const source of sources) {
    try {
      console.log(`Fetching from ${source.name}...`);
      const feed = await parser.parseURL(source.url);
      
      const items = feed.items.slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate || item.isoDate,
        source: source.name,
        description: cleanDescription(item.contentSnippet || item.description || '')
      }));
      
      allNews.push(...items);
    } catch (error) {
      console.error(`Error fetching ${source.name}:`, error.message);
    }
  }

  // Sort by date (most recent first)
  allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Get top 10 unique stories
  return allNews.slice(0, 10);
}

/**
 * Clean up description text
 */
function cleanDescription(text) {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Check for weather alerts and accidents from OPP feed
 */
async function getAlerts() {
  const alerts = [];
  
  try {
    // OPP West Region (covers London)
    const oppFeed = await parser.parseURL('https://www.opp.ca/index.php?lng=en&id=4&fmt=rss');
    
    const westernItems = oppFeed.items
      .filter(item => 
        item.title.toLowerCase().includes('london') ||
        item.title.toLowerCase().includes('middlesex')
      )
      .slice(0, 3);
    
    alerts.push(...westernItems.map(item => ({
      title: item.title,
      link: item.link,
      type: 'police',
      pubDate: item.pubDate
    })));
  } catch (error) {
    console.error('Error fetching OPP alerts:', error.message);
  }

  // Try to get weather alerts from Environment Canada
  try {
    const weatherAlertsUrl = 'https://weather.gc.ca/rss/warning/on-137_e.xml'; // London area
    const alertsFeed = await parser.parseURL(weatherAlertsUrl);
    
    if (alertsFeed.items && alertsFeed.items.length > 0) {
      alerts.push(...alertsFeed.items.map(item => ({
        title: item.title,
        link: item.link,
        type: 'weather_alert',
        pubDate: item.pubDate,
        description: cleanDescription(item.contentSnippet || item.description || '')
      })));
    }
  } catch (error) {
    console.error('Error fetching weather alerts:', error.message);
  }

  return alerts;
}

module.exports = { getNews, getAlerts };
