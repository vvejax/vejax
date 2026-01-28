module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        neon: '0 0 12px rgba(45, 212, 191, 0.4), 0 0 28px rgba(59, 130, 246, 0.35)',
      },
      colors: {
        'neon-blue': '#4cc9f0',
        'neon-pink': '#f72585',
      },
    },
  },
  plugins: [],
};
