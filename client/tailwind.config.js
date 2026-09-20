/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── ColorHunt Palette: #5003C0 #AB03A9 #FF467A #FFD51E ──
        neon: {
          950: '#0a0015',   // deepest dark bg
          900: '#0f0020',   // main background
          800: '#180030',   // card surface
          700: '#220040',   // elevated surface
          purple: '#5003C0',
          magenta: '#AB03A9',
          pink: '#FF467A',
          yellow: '#FFD51E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2.5s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%': { transform: 'translateY(100%)', opacity: '0.2' },
        }
      }
    },
  },
  plugins: [],
}
