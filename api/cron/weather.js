kkkkkkkkkkkkkk// Vercel Serverless Function - Daily Weather Post
// This function is triggered by GitHub Actions

const { getWeatherData } = require('../../scrapers/weather');
const { getAlerts } = require('../../scrapers/news');
const { generateWeatherPost } = require('../../services/claude');
const { postToFacebook } = require('../../services/facebook');

module.exports = async (req, res) => {
  // Verify request is from GitHub Actions (optional security)
  const authToken = req.headers['x-auth-token'];
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🌤️ Starting weather post generation...');

    // Get weather data
    const weatherData = await getWeatherData();
    if (!weatherData) {
      throw new Error('Failed to fetch weather data');
    }

    console.log('Weather data:', weatherData);

    // Check for weather alerts
    const alerts = await getAlerts();
    const weatherAlerts = alerts.filter(a => a.type === 'weather_alert');

    // Generate post with Claude
    let postText = await generateWeatherPost(weatherData);

    // Add weather alerts if any
    if (weatherAlerts.length > 0) {
      postText += '\n\n⚠️ WEATHER ALERT:\n' + weatherAlerts[0].title;
    }

    console.log('Generated post:', postText);

    // Post to Facebook
    const result = await postToFacebook(postText);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Weather post published successfully',
        postId: result.postId,
        preview: postText.substring(0, 100) + '...'
      });
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
