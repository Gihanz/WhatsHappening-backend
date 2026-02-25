fffffff// Vercel Serverless Function - Daily News Post
// This function is triggered by GitHub Actions

const { getNews, getAlerts } = require('../../scrapers/news');
const { generateNewsPost } = require('../../services/claude');
const { postToFacebook } = require('../../services/facebook');

module.exports = async (req, res) => {
  // Verify request is from GitHub Actions (optional security)
  const authToken = req.headers['x-auth-token'];
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('📰 Starting news post generation...');

    // Get news and alerts
    const newsItems = await getNews();
    if (!newsItems || newsItems.length === 0) {
      throw new Error('No news items found');
    }

    console.log(`Found ${newsItems.length} news items`);

    const alerts = await getAlerts();
    console.log(`Found ${alerts.length} alerts`);

    // Generate post with Claude
    const postText = await generateNewsPost(newsItems, alerts);
    console.log('Generated post:', postText);

    // Post to Facebook
    const result = await postToFacebook(postText);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'News post published successfully',
        postId: result.postId,
        newsCount: newsItems.length,
        alertsCount: alerts.length,
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
