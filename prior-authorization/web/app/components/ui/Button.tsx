import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "~/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-all duration-200 ease-spring disabled:pointer-events-none " +
  "disabled:opacity-60 active:translate-y-px";

const variants: Record<ButtonVariant, string> = {
  // Accent green = "greenlight". Reserved for the primary action on a screen.
  primary:
    "bg-accent-600 text-white shadow-soft hover:bg-accent-700 hover:shadow-lift",
  secondary:
    "bg-surface-raised text-content ring-1 ring-inset ring-line shadow-soft hover:ring-brand-300 hover:text-content-brand",
  ghost: "text-content-brand hover:bg-brand-50",
  inverse:
    "bg-white/10 text-white ring-1 ring-inset ring-white/25 backdrop-blur hover:bg-white/20",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base py-3.5",
};

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = SharedProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof SharedProps> & {
    to?: never;
    href?: never;
  };

type ButtonAsLink = SharedProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof SharedProps | "href"> & {
    /** Internal route — rendered with React Router's `Link`. */
    to: string;
    href?: never;
  };

type ButtonAsAnchor = SharedProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof SharedProps | "href"> & {
    /** External or hash target — rendered as a plain anchor. */
    href: string;
    to?: never;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("to" in props && props.to !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, to, ...rest } = props;
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if ("href" in props && props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, href, ...rest } = props;
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, type, ...rest } =
    props as ButtonAsButton;
  return (
    <button type={type ?? "button"} className={classes} {...rest}>
      {children}
    </button>
  );
}
