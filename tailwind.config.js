/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nes: {
          dark: '#212529',
          blue: '#209cee',
          green: '#92cc41',
          yellow: '#f7d51d',
          red: '#e76e55',
          white: '#fff',
          gray: '#cccccc',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
      },
      cursor: {
        pixel: 'url("/cursor-hand.png"), auto',
      },
    },
  },
  plugins: [],
  corePlugins: {
    borderRadius: false, // Disable all border-radius utilities
  },
}
