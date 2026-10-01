import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  initTheme,
  setTheme,
  subscribeTheme,
  type Theme,
} from "~/lib/theme";
import { cn } from "~/lib/utils";

const OPTIONS: ReadonlyArray<{ value: Theme; label: string; Icon: typeof Sun }> = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

type ThemeToggleProps = {
  className?: string;
};

/**
 * Three-way theme control, rendered as a radio group: the options are mutually
 * exclusive and a visitor should be able to pick one directly rather than
 * cycling through the others to reach it.
 *
 * State comes from a shared store rather than local `useState`, because this
 * control is mounted twice (header and mobile menu) and the two copies must
 * agree. The server snapshot is `null`, so nothing is selected on the server or
 * on the first client render — which keeps hydration stable — and the real
 * selection arrives in an effect.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-surface-inset p-1 ring-1 ring-inset ring-line",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              selected
                ? "bg-surface-raised text-content shadow-soft ring-1 ring-inset ring-line"
                : "text-content-muted hover:text-content",
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
