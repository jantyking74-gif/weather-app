/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#030303",
          cyan: "#00f3ff",
          blue: "#008cff",
          pink: "#ff00ea",
          purple: "#9d4edd",
          orange: "#ffaa00",
          card: "rgba(10, 15, 30, 0.45)",
          border: "rgba(0, 243, 255, 0.15)",
          text: "#e0f8ff",
          muted: "#6b8c96"
        }
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        rajdhani: ["Rajdhani", "sans-serif"]
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%': { textShadow: '0 0 8px rgba(0, 243, 255, 0.6), 0 0 15px rgba(0, 243, 255, 0.4)', opacity: '0.8' },
          '100%': { textShadow: '0 0 15px rgba(0, 243, 255, 0.9), 0 0 30px rgba(0, 243, 255, 0.6)', opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        flicker: {
          '0%, 100%': { opacity: '0.99' },
          '50%': { opacity: '0.95' }
        }
      },
      boxShadow: {
        'glass-neon': 'inset 0 0 15px rgba(0, 243, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.7)',
        'cyan-glow': '0 0 15px rgba(0, 243, 255, 0.3)',
        'pink-glow': '0 0 15px rgba(255, 0, 234, 0.3)',
      }
    },
  },
  plugins: [],
}
