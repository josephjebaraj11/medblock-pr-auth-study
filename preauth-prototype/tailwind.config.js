/** Palette lives in CSS variables (src/index.css) so light/dark is one source of truth. */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)", surface: "var(--surface)", sunken: "var(--sunken)", raise: "var(--raise)",
        ink: "var(--ink)", "ink-soft": "var(--ink-soft)", "ink-faint": "var(--ink-faint)",
        rule: "var(--rule)", "rule-soft": "var(--rule-soft)",
        accent: "var(--accent)", "accent-ink": "var(--accent-ink)", "accent-wash": "var(--accent-wash)",
        ok: "var(--ok)", "ok-wash": "var(--ok-wash)",
        warn: "var(--warn)", "warn-wash": "var(--warn-wash)",
        bad: "var(--bad)", "bad-wash": "var(--bad-wash)",
        human: "var(--human)", "human-wash": "var(--human-wash)",
        agent: "var(--agent)", "agent-wash": "var(--agent-wash)",
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: { card: "0 1px 2px rgba(16,21,28,.06), 0 4px 14px rgba(16,21,28,.05)" },
    },
  },
  plugins: [],
};
