/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0B0D0E',
          surface: '#131618',
          subtle: '#1C2023',
          border: '#272C30',
          hover: '#1F2428',
          text: '#EDEDED',
          muted: '#8E959E',
        },
        lightterm: {
          bg: '#F5F6F8',
          surface: '#FFFFFF',
          subtle: '#ECEEF1',
          border: '#D8DCE2',
          hover: '#E5E8ED',
          text: '#111418',
          muted: '#626B76',
        },
        amber: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          dark: '#B45309',
          faint: 'rgba(245, 158, 11, 0.12)',
        },
        semantic: {
          safe: '#10B981',       // Green: lowest touch prob / safe
          safeFaint: 'rgba(16, 185, 129, 0.12)',
          warn: '#F59E0B',       // Amber: moderate touch prob
          warnFaint: 'rgba(245, 158, 11, 0.12)',
          danger: '#EF4444',     // Red: high touch prob / unsafe
          dangerFaint: 'rgba(239, 68, 68, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        none: 'none',
      }
    },
  },
  plugins: [],
}

