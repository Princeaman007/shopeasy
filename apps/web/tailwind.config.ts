import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06C167',
          hover:   '#05a558',
        },
        bg:       '#000000',
        surface:  '#141414',
        elevated: '#1a1a1a',
        border:   '#2a2a2a',
        text:     '#FFFFFF',
        muted:    '#888888',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        // ── Bandeau défilant ──────────────────────────────────────────────
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        fadeIn:  'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
        // ── Bandeau défilant — 25s pour un défilement fluide ─────────────
        marquee: 'marquee 25s linear infinite',
      },
      borderRadius: {
        xl:    '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(6, 193, 103, 0.3)',
        'glow-sm':      '0 0 10px rgba(6, 193, 103, 0.2)',
        'surface':      '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}

export default config