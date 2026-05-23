/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          bg: '#0b0f19',      // Sleek deep dark blue/black
          sidebar: '#121824', // Modern dark panel
          border: '#1e293b',  // Border color
          primary: '#6366f1', // Vibrant Indigo
          secondary: '#8b5cf6', // Indigo-Violet
          accent: '#10b981', // Emerald green for positive metrics/status
          warning: '#f59e0b', // Amber for intake/warnings
          danger: '#ef4444', // Red for lost/critical
          text: '#f8fafc',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
