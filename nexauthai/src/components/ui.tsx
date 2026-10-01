/**
 * Shared UI primitives.
 *
 * Everything reaches for the semantic tokens (`surface`, `content`, `line`,
 * `tint`) rather than raw palette steps, so light and dark are one variable
 * swap rather than a `dark:` variant on every utility.
 */

import clsx from "clsx";
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useId,
} from "react";
import { Link } from "react-router-dom";
import type { Tone } from "@/lib/format";

/* ------------------------------------------------------------------ *
 * Badge
 * ------------------------------------------------------------------ */

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-surface-inset text-content-secondary ring-line",
  brand: "bg-tint-brand text-tint-brand-on ring-brand-200 dark:ring-brand-800",
  accent: "bg-tint-accent text-tint-accent-on ring-accent-200 dark:ring-accent-800",
  aqua: "bg-tint-aqua text-tint-aqua-on ring-aqua-200 dark:ring-aqua-800",
  signal: "bg-tint-signal text-tint-signal-on ring-signal-100 dark:ring-signal-700",
  danger: "bg-tint-danger text-tint-danger-on ring-danger-100 dark:ring-danger-700",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1",
        "text-xs font-semibold ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/40 disabled:text-white/70",
  secondary:
    "bg-surface-raised text-content ring-1 ring-inset ring-line hover:bg-surface-inset disabled:opacity-50",
  ghost: "text-content-secondary hover:bg-surface-inset hover:text-content disabled:opacity-50",
  danger: "bg-danger-600 text-white hover:bg-danger-700 disabled:opacity-50",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        "disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        BUTTON_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Card / Panel
 * ------------------------------------------------------------------ */

export function Card({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-line bg-surface-raised shadow-soft",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-subtle px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <span className="mt-0.5 shrink-0 text-content-muted">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-content">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-content-muted">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("px-4 py-4 sm:px-5", className)}>{children}</div>;
}

/* ------------------------------------------------------------------ *
 * Page scaffolding
 * ------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-content-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="type-display text-2xl font-semibold text-content sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-content-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Stat tile
 * ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  to?: string;
}) {
  const body = (
    <>
      <dt className="text-xs font-medium text-content-muted">{label}</dt>
      <dd
        className={clsx(
          "mt-1.5 text-2xl font-semibold tabular-nums",
          tone === "danger"
            ? "text-content-danger"
            : tone === "accent"
              ? "text-tint-accent-on"
              : tone === "signal"
                ? "text-tint-signal-on"
                : "text-content",
        )}
      >
        {value}
      </dd>
      {hint && <p className="mt-1 text-xs leading-snug text-content-muted">{hint}</p>}
    </>
  );

  const className = clsx(
    "block rounded-xl border border-line bg-surface-raised px-4 py-3.5 shadow-soft",
    to && "transition-colors hover:border-brand-300 hover:bg-tint-brand",
  );

  return to ? (
    <Link to={to} className={className}>
      <dl>{body}</dl>
    </Link>
  ) : (
    <dl className={className}>{body}</dl>
  );
}

/* ------------------------------------------------------------------ *
 * Table
 * ------------------------------------------------------------------ */

export function TableWrap({ children }: { children: ReactNode }) {
  // Wide tables scroll inside their own container; the page never scrolls sideways.
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  scope = "col",
}: {
  children: ReactNode;
  className?: string;
  scope?: "col" | "row";
}) {
  return (
    <th
      scope={scope}
      className={clsx(
        "border-b border-line px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-content-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={clsx("border-b border-line-subtle px-3 py-3 align-middle", className)}>
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------ *
 * Field
 * ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  children,
  required,
  error,
}: {
  label: string;
  hint?: string;
  children: (props: { id: string; "aria-describedby"?: string }) => ReactNode;
  required?: boolean;
  error?: string;
}) {
  const id = useId();
  const hintId = hint || error ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-content-secondary">
        {label}
        {required && (
          <span className="ml-1 text-content-danger" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{children({ id, "aria-describedby": hintId })}</div>
      {(hint || error) && (
        <p
          id={hintId}
          className={clsx("mt-1 text-xs", error ? "text-content-danger" : "text-content-muted")}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content " +
  "placeholder:text-content-muted focus:border-brand-500 focus:outline-none";

/* ------------------------------------------------------------------ *
 * States
 * ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-surface-inset",
        className ?? "h-4 w-full",
      )}
      aria-hidden
    />
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-2.5 p-4" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 text-content-muted">{icon}</div>}
      <p className="text-sm font-semibold text-content">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-content-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Notes and callouts
 * ------------------------------------------------------------------ */

export function Callout({
  tone = "brand",
  title,
  children,
  icon,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg px-4 py-3 text-sm ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      <div className="flex gap-2.5">
        {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
        <div className="min-w-0">
          {title && <p className="font-semibold">{title}</p>}
          <div className={clsx("leading-relaxed", title && "mt-1")}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Marks content that the source folder did not specify. */
export function AssumptionNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex gap-2 text-xs leading-relaxed text-content-muted">
      <span className="shrink-0 rounded bg-surface-inset px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide">
        Assumption
      </span>
      <span>{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * Confidence meter
 * ------------------------------------------------------------------ */

export function ConfidenceBar({
  value,
  threshold,
  className,
}: {
  value: number;
  threshold?: number;
  className?: string;
}) {
  const pct = Math.round(value * 100);
  const tone = threshold !== undefined && value < threshold ? "signal" : "accent";

  return (
    <div className={className}>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-surface-inset"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence ${pct} percent`}
      >
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            tone === "accent" ? "bg-accent-600" : "bg-signal-500",
          )}
          style={{ width: `${pct}%` }}
        />
        {threshold !== undefined && (
          <div
            className="absolute inset-y-0 w-0.5 bg-content"
            style={{ left: `${Math.round(threshold * 100)}%` }}
            aria-hidden
            title={`Auto-submit threshold ${threshold}`}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tabs
 * ------------------------------------------------------------------ */

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="overflow-x-auto border-b border-line">
      <div className="flex gap-1" role="tablist" aria-label={label}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => onChange(t.id)}
            className={clsx(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active === t.id
                ? "border-brand-600 text-content-brand"
                : "border-transparent text-content-muted hover:border-line hover:text-content",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-surface-inset px-1.5 py-0.5 text-xs tabular-nums">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
