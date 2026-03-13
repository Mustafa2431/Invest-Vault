/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0a0f2b",
        "navy-dark": "#050c1a",
        teal: "#0f7666",
        "teal-light": "#14b8a6",
        greenGlow: "#059669",
        "green-glow-light": "#10b981",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "gradient-move": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(16, 185, 129, 0.6)" },
        },
        "float-particle": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-10px) rotate(120deg)" },
          "66%": { transform: "translateY(-20px) rotate(240deg)" },
        },
      },
      animation: {
        "gradient-move": "gradient-move 15s ease infinite",
        glow: "glow 2s ease-in-out infinite",
        "float-particle": "float-particle 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
