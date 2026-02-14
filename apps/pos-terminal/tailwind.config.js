/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-dark': '#111827',
        'navy-main': '#1A1F3A',
        'navy-card': '#2A324E',
        'navy-lighter': '#29314D',
        'accent-yellow': '#FBBF24',
        'accent-gold': '#F59E0B',
        'accent-blue': '#3B82F6',
        'accent-green': '#10B981',
        'accent-purple': '#8B5CF6',
        'accent-red': '#EF4444',
        'text-primary': '#FFFFFF',
        'text-secondary': '#D1D5DB',
        'text-muted': '#6B7280',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
