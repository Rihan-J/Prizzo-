/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea6c0e",
          700: "#c2550b",
          800: "#9a440d",
          900: "#7c3a0e",
        },
        surface: "#ffffff",
        "surface-2": "#fafafa",
        "surface-3": "#f5f5f5",
        text: {
          primary: "#111827",
          secondary: "#6b7280",
          muted: "#9ca3af",
        },
        success: "#22c55e",
        danger: "#ef4444",
        info: "#3b82f6",
        warning: "#f59e0b",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.06)",
        float: "0 8px 32px rgba(0, 0, 0, 0.12)",
        orange: "0 4px 20px rgba(249, 115, 22, 0.3)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
}