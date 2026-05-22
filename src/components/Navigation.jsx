import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Map, History } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutGrid },
    { id: 'radar', label: 'RADAR MAP', icon: Map },
    { id: 'history', label: 'MEMORY BANK', icon: History }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-[420px] pointer-events-none">
      <div className="pointer-events-auto bg-black/60 border border-cyber-border/80 rounded-full py-2.5 px-4 flex justify-between items-center shadow-glass-neon backdrop-blur-xl relative overflow-hidden">
        {/* Subtle scanline background inside navigation */}
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative py-1.5 px-4 flex flex-col items-center justify-center gap-1 group focus:outline-none transition-all"
            >
              {/* Highlight bar under tab */}
              {isActive && (
                <motion.div
                  layoutId="activeNavTab"
                  className="absolute inset-0 bg-cyber-cyan/10 border border-cyber-cyan/35 rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Glowing active node */}
              {isActive && (
                <div className="absolute top-0 w-1.5 h-1.5 rounded-full bg-cyber-cyan shadow-cyan-glow" />
              )}

              <Icon 
                className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-300 ${
                  isActive 
                    ? 'text-cyber-cyan filter drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]' 
                    : 'text-cyber-muted group-hover:text-white'
                }`} 
              />
              <span 
                className={`font-orbitron text-[9px] tracking-widest font-semibold transition-all duration-300 ${
                  isActive ? 'text-cyber-cyan' : 'text-cyber-muted group-hover:text-white'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
