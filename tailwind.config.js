module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'soft-green': '#10b981',
        'pastel-green': '#d1fae5',
        'status-expired': '#ef4444',
        'status-expiring': '#f97316',
        'status-warning': '#fbbf24',
        'status-safe': '#10b981',
      },
    },
  },
  plugins: [],
}
