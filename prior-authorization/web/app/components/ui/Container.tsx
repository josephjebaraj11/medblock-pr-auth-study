import type { ElementType, ReactNode } from "react";

import { cn } from "~/lib/utils";

type ContainerProps = {
  as?: ElementType;
  size?: "narrow" | "default" | "wide";
  className?: string;
  children: ReactNode;
};

const sizes = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

export function Container({
  as: Tag = "div",
  size = "default",
  className,
  children,
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-5 sm:px-8", sizes[size], className)}>
      {children}
    </Tag>
  );
}
