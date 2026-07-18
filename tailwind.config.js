/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: { DEFAULT: "#2563EB", dark: "#1D4ED8" },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        surface: "#FFFFFF",
        canvas: "#F8FAFC",
        dark: "#0F172A",
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
        dialog: "24px",
        input: "12px",
      },
    },
  },
  plugins: [],
};
