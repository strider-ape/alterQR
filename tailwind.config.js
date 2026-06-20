/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 uses content to find files with Tailwind classes
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
