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
  
  // Extract current weather data
  const currentTemp = $('[data-testid="TemperatureValue"]').first().text();
  const condition = $('[data-testid="wxPhrase"]').first().text();
  const highTemp = $('[data-testid="TemperatureValue"]').eq(1).text();
  const lowTemp = $('[data-testid="TemperatureValue"]').eq(2).text();
  
  // Get additional details (feels like, humidity, wind, etc.)
  const details = {};
  $('.TodayDetailsCard--detailsContainer--2yLtL .DetailsSummary--DetailsSummary--1DqjJ').each((i, elem) => {
    const label = $(elem).find('.DetailsSummary--label--2CXHj').text().trim();
    const value = $(elem).find('.DetailsSummary--extendedData--307Ax').text().trim();
    if (label && value) {
      details[label] = value;
    }
  });
  
  // Try to get hourly forecast for morning, afternoon, evening
  const hourlyData = {
    morning: null,    // 6 AM - 12 PM
    afternoon: null,  // 12 PM - 6 PM
    night: null       // 6 PM - 12 AM
  };
  
  // Get hourly forecast
  const hourlyUrl = 'https://weather.com/weather/hourbyhour/l/42.98,-81.25';
  try {
    const hourlyResponse = await axios.get(hourlyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $hourly = cheerio.load(hourlyResponse.data);
    
    // Parse hourly data
    $hourly('[data-testid="DetailsSummary"]').each((i, elem) => {
      const timeText = $hourly(elem).find('[data-testid="daypartName"]').text();
      const temp = $hourly(elem).find('[data-testid="TemperatureValue"]').first().text();
      
      if (timeText && temp) {
        const hour = parseInt(timeText);
        
        // Morning: 6 AM - 11 AM
        if (hour >= 6 && hour < 12 && !hourlyData.morning) {
          hourlyData.morning = { time: timeText, temp: temp };
        }
        // Afternoon: 12 PM - 5 PM
        else if (hour >= 12 && hour < 18 && !hourlyData.afternoon) {
          hourlyData.afternoon = { time: timeText, temp: temp };
        }
        // Night: 6 PM - 11 PM
        else if (hour >= 18 && hour < 24 && !hourlyData.night) {
          hourlyData.night = { time: timeText, temp: temp };
        }
      }
    });
  } catch (error) {
    console.log('Could not fetch hourly data, using estimates');
  }
  
  return {
    location: 'London, Ontario',
    current: {
      temp: currentTemp,
      condition: condition,
      feelsLike: details['Feels Like'] || details['RealFeel®'] || 'N/A'
    },
    forecast: {
      high: highTemp,
      low: lowTemp,
      morning: hourlyData.morning,
      afternoon: hourlyData.afternoon,
      night: hourlyData.night
    },
    details: {
      humidity: details['Humidity'] || 'N/A',
      wind: details['Wind'] || 'N/A',
      uvIndex: details['UV Index'] || 'N/A',
      visibility: details['Visibility'] || 'N/A',
      dewPoint: details['Dew Point'] || 'N/A',
      pressure: details['Pressure'] || 'N/A'
    },
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
  
  // Get current weather
  const currentResponse = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );
  
  // Get hourly forecast (for morning, afternoon, night temps)
  const forecastResponse = await axios.get(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );
  
  const current = currentResponse.data;
  const forecast = forecastResponse.data;
  
  // Find morning, afternoon, and night temperatures from hourly forecast
  const now = new Date();
  const todayForecasts = forecast.list.filter(item => {
    const itemDate = new Date(item.dt * 1000);
    return itemDate.getDate() === now.getDate();
  });
  
  const morningTemp = todayForecasts.find(item => {
    const hour = new Date(item.dt * 1000).getHours();
    return hour >= 6 && hour < 12;
  });
  
  const afternoonTemp = todayForecasts.find(item => {
    const hour = new Date(item.dt * 1000).getHours();
    return hour >= 12 && hour < 18;
  });
  
  const nightTemp = todayForecasts.find(item => {
    const hour = new Date(item.dt * 1000).getHours();
    return hour >= 18 && hour < 24;
  });
  
  return {
    location: 'London, Ontario',
    current: {
      temp: Math.round(current.main.temp) + '°',
      condition: current.weather[0].description,
      feelsLike: Math.round(current.main.feels_like) + '°'
    },
    forecast: {
      high: Math.round(current.main.temp_max) + '°',
      low: Math.round(current.main.temp_min) + '°',
      morning: morningTemp ? {
        time: new Date(morningTemp.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temp: Math.round(morningTemp.main.temp) + '°'
      } : null,
      afternoon: afternoonTemp ? {
        time: new Date(afternoonTemp.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temp: Math.round(afternoonTemp.main.temp) + '°'
      } : null,
      night: nightTemp ? {
        time: new Date(nightTemp.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temp: Math.round(nightTemp.main.temp) + '°'
      } : null
    },
    details: {
      humidity: current.main.humidity + '%',
      wind: Math.round(current.wind.speed * 3.6) + ' km/h',
      uvIndex: 'N/A',
      visibility: (current.visibility / 1000).toFixed(1) + ' km',
      dewPoint: 'N/A',
      pressure: current.main.pressure + ' mb'
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = { getWeatherData };