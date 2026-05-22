import React from 'react';
import { motion } from 'framer-motion';
import { History, Search, Trash2, MapPin, Sparkles } from 'lucide-react';

// Suggested global sector nodes
const PRESET_SECTORS = [
  { name: 'Tokyo', desc: 'Neo-Tokyo sector' },
  { name: 'Reykjavik', desc: 'Sub-Arctic sector' },
  { name: 'New York', desc: 'Atlantic Coast sector' },
  { name: 'London', desc: 'Meridian Sector' },
  { name: 'Cairo', desc: 'Sahara sector' }
];

export default function SavedCitiesWidget({ recentSearches, onSelectCity, onClearHistory, onRemoveCity }) {
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="glass-panel p-6 flex flex-col gap-6 h-full min-h-[300px] shadow-glass-neon hover:border-cyber-cyan/30 transition-all duration-300 relative overflow-hidden"
    >
      {/* Background cyber grid */}
      <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyber-border/40 pb-4 z-10">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyber-cyan" />
          <span className="font-orbitron text-sm tracking-widest text-cyber-cyan font-bold uppercase">
            SYS_MEMORY_BANK
          </span>
        </div>
        
        {recentSearches.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyber-pink/10 hover:bg-cyber-pink/25 text-[10px] text-cyber-pink border border-cyber-pink/30 hover:border-cyber-pink/60 rounded-full transition-all font-mono font-bold uppercase tracking-wider"
          >
            <Trash2 className="w-3 h-3" /> Clear Memory
          </button>
        )}
      </div>

      {/* Main Recents list */}
      <div className="flex-1 overflow-y-auto pr-1 z-10 flex flex-col gap-3 max-h-[220px]">
        {recentSearches.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-cyber-muted font-mono text-xs gap-2">
            <span className="text-3xl filter opacity-45 select-none">💾</span>
            <span>MEMORY CORES EMPTY</span>
            <span className="text-[10px] opacity-60">NO SECTOR LOGS CACHED IN LOCAL_DRIVE</span>
          </div>
        ) : (
          recentSearches.map((city, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ scale: 1.01, x: 4 }}
              className="flex items-center justify-between p-3.5 bg-black/40 border border-cyber-border/30 rounded-xl hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5 transition-all duration-200"
            >
              <button
                onClick={() => onSelectCity(city)}
                className="flex-1 flex items-center gap-3 text-left focus:outline-none"
              >
                <div className="w-6 h-6 rounded-full bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/20">
                  <MapPin className="w-3 h-3 text-cyber-cyan shrink-0 animate-pulse" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-orbitron text-xs font-bold text-white tracking-wide uppercase truncate">
                    {city}
                  </span>
                  <span className="font-mono text-[9px] text-cyber-muted tracking-widest">
                    SYS_SECTOR_LOGGED
                  </span>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCity(city);
                }}
                className="p-1.5 rounded-lg border border-transparent hover:border-cyber-pink/20 hover:bg-cyber-pink/10 text-cyber-muted hover:text-cyber-pink transition-all"
                title="Erase telemetry log"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Preset Suggestions Section */}
      <div className="border-t border-cyber-border/40 pt-4 z-10">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-cyber-orange shrink-0 animate-pulse" />
          <span className="font-mono text-[10px] tracking-wider text-cyber-muted uppercase">
            RECOMMENDED_COORDINATE_CORES
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PRESET_SECTORS.map((sector, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCity(sector.name)}
              className="bg-black/35 border border-cyber-border/30 rounded-xl p-2.5 flex flex-col items-start text-left hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5 transition-all text-xs outline-none"
            >
              <span className="font-orbitron font-semibold text-white tracking-wide uppercase truncate w-full">
                {sector.name}
              </span>
              <span className="font-mono text-[8px] text-cyber-muted truncate w-full mt-0.5">
                {sector.desc}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
