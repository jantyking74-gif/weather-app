// C-W OS Core Engine

// ==========================================
// CONFIGURATION
// ==========================================
const OWM_API_KEY = window.CWOS_CONFIG?.OWM_API_KEY || 'YOUR_OWM_API_KEY_HERE';
const DEFAULT_LOCATION = 'Tokyo';
const REQUEST_TIMEOUT_MS = 10000;
const DEGREE_SYMBOL = '\u00B0';
let currentUnit = 'C';
let activeLocation = null;
let recentSearches = JSON.parse(localStorage.getItem('cwos_recent')) || [];

// ==========================================
// GSAP INTRO ANIMATION
// ==========================================
function initIntro() {
    const tl = gsap.timeline();
    
    tl.to('.loading-progress', {
        width: '100%',
        duration: 2,
        ease: 'power2.inOut'
    })
    .to('#startup-screen', {
        opacity: 0,
        duration: 0.8,
        ease: 'power1.out',
        onComplete: () => {
            document.getElementById('startup-screen').style.display = 'none';
        }
    })
    .to('#main-ui', {
        opacity: 1,
        duration: 0.5
    })
    .from('.sidebar', {
        x: -50,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(1.7)'
    }, '-=0.3')
    .from('.card', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.5)'
    }, '-=0.4');
}

// ==========================================
// THREE.JS BACKGROUND
// ==========================================
let scene, camera, renderer, particleSystem;

function initThreeJS() {
    const canvas = document.getElementById('webgl-canvas');
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ambient Particles (Dust/Stars)
    const geometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const material = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Grid Helper for Cyberpunk feel
    const gridHelper = new THREE.GridHelper(100, 50, 0x00f3ff, 0x00f3ff);
    gridHelper.position.y = -20;
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    animateThreeJS();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function animateThreeJS() {
    requestAnimationFrame(animateThreeJS);
    
    // Slowly rotate particle system
    if(particleSystem) {
        particleSystem.rotation.y += 0.0005;
        particleSystem.rotation.x += 0.0002;
    }

    renderer.render(scene, camera);
}

// Update particles based on weather
function setWeatherEffect(condition) {
    if(!particleSystem) return;
    const mat = particleSystem.material;
    condition = condition.toLowerCase();
    
    if (condition.includes('rain')) {
        mat.color.setHex(0x008cff);
        mat.size = 0.2;
    } else if (condition.includes('snow')) {
        mat.color.setHex(0xffffff);
        mat.size = 0.3;
    } else if (condition.includes('clear')) {
        mat.color.setHex(0xffaa00);
        mat.size = 0.15;
    } else {
        mat.color.setHex(0x00f3ff);
        mat.size = 0.1;
    }
}

// ==========================================
// INTERACTIVITY (Tilt, etc)
// ==========================================
function initTilt() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            gsap.to(card, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 0.5,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out' });
        });
    });
}

// ==========================================
// CLOCK ENGINE
// ==========================================
function updateClock() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('datetime').innerText = now.toLocaleString('en-US', options);
    setTimeout(updateClock, 1000);
}

// ==========================================
// WEATHER DATA LOGIC
// ==========================================

function getWeatherIcon(code, isDay = true) {
    // Open-Meteo fallback codes
    if (typeof code === 'number') {
        if (code === 0) return isDay ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        if (code <= 3) return '<i class="fa-solid fa-cloud-sun"></i>';
        if (code <= 48) return '<i class="fa-solid fa-smog"></i>';
        if (code <= 57) return '<i class="fa-solid fa-cloud-rain"></i>';
        if (code <= 67) return '<i class="fa-solid fa-cloud-showers-heavy"></i>';
        if (code <= 77) return '<i class="fa-solid fa-snowflake"></i>';
        if (code <= 82) return '<i class="fa-solid fa-cloud-showers-water"></i>';
        if (code <= 86) return '<i class="fa-solid fa-snowflake"></i>';
        if (code >= 95) return '<i class="fa-solid fa-cloud-bolt"></i>';
        return '<i class="fa-solid fa-cloud"></i>';
    }
    // OWM Icon codes
    const map = {
        '01d': 'fa-sun', '01n': 'fa-moon',
        '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
        '03d': 'fa-cloud', '03n': 'fa-cloud',
        '04d': 'fa-cloud', '04n': 'fa-cloud',
        '09d': 'fa-cloud-rain', '09n': 'fa-cloud-rain',
        '10d': 'fa-cloud-showers-heavy', '10n': 'fa-cloud-showers-heavy',
        '11d': 'fa-cloud-bolt', '11n': 'fa-cloud-bolt',
        '13d': 'fa-snowflake', '13n': 'fa-snowflake',
        '50d': 'fa-smog', '50n': 'fa-smog'
    };
    return `<i class="fa-solid ${map[code] || 'fa-cloud'}"></i>`;
}

