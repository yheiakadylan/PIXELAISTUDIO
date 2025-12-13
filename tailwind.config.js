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
        // Theme system
        'theme-primary': 'var(--color-primary, #3b82f6)',
        'theme-secondary': 'var(--color-secondary, #10b981)',
        'theme-accent': 'var(--color-accent, #8b5cf6)',
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
        'retro-xl': '12px 12px 0px 0px rgba(0,0,0,1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.5)',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '6': '6px',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionTimingFunction: {
        'snappy': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.6, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      animation: {
        'fadeIn': 'fadeIn 300ms ease-out forwards',
        'slideInUp': 'slideInUp 400ms ease-out forwards',
        'slideInDown': 'slideInDown 400ms ease-out forwards',
        'slideInLeft': 'slideInLeft 400ms ease-out forwards',
        'slideInRight': 'slideInRight 400ms ease-out forwards',
        'scaleIn': 'scaleIn 300ms ease-out forwards',
        'bounceIn': 'bounceIn 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 400ms ease-in-out',
        'wiggle': 'wiggle 500ms ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
