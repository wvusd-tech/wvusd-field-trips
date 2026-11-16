/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wvusd: {
          navy: '#1e3a8a',
          dark: '#0f172a',
          gold: '#d97706',
          light: '#f8fafc',
          blue: '#2563eb'
        }
      }
    },
  },
  plugins: [],
}