function hasValidOwmKey() {
    return OWM_API_KEY && OWM_API_KEY !== 'YOUR_OWM_API_KEY_HERE';
}

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
    if (!hasValidOwmKey()) throw new Error('OWM API key missing');

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

    throw lastError || new Error('OpenWeather could not find this location');
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

    throw lastError || new Error('Open-Meteo could not find this location');
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

    throw lastError || new Error('Nominatim could not find this location');
}

async function resolveLocation(location) {
    if (typeof location === 'string') {
        const query = normalizeSearchQuery(location);
        if (!query) throw new Error('Location is empty');

        const cityProviders = [
            ...(hasValidOwmKey() ? [geocodeWithOWM] : []),
            geocodeWithOpenMeteo,
            geocodeWithNominatim
        ];
        const detailedProviders = [
            geocodeWithNominatim,
            ...(hasValidOwmKey() ? [geocodeWithOWM] : []),
            geocodeWithOpenMeteo
        ];
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
        throw new Error(`Location not found: ${query}`);
    }

    if (!location) throw new Error('Location is empty');

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

// Hybrid Fetcher: Uses OWM if key is present, else Open-Meteo
async function fetchWeather(location) {
    try {
        const target = await resolveLocation(location);

        if (hasValidOwmKey()) {
            try {
                await fetchOWM(target);
            } catch (e) {
                console.warn("OWM API failed. Falling back to Open-Meteo API.", e);
                await fetchOpenMeteo(target);
            }
        } else {
            console.warn("OWM API key missing. Falling back to Open-Meteo API for real-time rich data.");
            await fetchOpenMeteo(target);
        }

        activeLocation = target;
        
        // Update recent if it's a string (city search)
        if (typeof location === 'string') {
            updateRecentSearches(target.displayName || location);
        }
    } catch (err) {
        console.error(err);
        showAlert("SYSTEM ERROR: Unable to locate target sector.");
    }
}

async function fetchOWM(location) {
    const target = typeof location === 'string' ? await resolveLocation(location) : location;
    const { lat, lon } = target;
    const unitParam = currentUnit === 'C' ? 'metric' : 'imperial';
    const encodedKey = encodeURIComponent(OWM_API_KEY);

    const weatherData = await fetchJSON(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${encodedKey}&units=${unitParam}`,
        'OpenWeather current weather'
    );
    
    const forecastData = await fetchJSON(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${encodedKey}&units=${unitParam}`,
        'OpenWeather forecast'
    );

    if (!weatherData.main || !Array.isArray(weatherData.weather) || !weatherData.weather.length) {
        throw new Error(weatherData.message || 'OpenWeather current weather payload incomplete');
    }
    if (!Array.isArray(forecastData.list)) {
        throw new Error(forecastData.message || 'OpenWeather forecast payload incomplete');
    }

    document.getElementById('city-name').innerText = target.displayName.toUpperCase();
    document.getElementById('temp').innerText = Math.round(weatherData.main.temp) + DEGREE_SYMBOL;
    document.getElementById('condition').innerText = weatherData.weather[0].description;
    document.getElementById('feels-like').innerText = Math.round(weatherData.main.feels_like) + DEGREE_SYMBOL;
    document.getElementById('humidity').innerText = weatherData.main.humidity + '%';
    document.getElementById('wind').innerText = weatherData.wind.speed + (currentUnit === 'C' ? ' m/s' : ' mph');
    document.getElementById('pressure').innerText = weatherData.main.pressure + ' hPa';
    document.getElementById('visibility').innerText = (weatherData.visibility / 1000).toFixed(1) + ' km';
    document.getElementById('current-icon').innerHTML = getWeatherIcon(weatherData.weather[0].icon);

    const formatTime = (ts) => new Date(ts * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('sunrise').innerText = formatTime(weatherData.sys.sunrise);
    document.getElementById('sunset').innerText = formatTime(weatherData.sys.sunset);

    setWeatherEffect(weatherData.weather[0].main);

    document.getElementById('aqi').innerText = 'N/A';
    document.getElementById('uv').innerText = 'N/A';

    const hourlyEl = document.getElementById('hourly-forecast');
    hourlyEl.innerHTML = '';
    forecastData.list.slice(0, 8).forEach(item => {
        const time = new Date(item.dt * 1000).getHours() + ':00';
        hourlyEl.innerHTML += `
            <div class="hourly-item">
                <span class="hourly-time">${time}</span>
                <span class="hourly-icon">${getWeatherIcon(item.weather[0].icon)}</span>
                <span class="hourly-temp">${Math.round(item.main.temp)}${DEGREE_SYMBOL}</span>
            </div>
        `;
    });

    const dailyEl = document.getElementById('daily-forecast');
    dailyEl.innerHTML = '';
    const days = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', {weekday: 'short'});
        if(!days[date]) days[date] = [];
        days[date].push(item.main.temp);
    });

    Object.keys(days).slice(0,7).forEach(day => {
        const max = Math.max(...days[day]);
        const min = Math.min(...days[day]);
        dailyEl.innerHTML += `
            <div class="daily-item">
                <span class="daily-day">${day}</span>
                <span class="daily-icon"><i class="fa-solid fa-cloud"></i></span>
                <div class="daily-temp">${Math.round(max)}${DEGREE_SYMBOL} <span>/ ${Math.round(min)}${DEGREE_SYMBOL}</span></div>
            </div>
        `;
    });
}

