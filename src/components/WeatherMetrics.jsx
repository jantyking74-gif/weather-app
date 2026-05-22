import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wind, 
  Droplets, 
  Sun, 
  Gauge, 
  Eye, 
  ShieldAlert 
} from 'lucide-react';

export default function WeatherMetrics({ weather, tempUnit }) {
  const { humidity, windSpeed, pressure, visibility, uvIndex, aqi } = weather;

  // Determine AQI category and glow color
  const getAqiDetails = (val) => {
    if (val <= 50) return { label: 'GOOD', color: 'text-emerald-400 border-emerald-500/20 shadow-emerald-500/5', desc: 'Optimal Air Sector' };
    if (val <= 100) return { label: 'MODERATE', color: 'text-amber-400 border-amber-500/20 shadow-amber-500/5', desc: 'Acceptable Sector' };
    return { label: 'POOR', color: 'text-rose-500 border-rose-500/20 shadow-rose-500/5', desc: 'Filter Mask Required' };
  };

  // Determine UV category and details
  const getUvDetails = (val) => {
    if (val <= 2) return { label: 'LOW', color: 'text-cyber-cyan', desc: 'No Shields Needed' };
    if (val <= 5) return { label: 'MODERATE', color: 'text-cyber-orange', desc: 'Shield Rating: 2' };
    return { label: 'HIGH', color: 'text-cyber-pink', desc: 'Magnetic Shield Active' };
  };

  const aqiInfo = getAqiDetails(aqi);
  const uvInfo = getUvDetails(uvIndex);

  const finalWind = tempUnit === 'C' ? `${windSpeed} km/h` : `${Math.round(windSpeed * 0.621371)} mph`;

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full"
    >
      {/* 1. AIR QUALITY INDEX */}
      <motion.div variants={itemVariants} className={`glass-panel p-4 flex flex-col justify-between items-start transition-all hover:border-emerald-500/40 shadow-glass-neon`}>
        <div className="flex items-center justify-between w-full mb-1">
          <span className="font-mono text-[10px] tracking-wider text-cyber-muted uppercase">SYS_AIR_QUALITY</span>
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <span className="font-orbitron text-2xl font-bold block text-white">{aqi} <span className="text-xs font-mono font-medium text-cyber-cyan">AQI</span></span>
          <span className={`font-mono text-xs font-semibold uppercase ${aqiInfo.color}`}>{aqiInfo.label}</span>
        </div>
        <div className="text-[10px] font-mono text-cyber-muted/80 mt-2 truncate w-full">{aqiInfo.desc}</div>
      </motion.div>

      {/* 2. HUMIDITY */}
      <motion.div variants={itemVariants} className="glass-panel p-4 flex flex-col justify-between items-start transition-all hover:border-cyber-cyan/40">
        <div className="flex items-center justify-between w-full mb-1">
          <span className="font-mono text-[10px] tracking-wider text-cyber-muted uppercase">SYS_MOISTURE</span>
          <Droplets className="w-4 h-4 text-cyber-cyan" />
        </div>
        <div>
          <span className="font-orbitron text-2xl font-bold block text-white">{humidity}%</span>
          <span className="font-mono text-xs text-cyber-cyan/80">HUMIDITY</span>
        </div>
        <div className="text-[10px] font-mono text-cyber-muted/80 mt-2 truncate w-full">Atmospheric condensation</div>
      </motion.div>

      {/* 3. WIND VELOCITY */}
      <motion.div variants={itemVariants} className="glass-panel p-4 flex flex-col justify-between items-start transition-all hover:border-cyber-blue/40">
        <div className="flex items-center justify-between w-full mb-1">
          <span className="font-mono text-[10px] tracking-wider text-cyber-muted uppercase">SYS_WIND_FLOW</span>
          <Wind className="w-4 h-4 text-cyber-blue" />
        </div>
        <div>
          <span className="font-orbitron text-2xl font-bold block text-white truncate max-w-full">{finalWind}</span>
          <span className="font-mono text-xs text-cyber-blue/80">WIND SPEED</span>
        </div>
        <div className="text-[10px] font-mono text-cyber-muted/80 mt-2 truncate w-full">Vector force reading</div>
      </motion.div>

      {/* 4. UV INDEX */}
      <motion.div variants={itemVariants} className="glass-panel p-4 flex flex-col justify-between items-start transition-all hover:border-cyber-orange/40">
        <div className="flex items-center justify-between w-full mb-1">
          <span className="font-mono text-[10px] tracking-wider text-cyber-muted uppercase">SYS_SOLAR_INDEX</span>
          <Sun className="w-4 h-4 text-cyber-orange" />
        </div>
        <div>
          <span className="font-orbitron text-2xl font-bold block text-white">{uvIndex} <span className="text-xs font-mono font-medium text-cyber-orange">UV</span></span>
          <span className={`font-mono text-xs font-semibold uppercase ${uvInfo.color}`}>{uvInfo.label}</span>
        </div>
        <div className="text-[10px] font-mono text-cyber-muted/80 mt-2 truncate w-full">{uvInfo.desc}</div>
      </motion.div>

      {/* 5. SURFACE PRESSURE */}
      <motion.div variants={itemVariants} className="glass-panel p-4 flex flex-col justify-between items-start transition-all hover:border-cyber-pink/40">
        <div className="flex items-center justify-between w-full mb-1">
          <span className="font-mono text-[10px] tracking-wider text-cyber-muted uppercase">SYS_BAROMETER</span>
          <Gauge className="w-4 h-4 text-cyber-pink" />
        </div>
        <div>
          <span className="font-orbitron text-2xl font-bold block text-white">{pressure} <span className="text-xs font-mono font-medium text-cyber-muted">hPa</span></span>
          <span className="font-mono text-xs text-cyber-pink/80">PRESSURE</span>
        </div>
        <div className="text-[10px] font-mono text-cyber-muted/80 mt-2 truncate w-full">Barometric gravity weight</div>
      </motion.div>

      {/* 6. VISIBILITY RANGE */}
      <motion.div variants={itemVariants} className="glass-panel p-4 flex flex-col justify-between items-start transition-all hover:border-purple-500/40">
        <div className="flex items-center justify-between w-full mb-1">
          <span className="font-mono text-[10px] tracking-wider text-cyber-muted uppercase">SYS_VISIBILITY</span>
          <Eye className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <span className="font-orbitron text-2xl font-bold block text-white">{visibility} <span className="text-xs font-mono font-medium text-cyber-muted">km</span></span>
          <span className="font-mono text-xs text-purple-400">RANGE INDEX</span>
        </div>
        <div className="text-[10px] font-mono text-cyber-muted/80 mt-2 truncate w-full">Visual sight accuracy</div>
      </motion.div>
    </motion.div>
  );
}
