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
        // Simple color definitions - Safari compatible
        // Light mode (default)
        bg: {
          primary: '#FFFFFF',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6',
          DEFAULT: '#FFFFFF',
        },
        border: {
          default: '#E5E7EB',
          primary: '#D1D5DB',
          DEFAULT: '#E5E7EB',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          muted: '#9CA3AF',
          DEFAULT: '#111827',
        },
        accent: {
          blue: '#2563EB',
          DEFAULT: '#2563EB',
        },
        signal: {
          green: '#22C55E',
          red: '#EF4444',
          yellow: '#EAB308',
          purple: '#A855F7',
          blue: '#2563EB',
        },
        chart: {
          up: '#22C55E',
          down: '#EF4444',
        },
        // Dark mode overrides (applied when .dark class present)
        dark: {
          bg: {
            primary: '#0D1117',
            secondary: '#161B22',
            tertiary: '#21262D',
          },
          border: {
            default: '#30363D',
          },
          text: {
            primary: '#E6EDF3',
            secondary: '#8B949E',
            muted: '#484F58',
          },
          accent: {
            blue: '#58A6FF',
          },
          signal: {
            green: '#3FB950',
            red: '#F85149',
            yellow: '#D29922',
            purple: '#A371F7',
          },
          chart: {
            up: '#26A69A',
            down: '#EF5350',
          },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        data: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'data-xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        'data-sm': ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.01em' }],
        'data-base': ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0.01em' }],
        'data-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }],
        'data-xl': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'card': '0.5rem',
        'panel': '0.75rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.24)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.36)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.36)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Add dark mode variants
    function({ addVariant }) {
      addVariant('dark', '.dark &');
    },
  ],
}
