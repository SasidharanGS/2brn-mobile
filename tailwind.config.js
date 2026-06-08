/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#60a5fa',
          500: '#60a5fa',
          600: '#3b82f6',
          700: '#2563eb',
        },
      },
    },
  },
  plugins: [],
}
