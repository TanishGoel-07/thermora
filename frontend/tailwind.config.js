/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      colors: {
        base: {
          950: "#080B10",
          900: "#0D1218",
          800: "#121924",
          700: "#1A2330",
          600: "#25303F",
          500: "#3A4759",
        },
        ember: {
          400: "#FFB454",
          500: "#F59B3C",
          600: "#E4572E",
          700: "#C4401E",
        },
        risk: {
          safe: "#3ADB8A",
          caution: "#F2C94C",
          danger: "#F2994A",
          extreme: "#EB5757",
        },
        cyan: {
          glow: "#5EEAD4",
        },
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(245,155,60,0.25), 0 0 24px -4px rgba(245,155,60,0.35)",
      },
      backgroundImage: {
        "ember-gradient": "linear-gradient(135deg, #F59B3C 0%, #E4572E 100%)",
        "heat-scan": "linear-gradient(180deg, rgba(245,155,60,0.08) 0%, rgba(8,11,16,0) 60%)",
      },
      borderRadius: {
        xl2: "0.875rem",
      },
    },
  },
  plugins: [],
};
