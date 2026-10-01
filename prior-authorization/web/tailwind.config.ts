import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

/**
 * Nexauth AI design tokens.
 *
 * Every colour used in the UI is a named token here — no raw hex values live in
 * components. Contrast pairings used for text-on-colour were checked against
 * WCAG 2.1 AA (>= 4.5:1 for body text, >= 3:1 for large text and UI borders).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic tokens — these resolve from the CSS variables in app.css and
        // are what components should reach for. The raw palettes below stay for
        // brand accents that are identical in both themes.
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
        },
        // Deep, calm navy used for dark sections, headings and body text.
        ink: {
          50: "#F5F8FC",
          100: "#E8EFF7",
          200: "#CFDCEB",
          300: "#A9BED6",
          400: "#7793B4",
          500: "#526F93",
          600: "#3B5576",
          700: "#2A405C",
          800: "#1B2C42",
          900: "#111D2E",
          950: "#0A1322",
        },
        // Primary medical blue — trust, clinical credibility.
        brand: {
          50: "#EFF6FF",
          100: "#DCEAFE",
          200: "#BCD8FD",
          300: "#8DBDFA",
          400: "#569AF5",
          500: "#2E79E8",
          600: "#0B63CE", // 5.8:1 on white — safe for white text
          700: "#0A4FA6",
          800: "#0D4285",
          900: "#10386C",
          950: "#0A2347",
        },
        // Secondary aqua — motion, clarity, used in gradients and charts.
        aqua: {
          50: "#EFFCFB",
          100: "#D1F6F3",
          200: "#A6ECE8",
          300: "#6DDCD8",
          400: "#35C3C1",
          500: "#1AA6A6",
          600: "#118585",
          700: "#126A6B",
          800: "#135456",
          900: "#134647",
          950: "#04292B",
        },
        // Accent — the "greenlight". Reserved for approval states and CTAs.
        accent: {
          50: "#E9F8EF",
          100: "#CFF0DD",
          200: "#A2E2BE",
          300: "#6ACF99",
          400: "#34C77A",
          500: "#16A75A",
          600: "#0D7F40", // 5.1:1 on white — safe for white text
          700: "#0A6633",
          800: "#09522A",
          900: "#084324",
          950: "#032713",
        },
        // Soft mint wash for supporting surfaces.
        mint: {
          50: "#F1FAF4",
          100: "#DFF3E7",
          200: "#C2E7D1",
        },
        // Warning/attention only — never used as a primary action colour.
        signal: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#E4761B",
          600: "#B45309",
          700: "#8F4309",
        },
      },
      fontFamily: {
        sans: ["Inter var", "Inter", ...defaultTheme.fontFamily.sans],
        // Reserved for page and section titles — see `.type-display`.
        // Quoted inside the string on purpose: "Source Serif 4" contains a
        // digit, which is not a valid unquoted CSS identifier — without the
        // quotes the browser discards the whole font-family declaration.
        display: [
          '"Source Serif 4"',
          '"Iowan Old Style"',
          ...defaultTheme.fontFamily.serif,
        ],
      },
      // The display sizes are used only by `.type-display` headings, so their
      // tracking is tuned for the serif — a grotesque wants noticeably tighter
      // spacing than a serif does at the same size.
      fontSize: {
        "display-sm": ["2.25rem", { lineHeight: "1.16", letterSpacing: "-0.015em" }],
        "display-md": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.018em" }],
        "display-lg": ["3.75rem", { lineHeight: "1.06", letterSpacing: "-0.02em" }],
      },
      spacing: {
        4.5: "1.125rem",
        13: "3.25rem",
        18: "4.5rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow) / 0.05), 0 8px 24px -12px rgb(var(--shadow) / 0.14)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.05), 0 18px 40px -16px rgb(var(--shadow) / 0.24)",
        glow: "0 0 0 1px rgb(11 99 206 / 0.10), 0 24px 60px -24px rgb(var(--shadow) / 0.45)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(11,99,206,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,99,206,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "44px 44px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "draw-check": {
          from: { strokeDashoffset: "48" },
          to: { strokeDashoffset: "0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        // A bright segment sweeping along the ECG trace, like a monitor refresh.
        "trace-sweep": {
          from: { strokeDashoffset: "0" },
          to: { strokeDashoffset: "-2000" },
        },
        // Dashes marching along the "how it works" rail.
        "rail-flow": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "24px 0" },
        },
        // A packet travelling the length of a mesh link.
        "packet-flow": {
          from: { strokeDashoffset: "164" },
          to: { strokeDashoffset: "-820" },
        },
        "node-breathe": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "node-halo": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "70%": { transform: "scale(1.5)", opacity: "0" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "ring-out": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "15%": { opacity: "0.55" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease both",
        "draw-check": "draw-check 0.9s ease-out 0.2s both",
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        marquee: "marquee 38s linear infinite",
        "trace-sweep": "trace-sweep 7s linear infinite",
        "rail-flow": "rail-flow 1.4s linear infinite",
        "packet-flow": "packet-flow 6.5s linear infinite",
        "node-breathe": "node-breathe 4.5s ease-in-out infinite",
        "node-halo": "node-halo 3.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ring-out": "ring-out 6.4s cubic-bezier(0.22, 1, 0.36, 1) infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
