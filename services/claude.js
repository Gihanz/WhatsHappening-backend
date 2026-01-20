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
    return `${i + 1}. ${event.title}\n   📍 ${event.location}\n   📅 ${dateStr}`;
  }).join('\n\n');

  const eventCount = events.length;

  const prompt = `Create an engaging Facebook post about upcoming events in London, Ontario.

${eventCount === 1 ? 'Featured Event:' : `${eventCount} Events This Week:`}
${eventsText}

CRITICAL REQUIREMENTS:
- Write a complete, self-contained Facebook post using ONLY the ${eventCount} event(s) listed above
- DO NOT ask the user for more events
- DO NOT say things like "we need more events", "could you share the other events", "waiting for more", or anything similar
- DO NOT mention "Top 5" unless there are actually 5 events
- DO NOT apologize for the number of events
- Present the ${eventCount} event(s) as a complete and exciting lineup
- Start with enthusiasm about what's happening in London this week
- Use emojis to make it visually appealing
- Keep it between 200-350 characters total
- End with encouragement like "Don't miss out!" or "See you there!"
- NO hashtags
- The post should read naturally as if ${eventCount} event(s) is exactly what you intended to share

Return ONLY the Facebook post text. Do not include any questions, requests, or meta-commentary.`;

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