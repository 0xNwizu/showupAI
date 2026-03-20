import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors — gov.uk palette
        brand: {
          purple: '#1d70b8',        // gov.uk blue
          'purple-light': '#5694ca', // gov.uk light blue
          'purple-dark': '#003078',  // gov.uk dark blue
          pink: '#f47738',           // gov.uk warning orange
          'pink-light': '#ffb280',
          cyan: '#5694ca',
          'cyan-light': '#aecaf0',
        },
        // Solana — remapped to gov.uk palette
        solana: {
          purple: '#1d70b8',
          green: '#00a86b',          // bright gov.uk-inspired green
          'purple-dark': '#003078',
        },
        // Dark backgrounds — neutral navy, no purple tint
        dark: {
          50: '#1a2332',
          100: '#141e2e',
          200: '#0d1824',
          300: '#090f1a',
          400: '#06080f',
          bg: '#0b0c0c',
          card: '#161b22',
          'card-hover': '#1e2530',
          border: '#2d3748',
          'border-light': '#4a5568',
        },
        // Status colors — gov.uk standard
        success: '#00703c',
        warning: '#f47738',
        danger: '#d4351c',
        info: '#5694ca',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #003078 0%, #1d70b8 100%)',
        'gradient-solana': 'linear-gradient(135deg, #1d70b8 0%, #00a86b 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0b0c0c 0%, #0d1824 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(29,112,184,0.08) 0%, rgba(0,48,120,0.04) 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(29,112,184,0.25)',
        'glow-pink': '0 0 20px rgba(244,119,56,0.25)',
        'glow-cyan': '0 0 20px rgba(86,148,202,0.25)',
        'glow-green': '0 0 20px rgba(0,168,107,0.25)',
        'card': '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 40px rgba(29,112,184,0.15)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(29,112,184,0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(29,112,184,0.5), 0 0 60px rgba(29,112,184,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}

export default config
