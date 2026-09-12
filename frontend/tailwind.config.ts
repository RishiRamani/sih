// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--color-base) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        teal: "rgb(var(--color-teal) / <alpha-value>)",
        highlight: "rgb(var(--color-highlight) / <alpha-value>)",
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        amber: "rgb(var(--color-amber) / <alpha-value>)",
        crimson: "rgb(var(--color-crimson) / <alpha-value>)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      borderRadius: {
        DEFAULT: "3px",     // tighter — instrument feel, not pill
        md: "4px",
        lg: "6px"
      },
      boxShadow: {
        subtle: "0 1px 0 0 rgb(var(--color-border) / 0.5)",
        panel: "0 1px 2px 0 rgb(0 0 0 / 0.25)"
      }
    }
  },
  plugins: []
};

export default config;