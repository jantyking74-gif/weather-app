// C-W OS Core Engine

// ==========================================
// CONFIGURATION
// ==========================================
const OWM_API_KEY = 'YOUR_OWM_API_KEY_HERE'; // Replace with OpenWeatherMap API Key
let currentUnit = 'C';
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

// Hybrid Fetcher: Uses OWM if key is present, else Open-Meteo
async function fetchWeather(location) {
    try {
        if (OWM_API_KEY && OWM_API_KEY !== 'YOUR_OWM_API_KEY_HERE') {
            await fetchOWM(location);
        } else {
            console.warn("OWM API key missing. Falling back to Open-Meteo API for real-time rich data.");
            await fetchOpenMeteo(location);
        }
        
        // Update recent if it's a string (city search)
        if (typeof location === 'string') {
            updateRecentSearches(location);
        }
    } catch (err) {
        console.error(err);
        showAlert("SYSTEM ERROR: Unable to locate target sector.");
    }
}

async function fetchOWM(location) {
    let lat, lon, name, country;
    if (typeof location === 'string') {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${OWM_API_KEY}`);
        const geoData = await geoRes.json();
        if (!geoData.length) throw new Error('City not found');
        ({ lat, lon, name, country } = geoData[0]);
    } else {
        lat = location.lat; lon = location.lon; name = location.name; country = '';
    }
    const unitParam = currentUnit === 'C' ? 'metric' : 'imperial';

    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=${unitParam}`);
    const weatherData = await weatherRes.json();
    
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=${unitParam}`);
    const forecastData = await forecastRes.json();

    document.getElementById('city-name').innerText = country ? `${name}, ${country}`.toUpperCase() : name.toUpperCase();
    document.getElementById('temp').innerText = Math.round(weatherData.main.temp) + '°';
    document.getElementById('condition').innerText = weatherData.weather[0].description;
    document.getElementById('feels-like').innerText = Math.round(weatherData.main.feels_like) + '°';
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
                <span class="hourly-temp">${Math.round(item.main.temp)}°</span>
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
                <div class="daily-temp">${Math.round(max)}° <span>/ ${Math.round(min)}°</span></div>
            </div>
        `;
    });
}

async function fetchOpenMeteo(location) {
    let lat, lon, name;
    if (typeof location === 'string') {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results) throw new Error('City not found');
        const loc = geoData.results[0];
        lat = loc.latitude; lon = loc.longitude; name = loc.name;
    } else {
        lat = location.lat; lon = location.lon; name = location.name;
    }

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
    
    // Fetch AQI separately
    const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`);
    
    const weatherData = await weatherRes.json();
    const aqiData = await aqiRes.json();

    const curr = weatherData.current;
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    const toCurrentUnit = (val) => currentUnit === 'C' ? Math.round(val) : Math.round((val * 9/5) + 32);

    document.getElementById('city-name').innerText = name.toUpperCase();
    document.getElementById('temp').innerText = toCurrentUnit(curr.temperature_2m) + '°';
    document.getElementById('feels-like').innerText = toCurrentUnit(curr.apparent_temperature) + '°';
    document.getElementById('humidity').innerText = curr.relative_humidity_2m + '%';
    document.getElementById('wind').innerText = curr.wind_speed_10m + ' km/h';
    document.getElementById('pressure').innerText = curr.surface_pressure + ' hPa';
    document.getElementById('visibility').innerText = (hourly.visibility[0] / 1000).toFixed(1) + ' km';
    document.getElementById('uv').innerText = hourly.uv_index[0] || '0';
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
    for(let i=1; i<=24; i+=3) {
        const time = new Date(hourly.time[i]).getHours() + ':00';
        hourlyEl.innerHTML += `
            <div class="hourly-item">
                <span class="hourly-time">${time}</span>
                <span class="hourly-icon">${getWeatherIcon(hourly.weather_code[i])}</span>
                <span class="hourly-temp">${toCurrentUnit(hourly.temperature_2m[i])}°</span>
            </div>
        `;
    }

    const dailyEl = document.getElementById('daily-forecast');
    dailyEl.innerHTML = '';
    for(let i=1; i<7; i++) {
        const day = new Date(daily.time[i]).toLocaleDateString('en-US', {weekday: 'short'});
        dailyEl.innerHTML += `
            <div class="daily-item">
                <span class="daily-day">${day}</span>
                <span class="daily-icon">${getWeatherIcon(daily.weather_code[i])}</span>
                <div class="daily-temp">${toCurrentUnit(daily.temperature_2m_max[i])}° <span>/ ${toCurrentUnit(daily.temperature_2m_min[i])}°</span></div>
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
    if(!recentSearches.includes(city.toUpperCase())) {
        recentSearches.unshift(city.toUpperCase());
        if(recentSearches.length > 5) recentSearches.pop();
        localStorage.setItem('cwos_recent', JSON.stringify(recentSearches));
        renderRecent();
    }
}

function renderRecent() {
    const ul = document.getElementById('recent-list');
    ul.innerHTML = '';
    recentSearches.forEach(city => {
        const li = document.createElement('li');
        li.innerText = city;
        li.onclick = () => fetchWeather(city);
        ul.appendChild(li);
    });
}

document.getElementById('search-btn').addEventListener('click', () => {
    const city = document.getElementById('city-input').value;
    if(city) fetchWeather(city);
});

document.getElementById('city-input').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        const city = e.target.value;
        if(city) fetchWeather(city);
    }
});

function autoDetectLocation() {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const {latitude, longitude} = pos.coords;
            let locationName = 'Current Location';
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                if(res.ok) {
                    const data = await res.json();
                    locationName = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || 'Current Location';
                }
            } catch(e) {
                console.warn("Reverse geocoding failed", e);
            }
            fetchWeather({lat: latitude, lon: longitude, name: locationName});
        }, () => {
            showAlert("Location access denied. Showing default.");
            fetchWeather("Tokyo");
        });
    } else {
        showAlert("Geolocation not supported. Showing default.");
        fetchWeather("Tokyo");
    }
}

document.getElementById('location-btn').addEventListener('click', autoDetectLocation);

document.getElementById('unit-toggle').addEventListener('click', (e) => {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    e.target.innerText = `SYS: °${currentUnit}`;
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
};
