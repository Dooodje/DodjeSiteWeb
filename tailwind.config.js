/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        dodje: {
          ink: '#0A0400',
          green: '#06D001',
          'green-light': '#9BEC00',
          brown: '#7C6354',
          yellow: '#F3FF90'
        }
      },
      fontFamily: {
        arboria: ['Arboria', 'system-ui', '-apple-system', 'sans-serif']
      },
      transitionTimingFunction: {
        'dodje-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  plugins: []
}
