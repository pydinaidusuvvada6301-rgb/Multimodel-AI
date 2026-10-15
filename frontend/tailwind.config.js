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
        background: '#FFFFFF',
        'background-subtle': '#F7F9FC',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F7F9FC',
          hover: '#F2F5F9',
          50: '#F7F9FC',
          100: '#EEF2F6',
          200: '#E5EAF1',
          300: '#D0D7E2',
          400: '#98A2B3',
          500: '#667085',
        },
        primary: {
          DEFAULT: '#356AE6',
          hover: '#2856C5',
          light: '#EEF4FF',
          dark: '#1E44A3',
        },
        text: {
          primary: '#202938',
          secondary: '#667085',
          muted: '#98A2B3',
        },
        border: {
          DEFAULT: '#E5EAF1',
          subtle: '#E5EAF1',
          hover: '#D0D7E2',
          active: '#356AE6',
        },
        status: {
          success: '#12B76A',
          'success-bg': '#ECFDF3',
          'success-text': '#027A48',
          warning: '#F79009',
          'warning-bg': '#FFFAEB',
          'warning-text': '#B54708',
          error: '#F04438',
          'error-bg': '#FEF3F2',
          'error-text': '#B42318',
          info: '#356AE6',
          'info-bg': '#EEF4FF',
          'info-text': '#2856C5',
        },
        brand: {
          blue: '#356AE6',
          'blue-hover': '#2856C5',
          'blue-light': '#EEF4FF',
          charcoal: '#202938',
          gray: '#667085',
          border: '#E5EAF1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'sm': '0 1px 3px 0 rgba(16, 24, 40, 0.08), 0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'md': '0 4px 8px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        'lg': '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)',
        'dropdown': '0 10px 15px -3px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.04)',
        'modal': '0 20px 24px -4px rgba(16, 24, 40, 0.12), 0 8px 8px -4px rgba(16, 24, 40, 0.04)',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      }
    },
  },
  plugins: [],
}
