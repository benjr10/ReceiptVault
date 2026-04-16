import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#004d61",
          50: "#e6f3f5",
          100: "#cce7eb",
          200: "#99cfd7",
          300: "#66b7c3",
          400: "#339faf",
          500: "#004d61",
          600: "#003d4d",
          700: "#002e39",
          800: "#001f26",
          900: "#000f13",
        },
        secondary: {
          DEFAULT: "#00a86b",
          50: "#e6faf3",
          100: "#ccf5e7",
          200: "#99ebcf",
          300: "#66e1b7",
          400: "#33d79f",
          500: "#00a86b",
          600: "#008656",
          700: "#006540",
          800: "#00432b",
          900: "#002215",
        },
        accent: {
          DEFAULT: "#f4a261",
          50: "#fef6ee",
          100: "#fdeddc",
          200: "#fbdbb9",
          300: "#f9c996",
          400: "#f7b773",
          500: "#f4a261",
          600: "#c3824e",
          700: "#92613b",
          800: "#614128",
          900: "#312014",
        },
        surface: {
          DEFAULT: "#1d1b20",
          50: "#f5f5f5",
          100: "#e8e8e8",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#757575",
          500: "#3a3a3a",
          600: "#2d2b30",
          700: "#1d1b20",
          800: "#151317",
          900: "#0e0c0f",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
