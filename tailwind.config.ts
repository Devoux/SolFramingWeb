import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f2f8ff",
          100: "#e6f1ff",
          200: "#bfdcff",
          300: "#99c6ff",
          400: "#4d9bff",
          500: "#006fff",
          600: "#0064e6",
          700: "#0053bf",
          800: "#004299",
          900: "#00367d"
        }
      }
    }
  },
  plugins: []
};

export default config;
