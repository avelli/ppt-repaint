/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFCF8',
          100: '#FBF7F0',
          200: '#F5EFE3',
          300: '#EDE5D4',
          400: '#E2D8C4',
          500: '#D4C9B0',
        },
        sage: {
          100: '#E8EDDF',
          200: '#D4DDCC',
          300: '#B5C4A8',
          400: '#8FA87A',
          500: '#6B8F5B',
          600: '#4A6741',
          700: '#3D5535',
        },
        warm: {
          700: '#5C4A3A',
          800: '#3D3229',
          900: '#2A211A',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        display: ['"Noto Serif SC"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
}
