// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx", 
    "./app/**/*.{js,jsx,ts,tsx}" // This scans your app/ folder
  ],
  presets: [require("nativewind/preset")], // <-- THIS IS A NEW, IMPORTANT LINE
  theme: {
    extend: {},
  },
  plugins: [],
};