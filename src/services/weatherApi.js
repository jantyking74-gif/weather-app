// CyberWeather OS API service

export const OWM_API_KEY = 'cf5902731a4ed6406597d1e73d2547ac';
const REQUEST_TIMEOUT_MS = 10000;

function normalizeSearchQuery(query) {
  return String(query || '').trim().replace(/\s+/g, ' ');
}

function normalizeMatchKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildSearchVariants(query) {
  const normalized = normalizeSearchQuery(query);
  const variants = [normalized];
  const words = normalized.split(' ').filter(Boolean);
  const hasNumber = /\d/.test(normalized);

  if (!normalized.includes(',') && words.length > 1) {
    const lastWord = words[words.length - 1];
    const secondLastWord = words[words.length - 2];
    variants.push(`${words.slice(0, -1).join(' ')}, ${lastWord}`);
    if (words.length > 3) {
      variants.push(`${words.slice(0, -2).join(' ')}, ${secondLastWord}, ${lastWord}`);
    }
    if (hasNumber && words.length > 2) {
      variants.push(lastWord);
    }
    for (let end = words.length - 1; end >= 1; end--) {
      variants.push(words.slice(0, end).join(' '));
    }
    variants.push(lastWord);
  }

  return uniqueLocationParts(variants);
}

function uniqueLocationParts(parts) {
  const seen = new Set();
  return parts
    .map(part => normalizeSearchQuery(part))
    .filter(Boolean)
    .filter(part => {
      const key = normalizeMatchKey(part);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildLocationLabel({ name, state, country }) {
  return uniqueLocationParts([name, state, country]).join(', ') || 'Current Location';
}

function isDetailedLocationQuery(query) {
  const normalized = normalizeSearchQuery(query);
  return /\d/.test(normalized) || normalized.split(/[,\s]+/).filter(Boolean).length > 2;
}

const LOCATION_QUALIFIER_TOKENS = new Set([
  'ae', 'america', 'au', 'australia', 'br', 'brazil', 'ca', 'canada',
  'china', 'cn', 'de', 'emirates', 'es', 'fr', 'france', 'gb', 'germany',
  'in', 'india', 'it', 'italy', 'japan', 'jp', 'kingdom', 'mx', 'mexico',
  'ru', 'russia', 'spain', 'states', 'uae', 'uk', 'united', 'us', 'usa'
]);

function meaningfulQueryTokens(query) {
  return normalizeMatchKey(query)
    .split(' ')
    .filter(token => token.length > 1)
    .filter(token => !LOCATION_QUALIFIER_TOKENS.has(token));
}

function isUsefulLocationCandidate(query, parts) {
  const tokens = meaningfulQueryTokens(query);
  if (!tokens.length) return true;

  const candidateKey = normalizeMatchKey(parts.join(' '));
  const matchedTokens = tokens.filter(token => candidateKey.includes(token));
  const hasNumber = tokens.some(token => /\d/.test(token));
  const lastToken = tokens[tokens.length - 1];

  if (hasNumber && lastToken && !candidateKey.includes(lastToken)) {
    return false;
  }
  if (hasNumber) {
    return Boolean(lastToken && candidateKey.includes(lastToken));
  }
  if (tokens.length <= 2) {
    return matchedTokens.length >= 1;
  }
  return matchedTokens.length >= 2;
}

function scoreLocationCandidate(query, parts) {
  const queryKey = normalizeMatchKey(query);
  const candidateKey = normalizeMatchKey(parts.join(' '));
  const firstPartKey = normalizeMatchKey(parts[0]);
  if (!queryKey || !candidateKey) return 0;

  let score = 0;
  if (candidateKey === queryKey) score += 100;
  if (firstPartKey && firstPartKey === queryKey) score += 60;
  if (candidateKey.startsWith(queryKey)) score += 35;
  if (firstPartKey && queryKey.startsWith(firstPartKey)) score += 15;

  queryKey.split(' ').forEach(token => {
    if (token.length > 1 && candidateKey.includes(token)) score += 8;
  });

  return score;
}

function pickBestCandidate(query, candidates, getParts) {
  return candidates
    .map(candidate => ({
      candidate,
      score: scoreLocationCandidate(query, getParts(candidate))
    }))
    .sort((a, b) => b.score - a.score)[0]?.candidate;
}

function toResolvedLocation({ lat, lon, name, state, country, source, query }) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Invalid coordinates returned by location provider');
  }

  const displayName = buildLocationLabel({ name, state, country });
  return {
    lat: latitude,
    lon: longitude,
    name: normalizeSearchQuery(name) || displayName,
    state: normalizeSearchQuery(state),
    country: normalizeSearchQuery(country),
    displayName,
    source,
    query
  };
}

async function fetchJSON(url, label = 'Request') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${label} failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function geocodeWithOWM(query) {
  if (!OWM_API_KEY || OWM_API_KEY === 'YOUR_OWM_API_KEY_HERE') {
    throw new Error('OWM API key missing');
  }

  const encodedKey = encodeURIComponent(OWM_API_KEY);
  let lastError;

  for (const searchQuery of buildSearchVariants(query)) {
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const geoData = await fetchJSON(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodedQuery}&limit=5&appid=${encodedKey}`,
        'OpenWeather geocoding'
      );

      if (!Array.isArray(geoData) || !geoData.length) {
        throw new Error('OpenWeather could not find this location');
      }

      const getParts = item => [
        item.name,
        item.state,
        item.country,
        item.local_names?.en
      ];
      const loc = pickBestCandidate(query, geoData, getParts) || geoData[0];
      if (!isUsefulLocationCandidate(query, getParts(loc))) {
        throw new Error('OpenWeather returned an unrelated location');
      }

      return toResolvedLocation({
        lat: loc.lat,
        lon: loc.lon,
        name: loc.local_names?.en || loc.name,
        state: loc.state,
        country: loc.country,
        source: 'openweathermap',
        query
      });
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('OpenWeather geocoding error');
}

async function geocodeWithOpenMeteo(query) {
  let lastError;

  for (const searchQuery of buildSearchVariants(query)) {
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const geoData = await fetchJSON(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodedQuery}&count=10&language=en&format=json`,
        'Open-Meteo geocoding'
      );

      if (!Array.isArray(geoData.results) || !geoData.results.length) {
        throw new Error('Open-Meteo could not find this location');
      }

      const getParts = item => [
        item.name,
        item.admin1,
        item.admin2,
        item.country,
        item.country_code
      ];
      const loc = pickBestCandidate(query, geoData.results, getParts) || geoData.results[0];
      if (!isUsefulLocationCandidate(query, getParts(loc))) {
        throw new Error('Open-Meteo returned an unrelated location');
      }

      return toResolvedLocation({
        lat: loc.latitude,
        lon: loc.longitude,
        name: loc.name,
        state: loc.admin1 || loc.admin2,
        country: loc.country_code || loc.country,
        source: 'open-meteo',
        query
      });
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Open-Meteo geocoding error');
}

async function geocodeWithNominatim(query) {
  let lastError;

  for (const searchQuery of buildSearchVariants(query)) {
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const geoData = await fetchJSON(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodedQuery}`,
        'Nominatim geocoding'
      );

      if (!Array.isArray(geoData) || !geoData.length) {
        throw new Error('Nominatim could not find this location');
      }

      const getParts = item => [
        item.name,
        item.display_name,
        item.address?.city,
        item.address?.town,
        item.address?.village,
        item.address?.state,
        item.address?.country
      ];
      const loc = pickBestCandidate(query, geoData, getParts) || geoData[0];
      if (!isUsefulLocationCandidate(query, getParts(loc))) {
        throw new Error('Nominatim returned an unrelated location');
      }

      const address = loc.address || {};
      const name = loc.name ||
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.suburb ||
        address.county ||
        loc.display_name?.split(',')[0];
      const locality = address.city || address.town || address.village || address.municipality || '';
      const region = address.state || address.county || address.state_district || '';
      const state = uniqueLocationParts([
        normalizeMatchKey(locality) !== normalizeMatchKey(name) ? locality : '',
        region
      ]).join(', ');

      return toResolvedLocation({
        lat: loc.lat,
        lon: loc.lon,
        name,
        state,
        country: address.country_code?.toUpperCase() || address.country,
        source: 'nominatim',
        query
      });
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Nominatim geocoding error');
}

export async function resolveLocation(location) {
  if (typeof location === 'string') {
    const query = normalizeSearchQuery(location);
    if (!query) throw new Error('Location query is empty');

    const cityProviders = [geocodeWithOpenMeteo, geocodeWithNominatim];
    if (OWM_API_KEY && OWM_API_KEY !== 'YOUR_OWM_API_KEY_HERE') {
      cityProviders.unshift(geocodeWithOWM);
    }
    
    const detailedProviders = [geocodeWithNominatim, geocodeWithOpenMeteo];
    if (OWM_API_KEY && OWM_API_KEY !== 'YOUR_OWM_API_KEY_HERE') {
      detailedProviders.push(geocodeWithOWM);
    }

    const providers = isDetailedLocationQuery(query) ? detailedProviders : cityProviders;
    const errors = [];

    for (const provider of providers) {
      try {
        return await provider(query);
      } catch (err) {
        errors.push({ provider: provider.name, error: err });
      }
    }

    console.warn('Location providers failed', errors);
    throw new Error(`Location not found: "${query}"`);
  }

  if (!location || !location.lat || !location.lon) {
    throw new Error('Location parameters are empty');
  }

  const displayName = normalizeSearchQuery(location.displayName) ||
    buildLocationLabel({
      name: location.name,
      state: location.state,
      country: location.country
    });

  return toResolvedLocation({
    lat: location.lat,
    lon: location.lon,
    name: location.name || displayName,
    state: location.state,
    country: location.country,
    source: location.source || 'coordinates',
    query: location.query || displayName
  });
}

// Weather Code parser (converts both OWM codes and Open-Meteo codes to standard semantic types)
// Semantic conditions: clear, cloudy, fog, rain, snow, thunderstorm
export function getWeatherCondition(code, provider = 'open-meteo') {
  if (provider === 'open-meteo') {
    if (code === 0) return 'clear';
    if (code <= 3) return 'cloudy';
    if (code <= 48) return 'fog';
    if (code <= 57) return 'rain'; // drizzle
    if (code <= 67) return 'rain';
    if (code <= 77) return 'snow';
    if (code <= 82) return 'rain'; // rain showers
    if (code <= 86) return 'snow'; // snow showers
    if (code >= 95) return 'thunderstorm';
    return 'cloudy';
  } else {
    // OWM group codes
    if (code >= 200 && code < 300) return 'thunderstorm';
    if (code >= 300 && code < 600) return 'rain';
    if (code >= 600 && code < 700) return 'snow';
    if (code >= 700 && code < 800) return 'fog';
    if (code === 800) return 'clear';
    if (code > 800) return 'cloudy';
    return 'cloudy';
  }
}

// Fetch Full Rich weather details using Open-Meteo as the primary, high-detail API
// This fetches hourly predictions, daily projection ranges, AQI indexes, UV, etc.
export async function fetchWeatherDetails(locationInput) {
  const target = await resolveLocation(locationInput);
  const { lat, lon } = target;

  // 1. Fetch main weather forecast
  const weatherData = await fetchJSON(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code,visibility,uv_index,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`,
    'Open-Meteo weather details'
  );

  // 2. Fetch air quality index
  let aqiVal = 32; // reasonable fallback
  try {
    const aqiData = await fetchJSON(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`,
      'Open-Meteo AQI'
    );
    if (aqiData?.current?.us_aqi) {
      aqiVal = aqiData.current.us_aqi;
    }
  } catch (err) {
    console.warn('AQI lookup failed, falling back.', err);
  }

  const curr = weatherData.current;
  const daily = weatherData.daily;
  const hourly = weatherData.hourly;

  if (!curr || !daily || !hourly) {
    throw new Error('Open-Meteo weather payload incomplete');
  }

  // Parse Hourly List (next 24 hours in steps of 3h)
  const hourlyForecast = [];
  const hourlyLimit = Math.min(24, hourly.time.length);
  for (let i = 1; i < hourlyLimit; i += 2) {
    hourlyForecast.push({
      time: new Date(hourly.time[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(hourly.temperature_2m[i]),
      weatherCode: hourly.weather_code[i],
      condition: getWeatherCondition(hourly.weather_code[i], 'open-meteo'),
      precipProb: hourly.precipitation_probability?.[i] || 0
    });
  }

  // Parse Daily List
  const dailyForecast = [];
  const dailyLimit = Math.min(7, daily.time.length);
  for (let i = 0; i < dailyLimit; i++) {
    dailyForecast.push({
      day: new Date(daily.time[i]).toLocaleDateString('en-US', { weekday: 'short' }),
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      minTemp: Math.round(daily.temperature_2m_min[i]),
      weatherCode: daily.weather_code[i],
      condition: getWeatherCondition(daily.weather_code[i], 'open-meteo')
    });
  }

  // Normalize response into unified dashboard state
  const condition = getWeatherCondition(curr.weather_code, 'open-meteo');

  return {
    displayName: target.displayName,
    resolvedName: target.name,
    country: target.country,
    lat,
    lon,
    isDay: curr.is_day === 1,
    temp: Math.round(curr.temperature_2m),
    feelsLike: Math.round(curr.apparent_temperature),
    humidity: curr.relative_humidity_2m,
    windSpeed: Math.round(curr.wind_speed_10m),
    pressure: Math.round(curr.surface_pressure),
    visibility: hourly.visibility?.[0] ? (hourly.visibility[0] / 1000).toFixed(1) : '10',
    uvIndex: hourly.uv_index?.[0] ?? 0,
    aqi: aqiVal,
    condition,
    description: mapCodeToDescription(curr.weather_code),
    sunrise: daily.sunrise[0],
    sunset: daily.sunset[0],
    precipitation: curr.precipitation || 0,
    hourly: hourlyForecast,
    daily: dailyForecast
  };
}

function mapCodeToDescription(code) {
  const map = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Slight Snow Fall',
    73: 'Moderate Snow Fall',
    75: 'Heavy Snow Fall',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Severe Thunderstorm'
  };
  return map[code] || 'Cloudy';
}