async function fetchOpenMeteo(location) {
    const target = typeof location === 'string' ? await resolveLocation(location) : location;
    const { lat, lon } = target;

    const weatherData = await fetchJSON(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`,
        'Open-Meteo forecast'
    );
    
    // Fetch AQI separately
    let aqiData = {};
    try {
        aqiData = await fetchJSON(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`,
            'Open-Meteo air quality'
        );
    } catch (err) {
        console.warn('AQI lookup failed', err);
    }

    const curr = weatherData.current;
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    if (!curr || !daily || !hourly) {
        throw new Error('Open-Meteo weather payload incomplete');
    }

    const toCurrentUnit = (val) => currentUnit === 'C' ? Math.round(val) : Math.round((val * 9/5) + 32);

    document.getElementById('city-name').innerText = target.displayName.toUpperCase();
    document.getElementById('temp').innerText = toCurrentUnit(curr.temperature_2m) + DEGREE_SYMBOL;
    document.getElementById('feels-like').innerText = toCurrentUnit(curr.apparent_temperature) + DEGREE_SYMBOL;
    document.getElementById('humidity').innerText = curr.relative_humidity_2m + '%';
    document.getElementById('wind').innerText = curr.wind_speed_10m + ' km/h';
    document.getElementById('pressure').innerText = curr.surface_pressure + ' hPa';
    const visibilityMeters = hourly.visibility?.[0];
    document.getElementById('visibility').innerText = Number.isFinite(visibilityMeters) ? (visibilityMeters / 1000).toFixed(1) + ' km' : 'N/A';
    document.getElementById('uv').innerText = hourly.uv_index?.[0] ?? '0';
    document.getElementById('aqi').innerText = aqiData.current ? aqiData.current.us_aqi : 'N/A';

    const conditionStr = ["Clear", "Cloudy", "Fog", "Drizzle", "Rain", "Snow", "Thunderstorm"];
    const type = curr.weather_code <= 3 ? 0 : curr.weather_code <= 48 ? 2 : curr.weather_code <= 57 ? 3 : curr.weather_code <= 67 ? 4 : curr.weather_code <= 77 ? 5 : 6;
    document.getElementById('condition').innerText = conditionStr[type];
    document.getElementById('current-icon').innerHTML = getWeatherIcon(curr.weather_code, curr.is_day);

    setWeatherEffect(conditionStr[type]);

    const formatTime = (iso) => new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('sunrise').innerText = formatTime(daily.sunrise[0]);
    document.getElementById('sunset').innerText = formatTime(daily.sunset[0]);

    const hourlyEl = document.getElementById('hourly-forecast');
    hourlyEl.innerHTML = '';
    const hourlyLimit = Math.min(24, hourly.time.length - 1);
    for(let i=1; i<=hourlyLimit; i+=3) {
        const time = new Date(hourly.time[i]).getHours() + ':00';
        hourlyEl.innerHTML += `
            <div class="hourly-item">
                <span class="hourly-time">${time}</span>
                <span class="hourly-icon">${getWeatherIcon(hourly.weather_code[i])}</span>
                <span class="hourly-temp">${toCurrentUnit(hourly.temperature_2m[i])}${DEGREE_SYMBOL}</span>
            </div>
        `;
    }

    const dailyEl = document.getElementById('daily-forecast');
    dailyEl.innerHTML = '';
    const dailyLimit = Math.min(7, daily.time.length);
    for(let i=1; i<dailyLimit; i++) {
        const day = new Date(daily.time[i]).toLocaleDateString('en-US', {weekday: 'short'});
        dailyEl.innerHTML += `
            <div class="daily-item">
                <span class="daily-day">${day}</span>
                <span class="daily-icon">${getWeatherIcon(daily.weather_code[i])}</span>
                <div class="daily-temp">${toCurrentUnit(daily.temperature_2m_max[i])}${DEGREE_SYMBOL} <span>/ ${toCurrentUnit(daily.temperature_2m_min[i])}${DEGREE_SYMBOL}</span></div>
            </div>
        `;
    }
}

