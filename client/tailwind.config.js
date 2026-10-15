/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        apple: {
          blue: '#0A84FF',
          blueHover: '#0071E3',
          green: '#30D158',
          red: '#FF453A',
          yellow: '#FFD60A',
          purple: '#BF5AF2',
        },
      },
    },
  },
  plugins: [],
}
