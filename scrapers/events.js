const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape events from London, Ontario sources
 */
async function getEvents() {
  const events = [];

  // Scrape from Tourism London
  try {
    const tourismEvents = await scrapeTourismLondon();
    events.push(...tourismEvents);
  } catch (error) {
    console.error('Error scraping Tourism London:', error.message);
  }

  // Scrape from London Public Library events
  try {
    const libraryEvents = await scrapeLibraryEvents();
    events.push(...libraryEvents);
  } catch (error) {
    console.error('Error scraping Library events:', error.message);
  }

  // Remove duplicates and sort by date
  const uniqueEvents = removeDuplicates(events);
  uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  return uniqueEvents.slice(0, 5);
}

/**
 * Scrape events from Tourism London
 */
async function scrapeTourismLondon() {
  const url = 'https://www.londontourism.ca/events';
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  const events = [];

  $('.event-item, .event-card, article[class*="event"]').each((i, elem) => {
    if (i >= 10) return false; // Limit to 10 events

    const $elem = $(elem);
    const title = $elem.find('h2, h3, .event-title, [class*="title"]').first().text().trim();
    const date = $elem.find('.event-date, time, [class*="date"]').first().text().trim();
    const location = $elem.find('.event-location, [class*="location"], [class*="venue"]').first().text().trim();
    const link = $elem.find('a').first().attr('href');

    if (title && date) {
      events.push({
        title,
        date: parseEventDate(date),
        location: location || 'London, ON',
        link: link ? (link.startsWith('http') ? link : `https://www.londontourism.ca${link}`) : url,
        source: 'Tourism London'
      });
    }
  });

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
      }
    });

    const $ = cheerio.load(response.data);
    const events = [];

    $('.event, .event-listing, [class*="event-item"]').each((i, elem) => {
      if (i >= 5) return false;

      const $elem = $(elem);
      const title = $elem.find('h2, h3, .event-title').first().text().trim();
      const date = $elem.find('.date, time').first().text().trim();
      const location = $elem.find('.location, .branch').first().text().trim();
      const link = $elem.find('a').first().attr('href');

      if (title && date) {
        events.push({
          title,
          date: parseEventDate(date),
          location: location || 'London Public Library',
          link: link ? (link.startsWith('http') ? link : `https://www.londonpubliclibrary.ca${link}`) : url,
          source: 'London Public Library'
        });
      }
    });

    return events;
  } catch (error) {
    return []; // Return empty array if scraping fails
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
