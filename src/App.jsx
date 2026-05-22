import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Navigation as NavIcon, 
  AlertTriangle, 
  Volume2, 
  RefreshCw 
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { fetchWeatherDetails } from './services/weatherApi';

// Component Imports
import WeatherCanvas from './components/WeatherCanvas';
import LoadingScreen from './components/LoadingScreen';
import CurrentWeather from './components/CurrentWeather';
import WeatherMetrics from './components/WeatherMetrics';
import ForecastHourly from './components/ForecastHourly';
import ForecastDaily from './components/ForecastDaily';
import SunCycle from './components/SunCycle';
import RadarMap from './components/RadarMap';
import SavedCitiesWidget from './components/SavedCitiesWidget';
import Navigation from './components/Navigation';
import VoiceAssistant from './components/VoiceAssistant';

const DEFAULT_LOCATION = 'Tokyo';

export default function App() {
  const [initLoading, setInitLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [tempUnit, setTempUnit] = useLocalStorage('cwos_unit', 'C');
  const [recentSearches, setRecentSearches] = useLocalStorage('cwos_recent', []);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sysTime, setSysTime] = useState('');

  // Clock ticks
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      };
      setSysTime(now.toLocaleString('en-US', options).toUpperCase());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Core Weather Data
  const loadWeather = async (cityOrCoords) => {
    setDataLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchWeatherDetails(cityOrCoords);
      setWeather(data);
      
      // Save search term to recents list
      const cityName = data.resolvedName || (typeof cityOrCoords === 'string' ? cityOrCoords : data.displayName);
      updateRecentSearches(cityName);
    } catch (err) {
      console.error(err);
      setErrorMsg('COMMUNICATION FAULT: SECTOR COULD NOT BE RESOLVED.');
      triggerAlert('SYSTEM DIAGNOSTICS: Target resolution failed.');
    } finally {
      setDataLoading(false);
    }
  };

  const updateRecentSearches = (city) => {
    const name = city.trim();
    if (!name) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== name.toLowerCase());
      const updated = [name, ...filtered];
      return updated.slice(0, 6); // keep top 6 saved cities
    });
  };

  const removeCity = (city) => {
    setRecentSearches(prev => prev.filter(item => item !== city));
  };

  const clearHistory = () => {
    setRecentSearches([]);
  };

  // GPS Auto Detection
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      setErrorMsg('LOCATOR FAULT: GEOLOCATION NOT SUPPORTED.');
      loadWeather(DEFAULT_LOCATION);
      return;
    }

    setDataLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        loadWeather({ lat: latitude, lon: longitude, displayName: 'GPS sector' });
      },
      (err) => {
        console.warn('GPS denied or timed out:', err);
        setErrorMsg('LOCATOR REJECTED: Showing default base sector.');
        loadWeather(DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Initial load
  useEffect(() => {
    // Attempt GPS load on startup, fallback to default sector
    const initLoad = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            loadWeather({ lat: latitude, lon: longitude, displayName: 'GPS sector' });
          },
          () => {
            loadWeather(DEFAULT_LOCATION);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        loadWeather(DEFAULT_LOCATION);
      }
    };
    initLoad();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      loadWeather(query);
      setSearchQuery('');
      setActiveTab('dashboard'); // pull back to dashboard immediately
    }
  };

  // Cyber Alert HUD notification
  const [alertHUD, setAlertHUD] = useState('');
  const triggerAlert = (msg) => {
    setAlertHUD(msg);
    setTimeout(() => setAlertHUD(''), 5000);
  };

  return (
    <div className="w-full h-full relative flex flex-col justify-between overflow-hidden">
      {/* 3D Particle Canvas Background */}
      {weather && (
        <WeatherCanvas 
          condition={weather.condition} 
          isDay={weather.isDay} 
        />
      )}

      {/* Futuristic CRT Overlays */}
      <div className="scanlines" />

      {/* Hologram Loading Intro */}
      <AnimatePresence>
        {initLoading && (
          <LoadingScreen onComplete={() => setInitLoading(false)} />
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-col p-4 md:p-6 w-full max-w-[1400px] mx-auto z-10 gap-4 overflow-y-auto pb-24">
        
        {/* HEADER SECTION */}
        <header className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-black/30 border border-cyber-border/40 rounded-2xl p-4 backdrop-blur shadow-glass-neon">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-cyber-cyan/15 flex items-center justify-center border border-cyber-cyan/35 text-cyber-cyan animate-float-slow">
                ⚡
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron font-black text-lg tracking-[0.2em] text-white neon-glow-text">
                  CW-OS
                </span>
                <span className="font-mono text-[9px] text-cyber-muted tracking-widest uppercase">
                  v2.6 // METRIC OS
                </span>
              </div>
            </div>
          </div>

          {/* Search controls */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[500px] flex items-center bg-black/50 border border-cyber-cyan/30 rounded-xl overflow-hidden shadow-[inset_0_0_10px_rgba(0,243,255,0.05)] focus-within:border-cyber-cyan focus-within:shadow-cyan-glow transition-all duration-300">
            <input
              type="text"
              placeholder="SEARCH SECTOR GLOBALLY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none text-white px-4 py-2.5 font-mono text-xs md:text-sm placeholder-cyber-muted/65 outline-none uppercase tracking-wider"
            />
            <button
              type="submit"
              className="px-4 text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors border-l border-cyber-border/40"
              title="Search sector"
            >
              <Search className="w-4 h-4 shrink-0" />
            </button>
          </form>

          {/* Device Actions */}
          <div className="flex items-center gap-2 justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGPSDetect}
                className="w-10 h-10 rounded-xl bg-cyber-cyan/10 hover:bg-cyber-cyan hover:text-black border border-cyber-cyan/20 hover:border-cyber-cyan transition-all flex items-center justify-center text-cyber-cyan hover:shadow-cyan-glow"
                title="Detect sector via GPS"
              >
                <MapPin className="w-4 h-4 shrink-0" />
              </button>
              
              <button
                onClick={() => setTempUnit(prev => prev === 'C' ? 'F' : 'C')}
                className="font-orbitron text-xs font-black tracking-widest text-cyber-cyan bg-cyber-cyan/10 hover:bg-cyber-cyan hover:text-black border border-cyber-cyan/20 hover:border-cyber-cyan px-4 h-10 rounded-xl transition-all flex items-center justify-center hover:shadow-cyan-glow shrink-0"
              >
                SYS: °{tempUnit}
              </button>
            </div>

            {/* Diagnostic system clock */}
            <div className="font-mono text-[10px] text-cyber-cyan/60 text-right tracking-widest uppercase hidden lg:block shrink-0">
              SYS_EPOCH: {sysTime || 'AWAITING_TICKS'}
            </div>
          </div>
        </header>

        {/* SYSTEM FAULT ALARM HUD */}
        <AnimatePresence>
          {alertHUD && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3 text-amber-500 font-mono text-xs font-semibold shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-flicker"
            >
              <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
              <span className="uppercase tracking-widest truncate">{alertHUD}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SYSTEM STATUS FAULT MESSAGE */}
        {errorMsg && (
          <div className="w-full bg-cyber-pink/15 border border-cyber-pink/40 rounded-xl p-3 flex items-center gap-3 text-cyber-pink font-mono text-xs font-semibold shadow-[0_0_15px_rgba(255,0,234,0.15)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="uppercase tracking-widest">{errorMsg}</span>
          </div>
        )}

        {/* LOADING INDICATOR HUD */}
        {dataLoading && (
          <div className="w-full bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-xl p-3.5 flex items-center justify-center gap-3 text-cyber-cyan font-mono text-xs font-semibold shadow-cyan-glow relative overflow-hidden">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
            <span className="uppercase tracking-widest animate-pulse">SYNCHRONIZING SECTOR DATABASE...</span>
            <div className="absolute bottom-0 left-0 h-0.5 bg-cyber-cyan animate-pulse w-full" />
          </div>
        )}

        {/* MAIN DISPLAY CONTAINER */}
        <main className="flex-1 flex flex-col w-full relative">
          <AnimatePresence mode="wait">
            {weather && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex-1 w-full"
              >
                {/* 1. MAIN GRID DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full">
                    {/* Left: Current sector large widget */}
                    <div className="lg:col-span-1 h-full min-h-[350px]">
                      <CurrentWeather 
                        weather={weather} 
                        tempUnit={tempUnit} 
                      />
                    </div>

                    {/* Middle & Right: Telemetries and forecasts */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      {/* Telemetry info grids */}
                      <div className="w-full">
                        <WeatherMetrics 
                          weather={weather} 
                          tempUnit={tempUnit} 
                        />
                      </div>

                      {/* Projections block: hourly and solar orbital */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="w-full">
                          <ForecastHourly 
                            hourly={weather.hourly} 
                            tempUnit={tempUnit} 
                          />
                        </div>
                        <div className="w-full">
                          <SunCycle 
                            sunrise={weather.sunrise} 
                            sunset={weather.sunset} 
                          />
                        </div>
                      </div>

                      {/* Weekly range capsules */}
                      <div className="w-full">
                        <ForecastDaily 
                          daily={weather.daily} 
                          tempUnit={tempUnit} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. RADAR VIEW */}
                {activeTab === 'radar' && (
                  <div className="w-full h-full min-h-[450px]">
                    <RadarMap 
                      lat={weather.lat} 
                      lon={weather.lon} 
                      displayName={weather.displayName} 
                    />
                  </div>
                )}

                {/* 3. MEMORY BANK RECENT LOGS VIEW */}
                {activeTab === 'history' && (
                  <div className="w-full max-w-[650px] mx-auto">
                    <SavedCitiesWidget
                      recentSearches={recentSearches}
                      onSelectCity={(city) => {
                        loadWeather(city);
                        setActiveTab('dashboard'); // return home
                      }}
                      onClearHistory={clearHistory}
                      onRemoveCity={removeCity}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* SPEECH AND VOICE ASSISTANT COMPONENT */}
      {weather && (
        <VoiceAssistant
          onCitySearch={loadWeather}
          activeWeather={weather}
          tempUnit={tempUnit}
        />
      )}

      {/* FLOATING BOTTOM GLASS NAVIGATION BAR */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
