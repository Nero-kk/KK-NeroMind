/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Apple Style Colors
        'nero-light': '#F5F5F7',
        'nero-dark': '#0D1117',
        'nero-accent': '#007AFF',
        'nero-accent-hover': '#0056B3',
        'nero-text-light': '#1D1D1F',
        'nero-text-dark': '#F5F5F7',
        'nero-border-light': '#D2D2D7',
        'nero-border-dark': '#30363D',
        'nero-surface-light': '#FFFFFF',
        'nero-surface-dark': '#161B22',
      },
      fontFamily: {
        'sf': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'nero': '12px',
      },
      boxShadow: {
        'nero-light': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'nero-dark': '0 2px 8px rgba(0, 0, 0, 0.32)',
      },
    },
  },
  plugins: [],
  // Prefix to avoid conflicts with Obsidian styles
  prefix: 'nm-',
}
