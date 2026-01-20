const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate weather post using Claude
 */
async function generateWeatherPost(weatherData) {
  // Build time-based forecast text
  let timeBasedForecast = '';
  if (weatherData.forecast.morning) {
    timeBasedForecast += `Morning: ${weatherData.forecast.morning.temp}\n`;
  }
  if (weatherData.forecast.afternoon) {
    timeBasedForecast += `Afternoon: ${weatherData.forecast.afternoon.temp}\n`;
  }
  if (weatherData.forecast.night) {
    timeBasedForecast += `Night: ${weatherData.forecast.night.temp}\n`;
  }

  const prompt = `Create an engaging Facebook post about today's weather in London, Ontario.

Weather Data:
- Current: ${weatherData.current.temp}, ${weatherData.current.condition}
- Feels Like: ${weatherData.current.feelsLike}
- High: ${weatherData.forecast.high}
- Low: ${weatherData.forecast.low}

Time-based Forecast:
${timeBasedForecast || 'Not available'}

Additional Details:
- Humidity: ${weatherData.details.humidity}
- Wind: ${weatherData.details.wind}
${weatherData.details.uvIndex !== 'N/A' ? `- UV Index: ${weatherData.details.uvIndex}` : ''}

Requirements:
- Start with a friendly greeting for London, ON residents
- Include current temperature, feels like, and condition
- Show temperature progression (morning → afternoon → night) if available
- Include humidity prominently
- Keep it concise but informative (250-350 characters max)
- Use appropriate weather emoji (☀️🌤️⛅☁️🌧️❄️💨🌡️💧)
- End with a helpful tip based on the weather (e.g., "Stay hydrated!", "Bundle up!", "Don't forget your umbrella!")
- Make it engaging and conversational
- NO hashtags

Return only the post text, nothing else.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return message.content[0].text.trim();
}

/**
 * Generate daily news post using Claude
 */
async function generateNewsPost(newsItems, alerts) {
  const newsText = newsItems.map((item, i) => 
    `${i + 1}. ${item.title} (${item.source})`
  ).join('\n');

  const alertsText = alerts.length > 0 
    ? '\n\nALERTS:\n' + alerts.map(a => `⚠️ ${a.title}`).join('\n')
    : '';

  const prompt = `Create an engaging Facebook post summarizing today's top news in London, Ontario.

Top 10 News Stories:
${newsText}
${alertsText}

Requirements:
- Start with a catchy intro line
- List all 10 news items in a clear, scannable format
- Include any alerts prominently if present
- Keep it professional but engaging
- Total length: 400-600 characters
- Use appropriate emoji sparingly
- End with a call to action (e.g., "Stay informed!" or "What story interests you most?")
- NO hashtags

Return only the post text, nothing else.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return message.content[0].text.trim();
}

/**
 * Generate weekly events post using Claude
 */
async function generateEventsPost(events) {
  const eventsText = events.map((event, i) => {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    return `${i + 1}. ${event.title}\n   📅 ${dateStr}\n   📍 ${event.location}`;
  }).join('\n\n');

  const eventCount = events.length;

  const prompt = `Create an engaging Facebook post about upcoming events happening this week in London, Ontario.

Events happening this week:
${eventsText}

CRITICAL REQUIREMENTS:
- This is a WEEKLY EVENTS post covering multiple days this week
- MUST include each event's specific date (as shown above) in the post
- Each event happens on a DIFFERENT day - show the date for each one
- Write a complete, self-contained Facebook post using ALL ${eventCount} event(s) listed above
- Format: List each event with its emoji, title, DATE, and location
- DO NOT ask the user for more events
- DO NOT say "we need more events" or similar phrases
- Present the ${eventCount} event(s) as a complete weekly lineup
- Start with something like "This week in London!" or "Your London events this week:"
- Keep the full post between 400-600 characters
- End with encouragement like "Mark your calendars!" or "See you there!"
- NO hashtags

Example format:
🎭 Event Name - Mon, Jan 27 @ Location
🎵 Another Event - Wed, Jan 29 @ Location

Return ONLY the Facebook post text showing all events with their dates.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return message.content[0].text.trim();
}

module.exports = {
  generateWeatherPost,
  generateNewsPost,
  generateEventsPost
};