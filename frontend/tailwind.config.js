/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      colors: {
        base: {
          950: "#06080C",
          900: "#090D14",
          850: "#0D131D",
          800: "#121A26",
          750: "#182232",
          700: "#1E2A3E",
          600: "#2B3A52",
          500: "#3E506C",
        },
        ember: {
          300: "#FFC875",
          400: "#FFB454",
          500: "#F59B3C",
          600: "#E4572E",
          700: "#C4401E",
          800: "#8E270E",
        },
        risk: {
          low: "#10B981",
          moderate: "#F59E0B",
          high: "#F97316",
          veryhigh: "#EF4444",
          extreme: "#DC2626",
          // Backward compatibility aliases
          safe: "#10B981",
          caution: "#F59E0B",
          danger: "#EF4444",
        },
        cyber: {
          cyan: "#38BDF8",
          emerald: "#34D399",
          violet: "#A78BFA",
        },
        cyan: {
          glow: "#38BDF8",
        },

        // CSS-variable driven semantic mappings
        background: "var(--background)",
        foreground: "var(--foreground)",
        panel: "var(--panel)",
        elevated: "var(--elevated)",
        fill: "var(--fill)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        "cyan-glow": "var(--cyan-glow)",
        safe: "var(--safe)",
        caution: "var(--caution)",
        danger: "var(--danger)",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 8px 32px -8px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(245,155,60,0.3), 0 0 28px -4px rgba(245,155,60,0.4)",
        "glow-cyan": "0 0 0 1px rgba(56,189,248,0.3), 0 0 28px -4px rgba(56,189,248,0.35)",
        "glow-danger": "0 0 0 1px rgba(239,68,68,0.35), 0 0 28px -4px rgba(239,68,68,0.45)",
      },
      backgroundImage: {
        "ember-gradient": "linear-gradient(135deg, #F59B3C 0%, #E4572E 100%)",
        "heat-scan": "linear-gradient(180deg, rgba(245,155,60,0.09) 0%, rgba(6,8,12,0) 65%)",
        "radar-grid": "radial-gradient(ellipse at 50% 0%, rgba(245, 155, 60, 0.12), transparent 70%)",
        "cyber-grid": "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08), transparent 65%)",
      },
      borderRadius: {
        xl2: "0.875rem",
        xl3: "1.125rem",
      },
    },
  },
  plugins: [],
};
