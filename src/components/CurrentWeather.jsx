import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Weather condition symbol mapper
const getConditionSymbol = (condition = 'clear', isDay = true) => {
  const cond = condition.toLowerCase();
  if (cond.includes('clear')) {
    return isDay ? '☀️' : '🌙';
  }
  if (cond.includes('cloudy')) {
    return '⛅';
  }
  if (cond.includes('fog') || cond.includes('mist')) {
    return '🌫️';
  }
  if (cond.includes('thunderstorm')) {
    return '⛈️';
  }
  if (cond.includes('snow')) {
    return '❄️';
  }
  if (cond.includes('rain') || cond.includes('drizzle')) {
    return '🌧️';
  }
  return '☁️';
};

export default function CurrentWeather({ weather, tempUnit }) {
  const { temp, feelsLike, condition, description, displayName } = weather;
  const [displayTemp, setDisplayTemp] = useState(0);

  // Convert temp to unit
  const finalTemp = tempUnit === 'C' ? temp : Math.round((temp * 9) / 5 + 32);
  const finalFeels = tempUnit === 'C' ? feelsLike : Math.round((feelsLike * 9) / 5 + 32);

  // Count up animation when temp changes
  useEffect(() => {
    let start = 0;
    const end = finalTemp;
    if (start === end) {
      setDisplayTemp(end);
      return;
    }

    const duration = 800; // ms
    const stepTime = Math.abs(Math.floor(duration / (end - start || 1)));
    
    // cap the step time
    const actualStep = Math.max(stepTime, 15);

    const timer = setInterval(() => {
      start += end > start ? 1 : -1;
      setDisplayTemp(start);
      if (start === end) {
        clearInterval(timer);
      }
    }, actualStep);

    return () => clearInterval(timer);
  }, [finalTemp]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel-glow p-6 md:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden group h-full"
    >
      {/* Subtle interior glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyber-cyan/10 blur-2xl rounded-full group-hover:bg-cyber-cyan/20 transition-colors duration-300" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-cyber-pink/10 blur-2xl rounded-full group-hover:bg-cyber-pink/20 transition-colors duration-300" />

      {/* City Sector Header */}
      <div className="z-10 w-full flex flex-col items-center">
        <span className="font-mono text-xs text-cyber-cyan/50 tracking-[0.3em] uppercase mb-1">
          LOCATION SECTOR: ACTIVE
        </span>
        <h2 className="font-orbitron text-xl md:text-2xl font-bold tracking-wider text-white neon-glow-text truncate max-w-full">
          {displayName.toUpperCase()}
        </h2>
      </div>

      {/* Floating 3D Icon */}
      <div className="my-6 md:my-8 text-7xl md:text-8xl select-none animate-float-medium filter drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
        {getConditionSymbol(condition, weather.isDay)}
      </div>

      {/* Temperature Display with Animated Numbers */}
      <div className="z-10 mb-4">
        <h3 className="font-orbitron text-6xl md:text-7xl font-extrabold text-white tracking-tight relative inline-block">
          {displayTemp}
          <span className="text-3xl md:text-4xl text-cyber-cyan align-super font-normal ml-0.5">
            °{tempUnit}
          </span>
        </h3>
        
        {/* Sky Condition */}
        <p className="font-mono text-sm md:text-base text-cyber-blue uppercase tracking-widest mt-2 font-medium">
          {description}
        </p>
      </div>

      {/* Feels Like Details */}
      <div className="z-10 border-t border-cyber-border/40 w-full pt-4 font-mono text-xs md:text-sm text-cyber-muted">
        SYS_APPARENT_TEMP:{' '}
        <span className="text-white font-semibold ml-1">
          {finalFeels}°{tempUnit}
        </span>
      </div>
    </motion.div>
  );
}
