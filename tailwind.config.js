// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#10B981",       // emerald
        primaryDark: "#065F46",   // dark green
        background: "#F9FAFB",    // light gray bg
        slateDark: "#1F2937",     // dark text
        grayNeutral: "#9CA3AF",   // muted text
        accent: "#6366F1",        // indigo
      },
    },
  },
  plugins: [],
};