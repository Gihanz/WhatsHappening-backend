const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes weather data for London, Ontario
 * Tries OpenWeatherMap API first (free, more reliable)
 * Falls back to scraping only if API key not provided
 */
async function getWeatherData() {
  try {
    // Try OpenWeatherMap API first (more reliable)
    if (process.env.OPENWEATHER_API_KEY) {
      console.log('Using OpenWeatherMap API...');
      return await getWeatherFromAPI();
    }
    
    console.log('No API key found, attempting to scrape weather.com...');
    return await scrapeWeatherData();
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    
    // Return fallback data so the bot doesn't crash
    return {
      location: 'London, Ontario',
      current: {
        temp: 'N/A',
        condition: 'Weather data temporarily unavailable',
        feelsLike: 'N/A'
      },
      forecast: {
        high: 'N/A',
        low: 'N/A',
        morning: null,
        afternoon: null,
        night: null
      },
      details: {
        humidity: 'N/A',
        wind: 'N/A',
        uvIndex: 'N/A',
        visibility: 'N/A',
        dewPoint: 'N/A',
        pressure: 'N/A'
      },
      timestamp: new Date().toISOString(),
      error: true
    };
  }
}

/**
 * Scrape weather using wttr.in (free weather API, no key needed)
 */
async function scrapeWeatherData() {
  try {
    // wttr.in is a free weather service with JSON API
    const url = 'https://wttr.in/London,Ontario?format=j1';
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const data = response.data;
    
    // Current conditions
    const current = data.current_condition[0];
    const today = data.weather[0];
    
    // Get hourly forecast for today
    const hourly = today.hourly;
    
    // Find morning (6-12), afternoon (12-18), night (18-24) temps
    let morningTemp = null;
    let afternoonTemp = null;
    let nightTemp = null;
    
    hourly.forEach(hour => {
      const time = parseInt(hour.time) / 100; // Convert "600" to 6, "1200" to 12
      
      if (time >= 6 && time < 12 && !morningTemp) {
        morningTemp = { time: formatTime(time), temp: hour.tempC + '°' };
      } else if (time >= 12 && time < 18 && !afternoonTemp) {
        afternoonTemp = { time: formatTime(time), temp: hour.tempC + '°' };
      } else if (time >= 18 && time < 24 && !nightTemp) {
        nightTemp = { time: formatTime(time), temp: hour.tempC + '°' };
      }
    });
    
    return {
      location: 'London, Ontario',
      current: {
        temp: current.temp_C + '°',
        condition: current.weatherDesc[0].value,
        feelsLike: current.FeelsLikeC + '°'
      },
      forecast: {
        high: today.maxtempC + '°',
        low: today.mintempC + '°',
        morning: morningTemp,
        afternoon: afternoonTemp,
        night: nightTemp
      },
      details: {
        humidity: current.humidity + '%',
        wind: current.windspeedKmph + ' km/h',
        uvIndex: today.uvIndex || 'N/A',
        visibility: current.visibility + ' km',
        dewPoint: 'N/A',
        pressure: current.pressure + ' mb'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching from wttr.in:', error.message);
    
    // If wttr.in fails, try weatherapi.com (also free, no key for current weather)
    return await scrapeFromWeatherAPI();
  }
}

/**
 * Fallback: Use weatherapi.com's free endpoint
 */
async function scrapeFromWeatherAPI() {
  try {
    // WeatherAPI allows limited calls without API key using their demo endpoint
    const url = 'http://api.weatherapi.com/v1/current.json?key=demo&q=London,Ontario&aqi=no';
    
    const response = await axios.get(url, {
      timeout: 10000
    });
    
    const data = response.data;
    
    return {
      location: 'London, Ontario',
      current: {
        temp: Math.round(data.current.temp_c) + '°',
        condition: data.current.condition.text,
        feelsLike: Math.round(data.current.feelslike_c) + '°'
      },
      forecast: {
        high: 'N/A', // Free tier doesn't include forecast
        low: 'N/A',
        morning: null,
        afternoon: null,
        night: null
      },
      details: {
        humidity: data.current.humidity + '%',
        wind: Math.round(data.current.wind_kph) + ' km/h',
        uvIndex: data.current.uv || 'N/A',
        visibility: data.current.vis_km + ' km',
        dewPoint: 'N/A',
        pressure: data.current.pressure_mb + ' mb'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching from weatherapi.com:', error.message);
    throw new Error('All weather sources failed. Please add OPENWEATHER_API_KEY to environment variables.');
  }
}

/**
 * Format hour number to readable time
 */
function formatTime(hour) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return hour + ' AM';
  if (hour === 12) return '12 PM';
  return (hour - 12) + ' PM';
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