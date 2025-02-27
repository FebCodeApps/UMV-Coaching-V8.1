/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#000a90',
        secondary: '#ff851b',
        navy: '#721cdb',
        mulberry: '#bc4880',
      },
    },
  },
  plugins: [],
};
