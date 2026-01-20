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

${eventCount === 1 ? 'Featured Event:' : `Top ${eventCount} Events:`}
${eventsText}

Requirements:
- Start with an exciting intro about what's happening in London this week
- Present all ${eventCount} event(s) clearly with emojis
- DO NOT mention that there should be more events
- DO NOT say things like "we need more events" or "this is just the beginning"
- Keep it enthusiastic and community-focused
- Total length: 250-400 characters
- End with encouragement to attend (e.g., "Don't miss out!", "See you there!", "Join us!")
- Use event-related emoji (🎭🎵🎨📚🎉 etc.)
- NO hashtags
- If there's only 1 event, make it sound special and exclusive
- Focus ONLY on the events listed above

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

module.exports = {
  generateWeatherPost,
  generateNewsPost,
  generateEventsPost
};