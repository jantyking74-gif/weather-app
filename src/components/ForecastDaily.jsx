import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

const getConditionSymbol = (condition = 'clear') => {
  const cond = condition.toLowerCase();
  if (cond.includes('clear')) return '☀️';
  if (cond.includes('cloudy')) return '⛅';
  if (cond.includes('fog') || cond.includes('mist')) return '🌫️';
  if (cond.includes('thunderstorm')) return '⛈️';
  if (cond.includes('snow')) return '❄️';
  return '🌧️';
};

export default function ForecastDaily({ daily, tempUnit }) {
  // Convert temperature to active unit
  const toUnit = (celsiusTemp) => {
    return tempUnit === 'C' ? celsiusTemp : Math.round((celsiusTemp * 9) / 5 + 32);
  };

  // Find the absolute minimum and maximum across the entire 7-day span
  // to calculate the proportional ranges
  const dailyTempsInUnit = daily.map(d => ({
    min: toUnit(d.minTemp),
    max: toUnit(d.maxTemp)
  }));

  const absoluteMin = Math.min(...dailyTempsInUnit.map(t => t.min));
  const absoluteMax = Math.max(...dailyTempsInUnit.map(t => t.max));
  const totalRange = absoluteMax - absoluteMin || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 flex flex-col justify-between items-stretch h-full shadow-glass-neon hover:border-cyber-cyan/30 transition-all duration-300"
    >
      {/* Title Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-cyber-blue" />
        <span className="font-mono text-xs tracking-wider text-cyber-blue font-bold uppercase">
          7-DAY METRIC PROJECTION
        </span>
      </div>

      {/* Grid of Days */}
      <div className="flex flex-col gap-3">
        {daily.map((item, index) => {
          const finalMin = toUnit(item.minTemp);
          const finalMax = toUnit(item.maxTemp);

          // Proportional range positioning calculations
          const leftOffset = ((finalMin - absoluteMin) / totalRange) * 100;
          const barWidth = ((finalMax - finalMin) / totalRange) * 100;

          return (
            <motion.div
              key={index}
              whileHover={{ x: 3, backgroundColor: 'rgba(0, 243, 255, 0.03)' }}
              className="flex items-center justify-between bg-black/20 border border-cyber-border/20 rounded-xl p-3 gap-3 md:gap-4 transition-all duration-200"
            >
              {/* Day Label */}
              <span className="w-12 font-mono text-sm text-cyber-text font-semibold uppercase">
                {item.day}
              </span>

              {/* Condition Icon */}
              <span className="text-2xl filter drop-shadow-[0_0_6px_rgba(0,243,255,0.15)] select-none">
                {getConditionSymbol(item.condition)}
              </span>

              {/* Min Temp */}
              <span className="w-8 font-mono text-xs text-cyber-muted text-right font-medium">
                {finalMin}°
              </span>

              {/* Apple Weather Style Proportional Range Bar */}
              <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden relative border border-white/5">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-pink shadow-cyan-glow absolute origin-left"
                  style={{
                    left: `${leftOffset}%`,
                    width: `${Math.max(barWidth, 6)}%` // min 6% width so it always draws a visible capsule
                  }}
                />
              </div>

              {/* Max Temp */}
              <span className="w-8 font-mono text-xs text-white text-left font-semibold">
                {finalMax}°
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
