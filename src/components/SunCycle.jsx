import React from 'react';
import { motion } from 'framer-motion';
import { Sunrise, Sunset } from 'lucide-react';

export default function SunCycle({ sunrise, sunset }) {
  // Convert ISO date strings to human-readable times
  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  };

  // Calculate sun position percentage along the arc
  const getSunProgress = () => {
    try {
      const now = new Date();
      const rise = new Date(sunrise);
      const set = new Date(sunset);

      if (now < rise) return 0; // Sun hasn't risen yet
      if (now > set) return 1;  // Sun has already set

      const totalDaylight = set.getTime() - rise.getTime();
      const currentDaylight = now.getTime() - rise.getTime();

      return currentDaylight / totalDaylight; // Fraction between 0 and 1
    } catch (e) {
      return 0.5; // default half way
    }
  };

  const progress = getSunProgress();
  
  // Calculate X and Y coordinates along a parabolic path
  // SVG coordinates: Width=100, Height=50
  // Parabola: y = 45 - 40 * sin(progress * pi)
  // x = 10 + 80 * progress
  const sunX = 10 + 80 * progress;
  const sunY = 45 - 35 * Math.sin(progress * Math.PI);

  const isNight = progress === 0 || progress === 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 flex flex-col justify-between items-stretch h-full relative overflow-hidden shadow-glass-neon hover:border-cyber-cyan/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4 w-full">
        <span className="font-mono text-[10px] tracking-wider text-cyber-muted uppercase">SYS_SOLAR_ORBITAL</span>
        <span className="font-mono text-[9px] text-cyber-cyan bg-cyber-cyan/10 px-2 py-0.5 rounded border border-cyber-cyan/20">
          {isNight ? 'NIGHT_CYCLE' : 'SOLAR_ACTIVE'}
        </span>
      </div>

      {/* Arc Graphic */}
      <div className="relative w-full h-24 flex items-center justify-center mt-2">
        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
          {/* Base Horizon Line */}
          <line 
            x1="5" 
            y1="45" 
            x2="95" 
            y2="45" 
            stroke="rgba(0, 243, 255, 0.15)" 
            strokeWidth="0.5" 
            strokeDasharray="2 2"
          />

          {/* Parabolic Orbit Arc */}
          <path 
            d="M 10 45 A 40 35 0 0 1 90 45" 
            fill="none" 
            stroke="rgba(0, 243, 255, 0.25)" 
            strokeWidth="1.5" 
            strokeDasharray="1 1"
          />

          {/* Active solar progress path */}
          {!isNight && (
            <path 
              d={`M 10 45 A 40 35 0 0 1 ${sunX} ${sunY}`} 
              fill="none" 
              stroke="url(#solarGlow)" 
              strokeWidth="2.0"
            />
          )}

          {/* Sun glowing node */}
          {!isNight && (
            <circle 
              cx={sunX} 
              cy={sunY} 
              r="2.5" 
              fill="#ffaa00" 
              filter="url(#glowFilter)"
              className="animate-pulse"
            />
          )}

          {/* Definitions for gradients & glows */}
          <defs>
            <linearGradient id="solarGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#008cff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffaa00" stopOpacity="1" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Sunrise & Sunset Timestamp */}
      <div className="flex justify-between items-center mt-4 border-t border-cyber-border/30 pt-3">
        <div className="flex items-center gap-2">
          <Sunrise className="w-4 h-4 text-cyber-orange animate-pulse" />
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-cyber-muted uppercase">SUNRISE</span>
            <span className="font-orbitron text-xs font-semibold text-white">{formatTime(sunrise)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sunset className="w-4 h-4 text-cyber-blue animate-pulse" />
          <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] text-cyber-muted uppercase">SUNSET</span>
            <span className="font-orbitron text-xs font-semibold text-white">{formatTime(sunset)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
