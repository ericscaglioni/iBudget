// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        "on-brand": "rgb(var(--on-brand) / <alpha-value>)",
        income: "rgb(var(--income) / <alpha-value>)",
        expense: "rgb(var(--expense) / <alpha-value>)",
        primary: "rgb(var(--brand) / <alpha-value>)",
        background: "rgb(var(--paper) / <alpha-value>)",
        slateDark: "rgb(var(--ink) / <alpha-value>)",
        grayNeutral: "rgb(var(--muted) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
