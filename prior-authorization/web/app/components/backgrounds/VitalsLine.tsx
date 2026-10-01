import { cn } from "~/lib/utils";

/**
 * One ECG beat, drawn relative to the baseline: flat run, P wave, the QRS
 * spike, then the T wave. Repeating it gives a continuous cardiac trace.
 */
const BEAT = "h70 q10 -8 20 0 h10 l6 6 l8 -40 l8 44 l6 -10 h12 q14 -12 28 0 h32";
const BEATS = 8;
const TRACE = `M0 70 ${Array.from({ length: BEATS }, () => BEAT).join(" ")}`;

type VitalsLineProps = {
  className?: string;
};

/**
 * A patient monitor trace: a faint continuous waveform with a brighter pulse
 * sweeping along it, the way a bedside monitor refreshes. Purely decorative,
 * and the sweep is suppressed under `prefers-reduced-motion` (the waveform
 * itself stays, so the section never looks empty).
 */
export function VitalsLine({ className }: VitalsLineProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${BEATS * 200} 140`}
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute w-full", className)}
    >
      <path
        d={TRACE}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-20"
      />
      <path
        d={TRACE}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-trace-sweep opacity-70 [stroke-dasharray:200_1800]"
      />
    </svg>
  );
}
