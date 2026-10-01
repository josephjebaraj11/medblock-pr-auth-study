import type { ReactNode } from "react";

import { Badge } from "~/components/ui/Badge";
import { cn } from "~/lib/utils";

type SectionHeadingProps = {
  /** Used as the section's `aria-labelledby` target. */
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  level?: "h1" | "h2" | "h3";
  className?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  level: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <Badge tone={tone === "dark" ? "inverse" : "brand"}>{eyebrow}</Badge>
      ) : null}
      <Heading
        id={id}
        className={cn(
          "type-display text-display-sm sm:text-display-md",
          tone === "dark" && "text-white",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "max-w-2xl text-lg leading-relaxed",
            tone === "dark" ? "text-ink-300" : "text-content-secondary",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