// ==========================================
// UTILITIES & EVENTS
// ==========================================
function showAlert(msg) {
    const alertEl = document.getElementById('weather-alert');
    document.getElementById('alert-text').innerText = msg;
    alertEl.classList.remove('hidden');
    setTimeout(() => alertEl.classList.add('hidden'), 5000);
}

function updateRecentSearches(city) {
    const label = normalizeSearchQuery(city);
    if(!label) return;

    recentSearches = recentSearches.filter(item => normalizeMatchKey(item) !== normalizeMatchKey(label));
    recentSearches.unshift(label);
    if(recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem('cwos_recent', JSON.stringify(recentSearches));
    renderRecent();
}

function renderRecent() {
    const ul = document.getElementById('recent-list');
    ul.innerHTML = '';
    recentSearches.forEach(city => {
        const li = document.createElement('li');
        li.innerText = city.toUpperCase();
        li.title = city;
        li.onclick = () => fetchWeather(city);
        ul.appendChild(li);
    });
}

document.getElementById('search-btn').addEventListener('click', () => {
    const city = normalizeSearchQuery(document.getElementById('city-input').value);
    if(city) fetchWeather(city);
});

document.getElementById('city-input').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        const city = normalizeSearchQuery(e.target.value);
        if(city) fetchWeather(city);
    }
});

function autoDetectLocation() {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const {latitude, longitude} = pos.coords;
            let locationName = 'Current Location';
            let state = '';
            let country = '';
            try {
                const data = await fetchJSON(
                    `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&format=jsonv2&addressdetails=1`,
                    'Reverse geocoding'
                );
                const address = data.address || {};
                locationName = address.city || address.town || address.village || address.hamlet || address.county || address.state || 'Current Location';
                state = address.state || address.county || address.state_district || '';
                country = address.country_code?.toUpperCase() || address.country || '';
            } catch(e) {
                console.warn("Reverse geocoding failed", e);
            }
            fetchWeather({lat: latitude, lon: longitude, name: locationName, state, country, source: 'gps'});
        }, () => {
            showAlert("Location access denied. Showing default.");
            fetchWeather(DEFAULT_LOCATION);
        }, {
            enableHighAccuracy: true,
            timeout: REQUEST_TIMEOUT_MS + 5000,
            maximumAge: 300000
        });
    } else {
        showAlert("Geolocation not supported. Showing default.");
        fetchWeather(DEFAULT_LOCATION);
    }
}

document.getElementById('location-btn').addEventListener('click', autoDetectLocation);

document.getElementById('unit-toggle').addEventListener('click', (e) => {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    e.target.innerText = `SYS: ${DEGREE_SYMBOL}${currentUnit}`;
    if(activeLocation) {
        fetchWeather(activeLocation);
        return;
    }
    const currentCity = document.getElementById('city-name').innerText.split(',')[0];
    if(currentCity && currentCity !== "SYSTEM STANDBY" && currentCity !== "ERROR") {
        fetchWeather(currentCity);
    }
});

// Voice Search
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.onresult = (e) => {
        const city = e.results[0][0].transcript;
        document.getElementById('city-input').value = city;
        fetchWeather(city);
    };
    document.getElementById('voice-btn').addEventListener('click', () => {
        recognition.start();
        showAlert("Voice search activated. Listening...");
    });
} else {
    document.getElementById('voice-btn').style.display = 'none';
}

// Initialize System
window.onload = () => {
    initThreeJS();
    initTilt();
    updateClock();
    renderRecent();
    initIntro();
    
    // Auto load current location
    setTimeout(() => {
        autoDetectLocation();
    }, 2000);

    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('PWA Service Worker Registered'))
            .catch(err => console.warn('Service Worker Registration Failed', err));
    }
};
