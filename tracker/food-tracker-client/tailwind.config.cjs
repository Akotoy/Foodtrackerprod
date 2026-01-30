/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // Важно! Включается классом
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--bg-color)',
          text: 'var(--text-primary)',
          hint: 'var(--text-secondary)',
          button: '#007AFF', // iOS Blue
          secondary: 'var(--card-bg)',
        },
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)'
      }
    },
  },
  plugins: [],
};