const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes weather data for London, Ontario from weather.com
 * Free alternative to paid weather APIs
 */
async function getWeatherData() {
  try {
    // Using environment variable if available, otherwise scrape
    if (process.env.OPENWEATHER_API_KEY) {
      return await getWeatherFromAPI();
    }
    
    return await scrapeWeatherData();
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    return null;
  }
}

/**
 * Scrape weather from weather.com (free, no API key needed)
 */
async function scrapeWeatherData() {
  const url = 'https://weather.com/weather/today/l/42.98,-81.25'; // London, ON coordinates
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const $ = cheerio.load(response.data);
  
  // Extract weather data from the page
  const currentTemp = $('[data-testid="TemperatureValue"]').first().text();
  const condition = $('[data-testid="wxPhrase"]').first().text();
  const highTemp = $('[data-testid="TemperatureValue"]').eq(1).text();
  const lowTemp = $('[data-testid="TemperatureValue"]').eq(2).text();
  
  // Get additional details
  const details = [];
  $('.TodayDetailsCard--detailsContainer--2yLtL .DetailsSummary--DetailsSummary--1DqjJ').each((i, elem) => {
    const label = $(elem).find('.DetailsSummary--label--2CXHj').text();
    const value = $(elem).find('.DetailsSummary--extendedData--307Ax').text();
    if (label && value) {
      details.push({ label, value });
    }
  });
  
  return {
    location: 'London, Ontario',
    current: {
      temp: currentTemp,
      condition: condition
    },
    forecast: {
      high: highTemp,
      low: lowTemp
    },
    details: details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get weather from OpenWeatherMap API (if API key is provided)
 */
async function getWeatherFromAPI() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const lat = 42.9849;
  const lon = -81.2453;
  
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );
  
  const data = response.data;
  
  return {
    location: 'London, Ontario',
    current: {
      temp: Math.round(data.main.temp) + '°',
      condition: data.weather[0].description
    },
    forecast: {
      high: Math.round(data.main.temp_max) + '°',
      low: Math.round(data.main.temp_min) + '°'
    },
    details: [
      { label: 'Humidity', value: data.main.humidity + '%' },
      { label: 'Wind', value: data.wind.speed + ' km/h' },
      { label: 'Feels Like', value: Math.round(data.main.feels_like) + '°' }
    ],
    timestamp: new Date().toISOString()
  };
}

module.exports = { getWeatherData };
