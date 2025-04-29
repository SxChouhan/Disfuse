/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media' for media-query based dark mode
  theme: {
    extend: {
      colors: {
        neonGreen: '#00FF88',
        darkBg: '#2D2D3A',
        darkSecondary: '#3A3A4A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 255, 136, 0.5)',
      },
    },
  },
  plugins: [],
}
