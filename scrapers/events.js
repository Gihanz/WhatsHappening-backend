const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape events from London, Ontario sources
 */
async function getEvents() {
  const events = [];

  // Try multiple sources and collect all events
  const sources = [
    { name: 'Tourism London', fn: scrapeTourismLondonWeekly },
    { name: 'Library', fn: scrapeLibraryEvents },
    { name: 'Eventbrite', fn: getEventsFromEventbrite },
    { name: 'Facebook Events', fn: getFacebookEvents }
  ];

  for (const source of sources) {
    try {
      const sourceEvents = await source.fn();
      events.push(...sourceEvents);
      console.log(`Got ${sourceEvents.length} events from ${source.name}`);
      
      // Stop if we have enough events
      if (events.length >= 5) break;
    } catch (error) {
      console.error(`Error from ${source.name}:`, error.message);
    }
  }

  // If STILL no events, create helpful placeholder
  if (events.length === 0) {
    console.log('No events found from any source, creating helpful message');
    events.push({
      title: 'Check londontourism.ca for this week\'s events',
      date: new Date().toISOString(),
      location: 'Various locations in London, ON',
      link: 'https://www.londontourism.ca/events/events-this-week',
      source: 'Tourism London'
    });
  }

  // Remove duplicates and sort by date
  const uniqueEvents = removeDuplicates(events);
  uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  return uniqueEvents.slice(0, 5);
}

/**
 * Get events from Facebook public events (for London, ON area)
 */
async function getFacebookEvents() {
  try {
    // Facebook public events search page
    const url = 'https://www.facebook.com/events/search?q=london%20ontario';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const events = [];

    // Facebook uses dynamic rendering, so this might not work well
    // But worth a try as fallback
    $('a[href*="/events/"]').slice(0, 10).each((i, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href');
      const text = $elem.text().trim();
      
      if (text && text.length > 10 && text.length < 150) {
        events.push({
          title: text,
          date: new Date().toISOString(),
          location: 'London, ON',
          link: href.startsWith('http') ? href : 'https://www.facebook.com' + href,
          source: 'Facebook Events'
        });
      }
    });

    return events;
  } catch (error) {
    console.error('Facebook events scraping failed:', error.message);
    return [];
  }
}

/**
 * Scrape events from Tourism London - Events This Week page
 * Note: This page uses JavaScript to load events, so scraping is limited
 */
async function scrapeTourismLondonWeekly() {
  const events = [];
  
  // Try RSS feed first (if available)
  try {
    const rssUrl = 'https://www.londontourism.ca/events/rss';
    const feed = await parser.parseURL(rssUrl);
    
    if (feed && feed.items) {
      feed.items.slice(0, 10).forEach(item => {
        events.push({
          title: item.title,
          date: item.pubDate || item.isoDate || new Date().toISOString(),
          location: 'London, ON',
          link: item.link,
          source: 'Tourism London'
        });
      });
      
      if (events.length > 0) {
        console.log(`Found ${events.length} events from Tourism London RSS`);
        return events;
      }
    }
  } catch (error) {
    console.log('No RSS feed available, trying HTML scraping');
  }
  
  // If RSS doesn't work, try HTML scraping
  try {
    const url = 'https://www.londontourism.ca/events/events-this-week';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // List of text to exclude
    const excludeTexts = [
      'event category', 'london, on', 'ontario', 'events', 'this week',
      'next week', 'filter', 'search', 'categories', 'view all',
      'read more', 'learn more', 'show more'
    ];

    // Try multiple selectors
    const selectors = [
      'article',
      '.event',
      '.listing',
      '[itemtype*="Event"]',
      '.card',
      'li'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      
      if (elements.length > 0) {
        console.log(`Trying selector: ${selector} (found ${elements.length} elements)`);
        
        elements.each((i, elem) => {
          if (events.length >= 10) return false;

          const $elem = $(elem);
          
          // Get all text and try to find title
          let title = $elem.find('h1, h2, h3, h4, strong, b').first().text().trim()
                   || $elem.find('a').first().attr('title')
                   || $elem.find('a').first().text().trim();
          
          // Clean title
          title = title.replace(/\s+/g, ' ').trim();
          const titleLower = title.toLowerCase();
          
          // Validation
          const isGarbage = excludeTexts.some(ex => titleLower === ex || titleLower.startsWith(ex));
          const isTooShort = title.length < 10;
          const isTooLong = title.length > 200;
          const isOnlyDate = /^[a-z]{3},?\s+[a-z]{3}\s+\d{1,2}$/i.test(title);
          const isOnlyLocation = /^[a-z\s,]+,\s*[a-z]{2}$/i.test(title);
          
          if (!isGarbage && !isTooShort && !isTooLong && !isOnlyDate && !isOnlyLocation && title) {
            const date = $elem.find('time, .date, [datetime]').first().text().trim()
                      || $elem.find('[datetime]').attr('datetime')
                      || '';
            
            const link = $elem.find('a').first().attr('href') || '';
            
            events.push({
              title: title,
              date: parseEventDate(date),
              location: 'London, ON',
              link: link.startsWith('http') ? link : `https://www.londontourism.ca${link}`,
              source: 'Tourism London'
            });
          }
        });
        
        if (events.length > 0) break;
      }
    }
  } catch (error) {
    console.error('Error scraping Tourism London:', error.message);
  }

  console.log(`Scraped ${events.length} events from Tourism London`);
  return events;
}

