/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Inter'",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          900: "#111111",
          700: "#3a3a3a",
          500: "#6b6b6b",
          300: "#a8a8a8",
          100: "#ececec",
          50: "#f6f6f6",
        },
        overdue: "#dc2626",
        today: "#16a34a",
        future: "#6b7280",
      },
    },
  },
  plugins: [],
};
