const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate weather post using Claude
 */
async function generateWeatherPost(weatherData) {
  const prompt = `Create an engaging Facebook post about today's weather in London, Ontario.

Weather Data:
- Current: ${weatherData.current.temp}, ${weatherData.current.condition}
- High: ${weatherData.forecast.high}
- Low: ${weatherData.forecast.low}
- Details: ${JSON.stringify(weatherData.details)}

Requirements:
- Keep it friendly and conversational (150-200 characters)
- Include relevant emoji
- No hashtags
- Make it engaging for local residents
- Mention any weather tips if relevant (umbrella, sunscreen, etc.)

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

  const prompt = `Create an engaging Facebook post about this week's top events in London, Ontario.

Top 5 Events:
${eventsText}

Requirements:
- Start with an exciting intro about the week ahead
- Present all 5 events clearly with emojis
- Keep it enthusiastic and community-focused
- Total length: 400-600 characters
- End with encouragement to attend
- Use event-related emoji (🎭🎵🎨📚🎉 etc.)

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
