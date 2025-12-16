import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        mood: {
          angry: {
            light: '#fef2f2',
            DEFAULT: '#ef4444',
            dark: '#dc2626',
            darker: '#991b1b',
          },
          sad: {
            light: '#fffbeb',
            DEFAULT: '#f59e0b',
            dark: '#d97706',
            darker: '#92400e',
          },
          average: {
            light: '#f9fafb',
            DEFAULT: '#6b7280',
            dark: '#4b5563',
            darker: '#1f2937',
          },
          happy: {
            light: '#ecfdf5',
            DEFAULT: '#10b981',
            dark: '#059669',
            darker: '#065f46',
          },
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        soft: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
        medium: '0 4px 16px 0 rgb(0 0 0 / 0.1)',
        elevated: '0 8px 24px 0 rgb(0 0 0 / 0.12)',
        floating: '0 12px 32px 0 rgb(0 0 0 / 0.15)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-down': 'slide-in-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'bounce-once': 'bounce-once 0.4s ease-in-out',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-down': {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-once': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

export default config
