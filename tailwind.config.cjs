// tailwind.config.cjs – design system for Urunana
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2c572e",
        secondary: "#406d3d",
        bgLight: "#fdfbf7",
        bgDark: "#f5f3ed",
        textPrimary: "#1a1a1a",
        textMuted: "#5f5f5f",
        accent: "#eab308",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Noto Sans\"",
          "Inter",
          "sans-serif",
        ],
        heading: ["\"Playfair Display\"", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        lg: "0.75rem",
      },
      spacing: {
        9: "2.25rem",
        14: "3.5rem",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "none",
            a: {
              color: theme("colors.accent"),
              "&:hover": { opacity: 0.8 },
            },
            img: {
              borderRadius: theme("borderRadius.lg"),
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

