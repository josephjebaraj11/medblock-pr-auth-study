import type { ReactNode } from "react";

import { Container } from "~/components/ui/Container";
import { cn } from "~/lib/utils";

type SectionProps = {
  id?: string;
  /** Surface treatment; `dark` also flips focus rings via the `on-dark` class. */
  tone?: "white" | "tint" | "mint" | "dark";
  spacing?: Spacing;
  /**
   * Overrides only the top padding. Use `tight` on the first section of a page
   * so the content sits closer under the sticky header.
   */
  spacingTop?: Spacing;
  containerSize?: "narrow" | "default" | "wide";
  /** Set to false to lay out a full-bleed section and supply your own container. */
  contained?: boolean;
  className?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
};

const tones = {
  white: "bg-surface",
  tint: "bg-surface-subtle",
  mint: "bg-surface-mint",
  // `on-dark` re-bases the focus ring against this panel rather than the page.
  dark: "on-dark bg-surface-inverse text-ink-200",
} as const;

type Spacing = "tight" | "compact" | "default" | "loose";

/**
 * Top and bottom padding are emitted as separate utilities rather than `py-*`,
 * so `spacingTop` overrides the top without relying on utility ordering in the
 * generated stylesheet to win the tie.
 */
const spacings: Record<Spacing, { top: string; bottom: string }> = {
  tight: { top: "pt-10 sm:pt-14", bottom: "pb-10 sm:pb-14" },
  compact: { top: "pt-14 sm:pt-16", bottom: "pb-14 sm:pb-16" },
  default: { top: "pt-20 sm:pt-24", bottom: "pb-20 sm:pb-24" },
  loose: { top: "pt-24 sm:pt-32", bottom: "pb-24 sm:pb-32" },
};

export function Section({
  id,
  tone = "white",
  spacing = "default",
  spacingTop,
  containerSize = "default",
  contained = true,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative",
        tones[tone],
        spacings[spacingTop ?? spacing].top,
        spacings[spacing].bottom,
        className,
      )}
      {...rest}
    >
      {contained ? <Container size={containerSize}>{children}</Container> : children}
    </section>
  );
}
