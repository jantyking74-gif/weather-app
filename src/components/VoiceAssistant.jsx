import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';
import { listen, stopListening, speak } from '../services/speechService';

export default function VoiceAssistant({ onCitySearch, activeWeather, tempUnit }) {
  const [isListening, setIsListening] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const [showBubble, setShowBubble] = useState(false);

  // Auto-close voice bubble after some time
  useEffect(() => {
    if (showBubble && !isListening) {
      const timer = setTimeout(() => setShowBubble(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showBubble, isListening]);

  // Make the assistant speak current weather
  const speakWeather = (weatherData) => {
    const { displayName, temp, description, humidity, windSpeed } = weatherData;
    const finalTemp = tempUnit === 'C' ? temp : Math.round((temp * 9) / 5 + 32);
    const speedUnit = tempUnit === 'C' ? 'kilometers per hour' : 'miles per hour';
    const finalWind = tempUnit === 'C' ? windSpeed : Math.round(windSpeed * 0.621371);

    const speechText = `Sector ${displayName} telemetry retrieved. Current temperature is ${finalTemp} degrees ${tempUnit === 'C' ? 'Celsius' : 'Fahrenheit'} with ${description}. Humidity is at ${humidity} percent, and winds are flowing at ${finalWind} ${speedUnit}. System is stable.`;
    
    setAssistantText(speechText);
    setShowBubble(true);
    speak(speechText);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setAssistantText('LISTENING FOR COORDINATES OR INSTRUCTIONS...');
    setShowBubble(true);

    listen(
      (transcript) => {
        setIsListening(false);
        const query = transcript.toLowerCase().trim();
        
        // Parse simple commands
        if (query.includes('weather in') || query.includes('search') || query.includes('check')) {
          // extract city
          const cleanQuery = query
            .replace('weather in', '')
            .replace('search for', '')
            .replace('search', '')
            .replace('check', '')
            .trim();
          
          if (cleanQuery) {
            setAssistantText(`SEARCHING SECTOR: "${cleanQuery.toUpperCase()}"`);
            onCitySearch(cleanQuery);
          } else {
            setAssistantText('UNABLE TO EXTRACT SECTOR NAME.');
          }
        } else if (query.length > 0) {
          // Search whatever they said directly
          setAssistantText(`RESOLVING SECTOR: "${query.toUpperCase()}"`);
          onCitySearch(query);
        } else {
          setAssistantText('SIGNAL RETRIEVAL TIMEOUT.');
        }
      },
      () => {
        setIsListening(false);
      },
      (error) => {
        setIsListening(false);
        setAssistantText(`COMMUNICATION FAULT: ${error.toUpperCase()}`);
      }
    );
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Dynamic Chat Bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="pointer-events-auto bg-black/85 border border-cyber-cyan/35 rounded-2xl p-4 shadow-glass-neon text-cyber-cyan font-mono text-xs max-w-[280px] md:max-w-[340px] flex items-start gap-3 backdrop-blur-xl"
          >
            <div className="mt-0.5 animate-pulse">
              <Sparkles className="w-4 h-4 text-cyber-cyan shrink-0" />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <div className="text-[9px] text-cyber-cyan/50 tracking-widest uppercase font-semibold">
                ASSISTANT_TELEMETRY // FEED
              </div>
              <div className="leading-relaxed whitespace-pre-wrap select-text uppercase">
                {assistantText}
              </div>
              {activeWeather && !isListening && (
                <button 
                  onClick={() => speakWeather(activeWeather)}
                  className="pointer-events-auto mt-2 self-start flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-cyan/10 border border-cyber-cyan/20 text-[9px] hover:bg-cyber-cyan hover:text-black transition-all font-bold uppercase tracking-wider"
                >
                  <Volume2 className="w-3 h-3" /> Speak Diagnostics
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing Voice Assistant Button */}
      <motion.button
        onClick={handleMicClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`pointer-events-auto w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center relative shadow-glass-neon transition-all border outline-none ${
          isListening 
            ? 'bg-cyber-pink/20 border-cyber-pink/60 text-cyber-pink shadow-pink-glow' 
            : 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan hover:border-cyber-cyan hover:shadow-cyan-glow'
        }`}
      >
        {/* Radar pulsing rings while listening */}
        {isListening && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-pink/30 opacity-75" />
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-cyber-pink/15 opacity-50 scale-125" />
          </>
        )}

        {/* Neural concentric rings */}
        <span className="absolute inset-1 rounded-full border border-dashed border-cyber-cyan/10 animate-spin-slow" />
        
        {isListening ? (
          <Mic className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
        ) : (
          <MicOff className="w-5 h-5 md:w-6 md:h-6" />
        )}
      </motion.button>
    </div>
  );
}
