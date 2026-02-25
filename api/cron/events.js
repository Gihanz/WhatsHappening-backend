fffff// Vercel Serverless Function - Weekly Events Post
// This function is triggered by GitHub Actions

const { getEvents } = require('../../scrapers/events');
const { generateEventsPost } = require('../../services/claude');
const { postToFacebook } = require('../../services/facebook');

module.exports = async (req, res) => {
  // Verify request is from GitHub Actions (optional security)
  const authToken = req.headers['x-auth-token'];
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🎉 Starting events post generation...');

    // Get events
    const events = await getEvents();
    if (!events || events.length === 0) {
      throw new Error('No events found');
    }

    console.log(`Found ${events.length} events`);

    // Generate post with Claude
    const postText = await generateEventsPost(events);
    console.log('Generated post:', postText);

    // Post to Facebook
    const result = await postToFacebook(postText);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Events post published successfully',
        postId: result.postId,
        eventsCount: events.length,
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