/**
 * Scrape events from London Public Library
 */
async function scrapeLibraryEvents() {
  const url = 'https://www.londonpubliclibrary.ca/events';
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const events = [];

    // Try multiple selectors
    const selectors = [
      '.event',
      '.event-listing',
      '[class*="event-item"]',
      '.views-row'
    ];

    for (const selector of selectors) {
      $(selector).each((i, elem) => {
        if (i >= 5) return false;

        const $elem = $(elem);
        const title = $elem.find('h2, h3, h4, .event-title, .title').first().text().trim();
        const date = $elem.find('.date, time, .event-date').first().text().trim();
        const location = $elem.find('.location, .branch, .venue').first().text().trim();
        const link = $elem.find('a').first().attr('href');

        if (title && title.length > 3) {
          events.push({
            title,
            date: parseEventDate(date),
            location: location || 'London Public Library',
            link: link ? (link.startsWith('http') ? link : `https://www.londonpubliclibrary.ca${link}`) : url,
            source: 'London Public Library'
          });
        }
      });
      
      if (events.length > 0) break;
    }

    return events;
  } catch (error) {
    console.error('Library events scraping failed:', error.message);
    return [];
  }
}

/**
 * Fallback: Get events from multiple sources including Eventbrite
 */
async function getEventsFromEventbrite() {
  try {
    // Eventbrite public API for London, Ontario events (no key needed for search)
    const url = 'https://www.eventbrite.com/d/canada--london/events/';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const events = [];

    // Eventbrite uses specific classes
    $('[class*="event-card"], [class*="discover-search-desktop-card"]').each((i, elem) => {
      if (i >= 10) return false;

      const $elem = $(elem);
      const title = $elem.find('[class*="event-card__title"], h3, h2').first().text().trim();
      const date = $elem.find('[class*="event-card__date"], time').first().text().trim();
      const location = $elem.find('[class*="event-card__location"], [class*="location"]').first().text().trim();
      const link = $elem.find('a').first().attr('href');

      if (title && title.length > 3) {
        events.push({
          title,
          date: parseEventDate(date),
          location: location || 'London, ON',
          link: link || url,
          source: 'Eventbrite'
        });
      }
    });

    return events;
  } catch (error) {
    console.error('Eventbrite scraping failed:', error.message);
    return [];
  }
}

/**
 * Parse event date string into ISO format
 */
function parseEventDate(dateStr) {
  // Try to parse various date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }
  
  // If parsing fails, return a future date so events stay in the list
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  return futureDate.toISOString();
}

/**
 * Remove duplicate events based on title similarity
 */
function removeDuplicates(events) {
  const seen = new Set();
  return events.filter(event => {
    const key = event.title.toLowerCase().substring(0, 30);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

module.exports = { getEvents };