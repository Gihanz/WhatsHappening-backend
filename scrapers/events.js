const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape events from London, Ontario sources
 */
async function getEvents() {
  const events = [];

  // Scrape from Tourism London - Events This Week
  try {
    const tourismEvents = await scrapeTourismLondonWeekly();
    events.push(...tourismEvents);
    console.log(`Got ${tourismEvents.length} events from Tourism London`);
  } catch (error) {
    console.error('Error scraping Tourism London:', error.message);
  }

  // If we don't have enough events, try library
  if (events.length < 3) {
    try {
      const libraryEvents = await scrapeLibraryEvents();
      events.push(...libraryEvents);
      console.log(`Got ${libraryEvents.length} events from Library`);
    } catch (error) {
      console.error('Error scraping Library events:', error.message);
    }
  }

  // If still not enough events, try Eventbrite
  if (events.length < 3) {
    try {
      const eventbriteEvents = await getEventsFromEventbrite();
      events.push(...eventbriteEvents);
      console.log(`Got ${eventbriteEvents.length} events from Eventbrite`);
    } catch (error) {
      console.error('Error scraping Eventbrite:', error.message);
    }
  }

  // If STILL no events, create some placeholder data so post doesn't fail
  if (events.length === 0) {
    console.log('No events found from any source, creating placeholder');
    events.push({
      title: 'Check Tourism London for upcoming events',
      date: new Date().toISOString(),
      location: 'London, Ontario',
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
 * Scrape events from Tourism London - Events This Week page
 */
async function scrapeTourismLondonWeekly() {
  const url = 'https://www.londontourism.ca/events/events-this-week';
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);
  const events = [];

  // List of text to exclude (UI elements, not events)
  const excludeTexts = [
    'event category',
    'london, on',
    'ontario',
    'events',
    'this week',
    'next week',
    'filter',
    'search',
    'categories',
    'view all',
    'read more',
    'learn more'
  ];

  // Try multiple possible selectors for events
  const selectors = [
    '.event-item',
    '.event-card', 
    'article.event',
    '.events-list .event',
    '[class*="event"]',
    '.listing-item',
    '.card'
  ];

  let foundEvents = false;

  for (const selector of selectors) {
    const elements = $(selector);
    
    if (elements.length > 0) {
      console.log(`Found ${elements.length} potential events using selector: ${selector}`);
      
      elements.each((i, elem) => {
        if (i >= 15) return false; // Check more elements to find real ones

        const $elem = $(elem);
        
        // Try various ways to extract title
        let title = $elem.find('h2, h3, h4, .title, .event-title, [class*="title"]').first().text().trim()
                 || $elem.find('a').first().text().trim()
                 || '';
        
        // Clean up title
        title = title.replace(/\s+/g, ' ').trim();
        
        // Skip if title is garbage
        const titleLower = title.toLowerCase();
        const isGarbage = excludeTexts.some(exclude => titleLower === exclude || titleLower.includes(exclude));
        
        // Skip if title is too short, too long, or contains only date/location info
        const isTooShort = title.length < 10;
        const isTooLong = title.length > 200;
        const isOnlyDate = /^[a-z]{3},?\s+[a-z]{3}\s+\d{1,2}$/i.test(title);
        const isOnlyLocation = /^[a-z\s,]+,\s*[a-z]{2}$/i.test(title) && title.length < 30;
        
        if (isGarbage || isTooShort || isTooLong || isOnlyDate || isOnlyLocation) {
          return; // Skip this element
        }
        
        // Try various ways to extract date
        let date = $elem.find('time, .date, .event-date, [class*="date"]').first().text().trim()
                || $elem.find('[datetime]').attr('datetime')
                || '';
        
        // Try various ways to extract location
        let location = $elem.find('.location, .venue, [class*="location"], [class*="venue"]').first().text().trim()
                    || 'London, ON';
        
        // Try to get link
        let link = $elem.find('a').first().attr('href') || '';
        if (link && !link.startsWith('http')) {
          link = 'https://www.londontourism.ca' + link;
        }

        // Only add if we have a valid title
        if (title) {
          events.push({
            title: title,
            date: parseEventDate(date),
            location: location || 'London, ON',
            link: link || url,
            source: 'Tourism London'
          });
          foundEvents = true;
        }
      });
      
      if (foundEvents && events.length > 0) {
        break; // Stop if we found events with this selector
      }
    }
  }

  // If no events found with selectors, try alternative approach
  if (events.length === 0) {
    console.log('No events found with standard selectors, trying alternative parsing...');
    
    // Look for any links that might be events
    $('a').each((i, elem) => {
      if (i >= 30) return false;
      
      const $link = $(elem);
      const href = $link.attr('href');
      let text = $link.text().trim();
      
      // Clean text
      text = text.replace(/\s+/g, ' ').trim();
      const textLower = text.toLowerCase();
      
      // Skip garbage
      const isGarbage = excludeTexts.some(exclude => textLower === exclude || textLower.includes(exclude));
      const isTooShort = text.length < 10;
      const isTooLong = text.length > 200;
      const isOnlyDate = /^[a-z]{3},?\s+[a-z]{3}\s+\d{1,2}$/i.test(text);
      
      // Filter for event-like links
      if (href && text && !isGarbage && !isTooShort && !isTooLong && !isOnlyDate &&
          !href.includes('#') &&
          (href.includes('event') || href.includes('calendar'))) {
        
        events.push({
          title: text,
          date: new Date().toISOString(),
          location: 'London, ON',
          link: href.startsWith('http') ? href : 'https://www.londontourism.ca' + href,
          source: 'Tourism London'
        });
      }
    });
  }

  console.log(`Scraped ${events.length} valid events from Tourism London`);
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