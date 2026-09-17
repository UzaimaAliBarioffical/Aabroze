/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FAF7F2',
          50: '#FDFCFA',
          100: '#FAF7F2',
          200: '#F5EFE4',
          300: '#EDE3D1',
        },
        beige: {
          DEFAULT: '#F0EAE0',
          100: '#F0EAE0',
          200: '#E5D9C8',
          300: '#D4C4AE',
        },
        taupe: {
          DEFAULT: '#8B7355',
          100: '#C4AD92',
          200: '#A68B6A',
          300: '#8B7355',
          400: '#6E5A40',
          500: '#5C4A32',
        },
        maroon: {
          DEFAULT: '#6B2D3E',
          100: '#C4748A',
          200: '#A0475C',
          300: '#6B2D3E',
          400: '#4E1F2D',
          500: '#35141E',
        },
        brown: {
          DEFAULT: '#4A3728',
          100: '#8B6F55',
          200: '#6B5040',
          300: '#4A3728',
          400: '#2E2118',
        },
        charcoal: {
          DEFAULT: '#2C2C2C',
          100: '#6B6B6B',
          200: '#4A4A4A',
          300: '#2C2C2C',
          400: '#1A1A1A',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      screens: {
        xs: '390px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        soft: '0 2px 12px rgba(0,0,0,0.06)',
        card: '0 4px 20px rgba(0,0,0,0.08)',
        hover: '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
