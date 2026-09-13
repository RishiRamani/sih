import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--color-base) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        rule: "rgb(var(--color-rule) / <alpha-value>)",

        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-bright": "rgb(var(--color-accent-bright) / <alpha-value>)",
        "accent-soft": "rgb(var(--color-accent-soft) / <alpha-value>)",
        "on-accent": "rgb(var(--color-on-accent) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        "danger-soft": "rgb(var(--color-danger-soft) / <alpha-value>)",
        safe: "rgb(var(--color-safe) / <alpha-value>)",
        "safe-soft": "rgb(var(--color-safe-soft) / <alpha-value>)",

        amber: "rgb(var(--color-amber) / <alpha-value>)",
        "amber-soft": "rgb(var(--color-amber-soft) / <alpha-value>)",
        orange: "rgb(var(--color-orange) / <alpha-value>)",
        "orange-soft": "rgb(var(--color-orange-soft) / <alpha-value>)",

        sidebar: "rgb(var(--color-sidebar) / <alpha-value>)",

        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-dim": "rgb(var(--color-text-dim) / <alpha-value>)",
        "text-inverse": "rgb(var(--color-text-inverse) / <alpha-value>)",
        "text-inverse-dim": "rgb(var(--color-text-inverse-dim) / <alpha-value>)",

        /* legacy aliases so old code keeps compiling */
        secondary: "rgb(var(--color-orange) / <alpha-value>)",
        teal: "rgb(var(--color-safe) / <alpha-value>)",
        highlight: "rgb(var(--color-amber) / <alpha-value>)",
        crimson: "rgb(var(--color-danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-app)", "system-ui", "sans-serif"],
  mono: ["var(--font-app)", "ui-monospace", "monospace"],
  display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
        md: "5px",
        lg: "7px",
      },
      boxShadow: {
        subtle: "0 1px 0 0 rgb(var(--color-border) / 0.6)",
        panel: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        pop: "0 4px 12px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;