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
        background: "var(--background)",
        foreground: "var(--foreground)",
        midnight: {
          950: "#05020c",
          900: "#090514",
          800: "#120926",
          700: "#1a0f35",
          600: "#26154b",
        },
        brand: {
          purple: "#9333ea",
          violet: "#7c3aed",
          pink: "#ff2e93",
          hotpink: "#f43f5e",
          cyan: "#00f2fe",
          sky: "#38bdf8",
          amber: "#f59e0b",
          emerald: "#10b981",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "cyber-grid":
          "linear-gradient(to right, rgba(168, 85, 247, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(168, 85, 247, 0.08) 1px, transparent 1px)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s infinite ease-in-out",
        "float-up": "floatUp 1.8s ease-out forwards",
        "shimmer": "shimmer 2.2s infinite linear",
        "badge-pulse": "badgePulse 1.5s infinite ease-in-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        floatUp: {
          "0%": { transform: "translateY(0) scale(0.8)", opacity: "1" },
          "50%": { transform: "translateY(-40px) scale(1.2)", opacity: "0.9" },
          "100%": { transform: "translateY(-90px) scale(0.6)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        badgePulse: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(255, 46, 147, 0.7)" },
          "70%": { transform: "scale(1.04)", boxShadow: "0 0 0 10px rgba(255, 46, 147, 0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
