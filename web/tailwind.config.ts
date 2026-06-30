import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace']
      },
      colors: {
        // DentalFlow brand — a clean medical teal/jade.
        brand: {
          50: '#ecfdf7',
          100: '#d0f7ec',
          200: '#a3efdc',
          300: '#6ee0c8',
          400: '#38c9ad',
          500: '#16ad94',
          600: '#0c8c79', // primary
          700: '#0c6f63',
          800: '#0e5850',
          900: '#0f4942',
          950: '#042f2b'
        },
        // Warm "tooth shade" amber — the single accent (VITA reference).
        shade: {
          100: '#fbf1de',
          200: '#f4e3c6',
          400: '#e8b873',
          600: '#c98a3c'
        },
        porcelain: '#f5f9f7', // clinical off-white background
        ink: '#07211d' // deep teal-black for headings / dark sections
      },
      boxShadow: {
        card: '0 1px 2px rgba(7,33,29,0.04), 0 14px 40px -18px rgba(7,33,29,0.18)',
        lift: '0 2px 4px rgba(7,33,29,0.05), 0 24px 56px -22px rgba(7,33,29,0.28)',
        glow: '0 10px 40px -10px rgba(12,140,121,0.45)'
      },
      backgroundImage: {
        // Modern jade → cyan brand gradient.
        'brand-gradient': 'linear-gradient(120deg, #0c6f63 0%, #0c8c79 40%, #16ad94 70%, #2bb6d6 100%)'
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-18px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(22,173,148,0.55)' },
          '70%,100%': { boxShadow: '0 0 0 7px rgba(22,173,148,0)' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'grow-x': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' }
        },
        dot: {
          '0%,80%,100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-5px)', opacity: '1' }
        },
        breathe: {
          '0%,100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.06)', opacity: '1' }
        }
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float 11s ease-in-out infinite',
        shimmer: 'shimmer 7s linear infinite',
        'pulse-ring': 'pulse-ring 2.2s ease-out infinite',
        dot: 'dot 1.2s ease-in-out infinite',
        breathe: 'breathe 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
