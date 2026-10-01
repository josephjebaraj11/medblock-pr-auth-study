import { useId } from "react";

import { cn } from "~/lib/utils";

type LogoProps = {
  /** `full` renders mark + wordmark; `icon` renders the mark alone. */
  variant?: "full" | "icon";
  /** Wordmark colour follows `currentColor`, so it inverts on dark surfaces. */
  className?: string;
  /**
   * Accessible name. Pass `null` when the logo sits inside a link that already
   * has its own label, so screen readers don't hear it twice.
   */
  title?: string | null;
};

/**
 * The Nexauth AI mark: an N monogram set in a hexagonal node — the nexus.
 *
 * The hexagon reads as a hub and carries the "nex-" in the name; the N's
 * right stem finishes above its left, so the letterform lifts. The hexagon's
 * corners are rounded by stroking the same gradient with a round line join,
 * which keeps the silhouette clean down to 16px.
 */
export function Logo({ variant = "full", className, title = "Nexauth AI" }: LogoProps) {
  const id = useId();
  const gradientId = `nexauth-gradient-${id}`;
  const labelId = `nexauth-label-${id}`;

  const mark = (
    <svg
      viewBox="0 0 32 32"
      className="h-8 w-8 shrink-0"
      role={title === null ? "presentation" : "img"}
      aria-labelledby={title === null ? undefined : labelId}
      aria-hidden={title === null ? true : undefined}
      focusable="false"
    >
      {title !== null ? <title id={labelId}>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B63CE" />
          <stop offset="55%" stopColor="#1188C4" />
          <stop offset="100%" stopColor="#1AA6A6" />
        </linearGradient>
      </defs>

      {/* The nexus: a hexagon, corners rounded via a round-joined stroke. */}
      <path
        d="M16 2.5 L27.7 9.25 L27.7 22.75 L16 29.5 L4.3 22.75 L4.3 9.25 Z"
        fill={`url(#${gradientId})`}
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/*
        An N monogram drawn as one continuous stroke: up the left stem, down
        the diagonal, then up the right stem — which finishes higher than the
        left, so the letterform lifts rather than sitting flat.

        Earlier passes used a node-and-link glyph; at size a stroke running
        into a round terminal reads as a bone, and an open ring on a diagonal
        reads as a magnifying glass. A letterform carries the name and cannot
        be mistaken for either.
      */}
      <path
        d="M11 22.6 L11 10.6 L21 22.6 L21 9"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

    </svg>
  );

  if (variant === "icon") {
    return <span className={cn("inline-flex", className)}>{mark}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {mark}
      <span className="text-[1.35rem] font-semibold leading-none tracking-[-0.02em] text-current">
        Nexauth
        <span className="ml-1.5 font-medium opacity-60">AI</span>
      </span>
    </span>
  );
}
