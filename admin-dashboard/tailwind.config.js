/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Quiet editorial palette shared with the public chat.
        primary: {
          50: '#f3f5f1',
          100: '#e8ede7',
          200: '#d0dbd1',
          300: '#adbfaf',
          400: '#78977f',
          500: '#547663',
          600: '#355b45',
          700: '#294936',
          800: '#243b2e',
          900: '#1d3025',
        },
        accent: {
          50: '#f8f4ef',
          100: '#efe5d9',
          200: '#e1cdb7',
          300: '#c9a88b',
          400: '#ab8061',
          500: '#8b6349',
          600: '#73503d',
          700: '#5e4235',
          800: '#4c372e',
          900: '#3c2c26',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        editorial: ['DM Serif Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
