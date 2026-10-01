import type { ElementType, ReactNode } from "react";

import { cn } from "~/lib/utils";

type CardProps = {
  as?: ElementType;
  tone?: "light" | "dark";
  /** Adds a lift-on-hover treatment. Use only for cards that are interactive. */
  interactive?: boolean;
  padded?: boolean;
  className?: string;
  children: ReactNode;
};

export function Card({
  as: Tag = "div",
  tone = "light",
  interactive = false,
  padded = true,
  className,
  children,
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-3xl transition-all duration-300 ease-spring",
        tone === "light"
          ? "bg-surface-raised ring-1 ring-line shadow-soft"
          : "bg-white/[0.04] ring-1 ring-white/10 backdrop-blur",
        interactive &&
          (tone === "light"
            ? "hover:-translate-y-1 hover:shadow-lift hover:ring-brand-200"
            : "hover:-translate-y-1 hover:bg-white/[0.08] hover:ring-white/20"),
        padded && "p-6 sm:p-7",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
