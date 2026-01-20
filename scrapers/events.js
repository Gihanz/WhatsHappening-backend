const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape events from London, Ontario sources
 */
async function getEvents() {
  const events = [];

  // Prioritize Eventbrite since it's most reliable
  console.log('=== Starting event collection ===');
  
  try {
    console.log('1. Trying Eventbrite...');
    const eventbriteEvents = await getEventsFromEventbrite();
    events.push(...eventbriteEvents);
    console.log(`✓ Eventbrite: ${eventbriteEvents.length} events`);
  } catch (error) {
    console.error('✗ Eventbrite failed:', error.message);
  }

  // If we don't have enough, try Tourism London
  if (events.length < 5) {
    try {
      console.log('2. Trying Tourism London...');
      const tourismEvents = await scrapeTourismLondonWeekly();
      events.push(...tourismEvents);
      console.log(`✓ Tourism London: ${tourismEvents.length} events`);
    } catch (error) {
      console.error('✗ Tourism London failed:', error.message);
    }
  }

  // If still need more, try Library
  if (events.length < 5) {
    try {
      console.log('3. Trying Library...');
      const libraryEvents = await scrapeLibraryEvents();
      events.push(...libraryEvents);
      console.log(`✓ Library: ${libraryEvents.length} events`);
    } catch (error) {
      console.error('✗ Library failed:', error.message);
    }
  }

  // If still need more, try Facebook
  if (events.length < 5) {
    try {
      console.log('4. Trying Facebook Events...');
      const fbEvents = await getFacebookEvents();
      events.push(...fbEvents);
      console.log(`✓ Facebook: ${fbEvents.length} events`);
    } catch (error) {
      console.error('✗ Facebook failed:', error.message);
    }
  }

  console.log(`=== Total events collected: ${events.length} ===`);

  // Remove duplicates and sort by date
  const uniqueEvents = removeDuplicates(events);
  uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Return at least something, even if just 1 event
  const finalEvents = uniqueEvents.slice(0, 5);
  
  console.log(`=== Returning ${finalEvents.length} events ===`);
  
  return finalEvents.length > 0 ? finalEvents : [];
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
 * Fallback: Get events from Eventbrite for London, Ontario
 */
async function getEventsFromEventbrite() {
  try {
    const url = 'https://www.eventbrite.com/d/canada--london/events/';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const events = [];
    
    console.log('Scraping Eventbrite...');

    // Eventbrite uses multiple possible selectors
    const selectors = [
      'article',
      '[data-testid*="event"]',
      '.discover-search-desktop-card',
      '.eds-event-card',
      '.event-card',
      'li[class*="event"]',
      'div[class*="search-event-card"]'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        elements.each((i, elem) => {
          if (events.length >= 10) return false; // Get up to 10 events

          const $elem = $(elem);
          
          // Try multiple ways to get title
          let title = $elem.find('h2, h3, [class*="title"], [class*="event-title"]').first().text().trim()
                   || $elem.find('a[class*="event"]').first().text().trim()
                   || $elem.find('a').first().attr('aria-label')
                   || $elem.find('a').first().text().trim();
          
          // Clean title
          title = title.replace(/\s+/g, ' ').trim();
          
          // Get date
          let date = $elem.find('time, [class*="date"]').first().text().trim()
                  || $elem.find('[datetime]').attr('datetime')
                  || '';
          
          // Get location
          let location = $elem.find('[class*="location"], [class*="venue"]').first().text().trim();
          
          // Get link
          let link = $elem.find('a').first().attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = 'https://www.eventbrite.com' + link;
          }
          
          // Validate title
          const titleLower = title.toLowerCase();
          const isValid = title.length >= 10 && 
                         title.length < 200 && 
                         !titleLower.includes('see more') &&
                         !titleLower.includes('view all') &&
                         !titleLower.includes('eventbrite') &&
                         title !== 'Events' &&
                         title !== 'London';
          
          if (isValid && title && link) {
            events.push({
              title: title,
              date: parseEventDate(date),
              location: location || 'London, ON',
              link: link,
              source: 'Eventbrite'
            });
          }
        });
        
        if (events.length > 0) {
          console.log(`Got ${events.length} events from Eventbrite`);
          break; // Stop if we found events
        }
      }
    }

    // If structured scraping didn't work, try simpler approach
    if (events.length === 0) {
      console.log('Trying alternative Eventbrite parsing...');
      
      $('a[href*="/e/"]').each((i, elem) => {
        if (events.length >= 10) return false;
        
        const $link = $(elem);
        const href = $link.attr('href');
        let text = $link.text().trim();
        
        // Clean up text
        text = text.replace(/\s+/g, ' ').trim();
        
        const isValid = text.length >= 15 && 
                       text.length < 150 &&
                       !text.toLowerCase().includes('see more') &&
                       !text.toLowerCase().includes('eventbrite') &&
                       href && href.includes('/e/');
        
        if (isValid) {
          events.push({
            title: text,
            date: new Date().toISOString(),
            location: 'London, ON',
            link: href.startsWith('http') ? href : 'https://www.eventbrite.com' + href,
            source: 'Eventbrite'
          });
        }
      });
    }

    console.log(`Final Eventbrite count: ${events.length} events`);
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