import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const interval = 25;
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 400); // short pause at 100%
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#020202] z-[9999] flex flex-col justify-center items-center overflow-hidden">
      {/* Scanlines Effect */}
      <div className="scanlines" />

      {/* Hologram Circle */}
      <div className="relative flex flex-col items-center">
        {/* Animated Cyber Ring */}
        <motion.div 
          className="w-32 h-32 rounded-full border border-cyber-cyan/15 flex items-center justify-center mb-8 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-0 w-2 h-2 rounded-full bg-cyber-cyan shadow-cyan-glow" />
          <div className="absolute bottom-0 w-2 h-2 rounded-full bg-cyber-pink shadow-pink-glow" />
          
          <motion.div 
            className="w-24 h-24 rounded-full border border-dashed border-cyber-cyan/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Meteor/Weather Icon Center */}
        <div className="absolute top-10 text-4xl text-cyber-cyan animate-pulse-glow">
          ⛈️
        </div>

        {/* Glitch Tech Text */}
        <h1 
          className="font-orbitron text-xl md:text-2xl letter-spacing-4 text-cyber-cyan tracking-[0.25em] font-semibold text-center mb-6 uppercase glitch-clip-text"
          data-text="INITIALIZING CYBER-WEATHER OS"
        >
          INITIALIZING CYBER-WEATHER OS
        </h1>

        {/* Progress Bar Container */}
        <div className="w-72 md:w-96 h-1 bg-cyber-cyan/10 rounded-full overflow-hidden relative border border-cyber-cyan/5">
          <motion.div 
            className="h-full bg-cyber-cyan shadow-cyan-glow"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Binary / System logs outputting at the bottom */}
        <div className="mt-8 font-mono text-[10px] text-cyber-cyan/40 tracking-widest text-center uppercase">
          SECURE_AUTH: OK // LATENCY_PING: 12MS // SYS_LOAD: {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
