import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type BadgeProps = {
  tone?: "brand" | "accent" | "aqua" | "inverse";
  className?: string;
  children: ReactNode;
};

const tones = {
  brand: "bg-tint-brand text-tint-brand-on ring-tint-brand-on/25",
  accent: "bg-tint-accent text-tint-accent-on ring-tint-accent-on/25",
  aqua: "bg-tint-aqua text-tint-aqua-on ring-tint-aqua-on/25",
  inverse: "bg-white/10 text-white ring-white/20",
} as const;

export function Badge({ tone = "brand", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
