export const THEMES = ["light", "dark", "system"] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "nexauth-theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * The theme a visitor gets before they have expressed any preference. Light is
 * the brand's default presentation, so the OS setting is deliberately NOT
 * consulted until someone explicitly opts into `system`.
 */
export const DEFAULT_THEME: Theme = "light";

/** Reads the stored preference, falling back to the default. */
export function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    // Storage can throw in private mode or when site data is blocked.
    return DEFAULT_THEME;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    // Every choice is written out, `system` included: an absent value now
    // means "has not chosen" and resolves to the light default, so `system`
    // has to be recorded explicitly to survive a reload.
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // A failed write only costs persistence, not the current page.
  }
}

/** Resolves `system` against the OS preference. */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies the resolved theme to the document and the browser UI colour. */
export function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#0A1322" : "#FFFFFF");
}

/* ---------------------------------------------------------------------------
 * Shared store
 *
 * The toggle is rendered more than once (header and mobile menu). Per-component
 * `useState` let those instances drift apart, so the selection lives in one
 * module-level store that every instance subscribes to via
 * `useSyncExternalStore`.
 * ------------------------------------------------------------------------- */

type Listener = () => void;

/** `null` until the client has read storage — the server cannot know it. */
let current: Theme | null = null;
const listeners = new Set<Listener>();
let mediaBound = false;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeSnapshot(): Theme | null {
  return current;
}

/** The server renders with nothing selected, which is what the client's first
 *  render also produces — so hydration matches. */
export function getServerThemeSnapshot(): Theme | null {
  return null;
}

/** Idempotent: safe to call from every mounted toggle. */
export function initTheme(): void {
  if (!mediaBound) {
    mediaBound = true;
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        // Only re-resolve while actually following the system.
        if (current === "system") applyTheme("system");
      });
  }
  if (current === null) {
    current = readStoredTheme();
    emit();
  }
}

export function setTheme(next: Theme): void {
  current = next;
  storeTheme(next);
  applyTheme(next);
  emit();
}

/**
 * Runs before first paint, inlined into the document head, so the correct
 * theme is on `<html>` before anything renders. Without this the page paints
 * light and then snaps to dark on hydration.
 *
 * It only touches `documentElement`, never server-rendered markup, so it
 * cannot cause a hydration mismatch.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var s=localStorage.getItem('${THEME_STORAGE_KEY}');
var d=s==='dark'||(s==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
var r=document.documentElement;
r.classList.toggle('dark',d);
r.style.colorScheme=d?'dark':'light';
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute('content',d?'#0A1322':'#FFFFFF');
}catch(e){}})();`;
