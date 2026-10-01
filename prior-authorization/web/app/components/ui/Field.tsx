import { AlertCircle, ChevronDown } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useId } from "react";

import { cn } from "~/lib/utils";

const controlClasses =
  "w-full rounded-xl border-0 bg-surface px-4 py-3 text-content shadow-sm ring-1 ring-inset " +
  "ring-line placeholder:text-content-muted transition focus:ring-2 focus:ring-inset focus:ring-brand-600";

const errorClasses = "ring-signal-600 focus:ring-signal-600";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

function FieldShell({ id, label, hint, error, required, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-content">
        {label}
        {required ? (
          <span className="ml-0.5 text-content-danger" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-normal text-content-muted">(optional)</span>
        )}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-content-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-xs font-medium text-content-danger"
        >
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type TextFieldProps = Omit<ComponentPropsWithoutRef<"input">, "id" | "className"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, required, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClasses, error && errorClasses)}
        {...rest}
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<
  ComponentPropsWithoutRef<"textarea">,
  "id" | "className"
> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({
  label,
  hint,
  error,
  required,
  rows = 5,
  ...rest
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlClasses, "resize-y", error && errorClasses)}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectFieldProps = Omit<ComponentPropsWithoutRef<"select">, "id" | "className"> & {
  label: string;
  hint?: string;
  error?: string;
  options: readonly string[];
  placeholder?: string;
};

export function SelectField({
  label,
  hint,
  error,
  required,
  options,
  placeholder = "Choose one…",
  ...rest
}: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(controlClasses, "appearance-none pr-11", error && errorClasses)}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
        />
      </div>
    </FieldShell>
  );
}
