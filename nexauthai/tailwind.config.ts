import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * NexAuthAI design tokens.
 *
 * Carried over from the existing Nexauth AI marketing site
 * (prior-authorization/web/tailwind.config.ts) so the product and the site
 * share one palette. Components reach for the semantic tokens; the raw
 * palettes below exist for brand accents that are identical in both themes.
 *
 * Contrast pairings for text-on-colour were checked against WCAG 2.1 AA
 * (>= 4.5:1 body text, >= 3:1 large text and UI borders).
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          subtle: "rgb(var(--surface-subtle) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          inset: "rgb(var(--surface-inset) / <alpha-value>)",
          mint: "rgb(var(--surface-mint) / <alpha-value>)",
          inverse: "rgb(var(--surface-inverse) / <alpha-value>)",
        },
        content: {
          DEFAULT: "rgb(var(--content) / <alpha-value>)",
          secondary: "rgb(var(--content-secondary) / <alpha-value>)",
          muted: "rgb(var(--content-muted) / <alpha-value>)",
          brand: "rgb(var(--content-brand) / <alpha-value>)",
          danger: "rgb(var(--content-danger) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          subtle: "rgb(var(--line-subtle) / <alpha-value>)",
        },
        tint: {
          brand: "rgb(var(--tint-brand) / <alpha-value>)",
          "brand-on": "rgb(var(--tint-brand-on) / <alpha-value>)",
          accent: "rgb(var(--tint-accent) / <alpha-value>)",
          "accent-on": "rgb(var(--tint-accent-on) / <alpha-value>)",
          aqua: "rgb(var(--tint-aqua) / <alpha-value>)",
          "aqua-on": "rgb(var(--tint-aqua-on) / <alpha-value>)",
          signal: "rgb(var(--tint-signal) / <alpha-value>)",
          "signal-on": "rgb(var(--tint-signal-on) / <alpha-value>)",
          danger: "rgb(var(--tint-danger) / <alpha-value>)",
          "danger-on": "rgb(var(--tint-danger-on) / <alpha-value>)",
        },
        ink: {
          50: "#F5F8FC", 100: "#E8EFF7", 200: "#CFDCEB", 300: "#A9BED6",
          400: "#7793B4", 500: "#526F93", 600: "#3B5576", 700: "#2A405C",
          800: "#1B2C42", 900: "#111D2E", 950: "#0A1322",
        },
        brand: {
          50: "#EFF6FF", 100: "#DCEAFE", 200: "#BCD8FD", 300: "#8DBDFA",
          400: "#569AF5", 500: "#2E79E8", 600: "#0B63CE", 700: "#0A4FA6",
          800: "#0D4285", 900: "#10386C", 950: "#0A2347",
        },
        aqua: {
          50: "#EFFCFB", 100: "#D1F6F3", 200: "#A6ECE8", 300: "#6DDCD8",
          400: "#35C3C1", 500: "#1AA6A6", 600: "#118585", 700: "#126A6B",
          800: "#135456", 900: "#134647", 950: "#04292B",
        },
        accent: {
          50: "#E9F8EF", 100: "#CFF0DD", 200: "#A2E2BE", 300: "#6ACF99",
          400: "#34C77A", 500: "#16A75A", 600: "#0D7F40", 700: "#0A6633",
          800: "#09522A", 900: "#084324", 950: "#032713",
        },
        mint: { 50: "#F1FAF4", 100: "#DFF3E7", 200: "#C2E7D1" },
        signal: {
          50: "#FFF7ED", 100: "#FFEDD5", 500: "#E4761B", 600: "#B45309", 700: "#8F4309",
        },
        danger: {
          50: "#FEF2F2", 100: "#FEE2E2", 500: "#DC2626", 600: "#B91C1C", 700: "#991B1B",
        },
      },
      fontFamily: {
        sans: ["Inter var", "Inter", ...defaultTheme.fontFamily.sans],
        display: ['"Source Serif 4"', '"Iowan Old Style"', ...defaultTheme.fontFamily.serif],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        "display-sm": ["2.25rem", { lineHeight: "1.16", letterSpacing: "-0.015em" }],
        "display-md": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.018em" }],
      },
      spacing: { 4.5: "1.125rem", 13: "3.25rem", 18: "4.5rem" },
      borderRadius: { "4xl": "2rem" },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow) / 0.05), 0 8px 24px -12px rgb(var(--shadow) / 0.14)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.05), 0 18px 40px -16px rgb(var(--shadow) / 0.24)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.3s ease both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
