/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        "retro-bg": "#d4d4d4",
        "retro-bg-dark": "#121212",
        "retro-card": "#ffffff",
        "retro-card-dark": "#2a2a2a",
      },
      fontFamily: {
        display: ['"Press Start 2P"', 'cursive'],
        body: ['"VT323"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: "0px",
        none: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        full: "0px",
      },
      boxShadow: {
        'retro': '6px 6px 0px 0px rgba(0,0,0,1)',
        'retro-hover': '8px 8px 0px 0px rgba(0,0,0,1)',
        'retro-active': '2px 2px 0px 0px rgba(0,0,0,1)',
        'retro-dark': '6px 6px 0px 0px rgba(255,255,255,0.2)',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
