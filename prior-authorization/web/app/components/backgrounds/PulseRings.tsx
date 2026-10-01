import { cn } from "~/lib/utils";

type PulseRingsProps = {
  className?: string;
  /** Number of concentric rings; each is delayed to form a steady cadence. */
  count?: number;
};

/**
 * Concentric rings expanding outwards on a slow, regular beat — an approval
 * propagating, and a visual echo of the pulse in the hero. Decorative only.
 */
export function PulseRings({ className, count = 4 }: PulseRingsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          style={{ animationDelay: `${index * 1.6}s` }}
          className="absolute inset-0 animate-ring-out rounded-full border border-white/40"
        />
      ))}
    </div>
  );
}
