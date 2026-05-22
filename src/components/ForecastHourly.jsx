import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Droplet } from 'lucide-react';

const getConditionSymbol = (condition = 'clear') => {
  const cond = condition.toLowerCase();
  if (cond.includes('clear')) return '☀️';
  if (cond.includes('cloudy')) return '⛅';
  if (cond.includes('fog') || cond.includes('mist')) return '🌫️';
  if (cond.includes('thunderstorm')) return '⛈️';
  if (cond.includes('snow')) return '❄️';
  return '🌧️';
};

export default function ForecastHourly({ hourly, tempUnit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 flex flex-col justify-between items-stretch h-full shadow-glass-neon hover:border-cyber-cyan/30 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-cyber-cyan" />
        <span className="font-mono text-xs tracking-wider text-cyber-cyan font-bold uppercase">
          24-HOUR SECTOR FORECAST
        </span>
      </div>

      {/* Horizontal scrolling slider container */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {hourly.map((item, index) => {
          const finalTemp = tempUnit === 'C' ? item.temp : Math.round((item.temp * 9) / 5 + 32);

          return (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              className="min-w-[85px] flex-shrink-0 bg-black/35 border border-cyber-border/40 rounded-xl p-3 flex flex-col items-center justify-between text-center gap-2 hover:border-cyber-cyan/30 hover:bg-cyber-cyan/5 transition-all duration-200"
            >
              {/* Time */}
              <span className="font-mono text-[10px] text-cyber-muted tracking-wider">
                {item.time}
              </span>

              {/* Icon */}
              <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(0,243,255,0.25)] select-none my-1">
                {getConditionSymbol(item.condition)}
              </span>

              {/* Precipitation Probability */}
              <div className="h-4 flex items-center justify-center">
                {item.precipProb > 0 ? (
                  <span className="flex items-center gap-0.5 font-mono text-[9px] text-sky-400 font-bold">
                    <Droplet className="w-2.5 h-2.5 fill-sky-400/20" />
                    {item.precipProb}%
                  </span>
                ) : (
                  <span className="text-transparent text-[9px] font-mono select-none">-</span>
                )}
              </div>

              {/* Temp */}
              <span className="font-orbitron text-sm font-bold text-white">
                {finalTemp}°
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
