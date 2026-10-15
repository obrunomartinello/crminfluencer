/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        apple: {
          bg: '#000000',
          surface: '#1C1C1E',
          card: '#2C2C2E',
          blue: '#0A84FF',
          green: '#30D158',
          red: '#FF453A',
          yellow: '#FFD60A',
          text: '#FFFFFF',
          muted: 'rgba(255,255,255,0.55)',
        },
      },
    },
  },
  plugins: [],
}
