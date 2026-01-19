// Local test script
// Run with: node test-local.js

require('dotenv').config();

const { getWeatherData } = require('./scrapers/weather');
const { getNews, getAlerts } = require('./scrapers/news');
const { getEvents } = require('./scrapers/events');
const { generateWeatherPost, generateNewsPost, generateEventsPost } = require('./services/claude');
const { verifyFacebookCredentials } = require('./services/facebook');

async function testWeather() {
  console.log('\n🌤️  Testing Weather...\n');
  const weather = await getWeatherData();
  console.log('Weather Data:', JSON.stringify(weather, null, 2));
  
  if (process.env.ANTHROPIC_API_KEY) {
    const post = await generateWeatherPost(weather);
    console.log('\nGenerated Post:\n', post);
  }
}

async function testNews() {
  console.log('\n📰 Testing News...\n');
  const news = await getNews();
  console.log(`Found ${news.length} news items`);
  news.slice(0, 3).forEach((item, i) => {
    console.log(`${i + 1}. ${item.title} (${item.source})`);
  });
  
  const alerts = await getAlerts();
  console.log(`\nFound ${alerts.length} alerts`);
  
  if (process.env.ANTHROPIC_API_KEY && news.length > 0) {
    const post = await generateNewsPost(news, alerts);
    console.log('\nGenerated Post:\n', post);
  }
}

async function testEvents() {
  console.log('\n🎉 Testing Events...\n');
  const events = await getEvents();
  console.log(`Found ${events.length} events`);
  events.forEach((event, i) => {
    console.log(`${i + 1}. ${event.title} - ${event.location}`);
  });
  
  if (process.env.ANTHROPIC_API_KEY && events.length > 0) {
    const post = await generateEventsPost(events);
    console.log('\nGenerated Post:\n', post);
  }
}

async function testFacebook() {
  console.log('\n📘 Testing Facebook Credentials...\n');
  const result = await verifyFacebookCredentials();
  
  if (result.valid) {
    console.log('✅ Facebook credentials valid!');
    console.log('Page Name:', result.pageName);
  } else {
    console.log('❌ Facebook credentials invalid:', result.error);
  }
}

async function runAllTests() {
  console.log('='.repeat(50));
  console.log('London Ontario News Bot - Local Test');
  console.log('='.repeat(50));
  
  try {
    await testFacebook();
    await testWeather();
    await testNews();
    await testEvents();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests
runAllTests();
