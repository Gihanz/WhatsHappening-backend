const axios = require('axios');

/**
 * Post to Facebook Page
 */
async function postToFacebook(message) {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageAccessToken || !pageId) {
    throw new Error('Facebook credentials not configured. Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID in environment variables.');
  }

  const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;

  try {
    const response = await axios.post(url, {
      message: message,
      access_token: pageAccessToken
    });

    console.log('✅ Posted to Facebook successfully!');
    console.log(`Post ID: ${response.data.id}`);
    
    return {
      success: true,
      postId: response.data.id,
      message: 'Posted successfully'
    };
  } catch (error) {
    console.error('❌ Error posting to Facebook:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Verify Facebook credentials
 */
async function verifyFacebookCredentials() {
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageAccessToken || !pageId) {
    return {
      valid: false,
      error: 'Missing credentials'
    };
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}?fields=name,access_token&access_token=${pageAccessToken}`
    );

    return {
      valid: true,
      pageName: response.data.name
    };
  } catch (error) {
    return {
      valid: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

module.exports = {
  postToFacebook,
  verifyFacebookCredentials
};
