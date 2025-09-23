/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
       "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "node_modules/flowbite-react/**/*.js",
    "node_modules/flowbite/**/*.js",
    "node_modules/@heroui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        acecoreBackground: "#0C0817",
      },
    fontFamily: {
    barlow: ["var(--font-barlow-condensed)", "sans-serif"],
  },
    },
  },
  plugins: [],
});
