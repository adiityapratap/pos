/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          700: '#6F4E37',
          800: '#5d4230',
        },
      },
    },
  },
  plugins: [],
}
