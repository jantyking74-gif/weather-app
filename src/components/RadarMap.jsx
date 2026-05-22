import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';
import L from 'leaflet';

export default function RadarMap({ lat, lon, displayName }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // --- INITIALIZE LEAFLET MAP ---
    if (!mapInstanceRef.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([lat, lon], 9);

      // Add modern tiles (styled via CSS filters in index.css as .dark-leaflet)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(map);

      // Add a customized neon scanner pulse circle
      const marker = L.circle([lat, lon], {
        color: '#00f3ff',
        fillColor: '#008cff',
        fillOpacity: 0.15,
        radius: 8000,
        weight: 2
      }).addTo(map);

      // Add pulse animation inside leaflet map
      let pulseUp = true;
      const pulseInterval = setInterval(() => {
        if (!marker) return;
        const currentRadius = marker.getRadius();
        if (pulseUp) {
          marker.setRadius(currentRadius + 400);
          if (currentRadius > 14000) pulseUp = false;
        } else {
          marker.setRadius(currentRadius - 400);
          if (currentRadius < 6000) pulseUp = true;
        }
      }, 60);

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Save interval for clear
      mapInstanceRef.current._pulseInterval = pulseInterval;
    } else {
      // If map exists, update view and coordinate center
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      map.setView([lat, lon], 9);
      if (marker) {
        marker.setLatLng([lat, lon]);
      }
    }

    // Force map to recalculate sizes properly in flexible boxes
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      // Cleanup on unmount (only cleanup fully if needed, otherwise we can keep instance)
    };
  }, [lat, lon]);

  // Handle cleanup fully on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        clearInterval(mapInstanceRef.current._pulseInterval);
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-5 flex flex-col justify-between items-stretch h-full min-h-[220px] shadow-glass-neon hover:border-cyber-cyan/30 transition-all duration-300 relative group"
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-4 w-full z-10 bg-cyber-card/80 backdrop-blur rounded p-1.5 border border-cyber-border/40">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-cyber-cyan shrink-0" />
          <span className="font-mono text-xs tracking-wider text-cyber-cyan font-bold uppercase truncate">
            WEATHER_RADAR_SCANNER
          </span>
        </div>
        <span className="font-mono text-[9px] text-cyber-muted tracking-widest hidden md:inline truncate">
          GRID: {lat.toFixed(4)}N / {lon.toFixed(4)}E
        </span>
      </div>

      {/* Map Div */}
      <div className="flex-1 w-full rounded-xl overflow-hidden dark-leaflet border border-cyber-border/40 z-0 h-44 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Futuristic scanline and vignette overlay */}
        <div className="absolute inset-0 pointer-events-none border border-cyber-cyan/15 rounded-xl shadow-[inset_0_0_15px_rgba(0,243,255,0.15)] bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </motion.div>
  );
}
