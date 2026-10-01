import { cn } from "~/lib/utils";

type Point = { x: number; y: number };

/** Left column: clinical documents leaving the practice. */
const SOURCES: readonly Point[] = [
  { x: 130, y: 150 },
  { x: 130, y: 350 },
  { x: 130, y: 550 },
];

/** Middle: where the request is assembled and checked against policy. */
const HUBS: readonly Point[] = [
  { x: 600, y: 250 },
  { x: 600, y: 450 },
];

/** Right column: payer endpoints returning a determination. */
const DESTINATIONS: readonly Point[] = [
  { x: 1070, y: 180 },
  { x: 1070, y: 350 },
  { x: 1070, y: 520 },
];

/** A horizontal-tangent bezier, so links leave and arrive flat. */
function link(from: Point, to: Point): string {
  const midX = (from.x + to.x) / 2;
  return `M${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}

const LINKS: readonly string[] = [
  ...SOURCES.flatMap((source) => HUBS.map((hub) => link(source, hub))),
  ...HUBS.flatMap((hub) => DESTINATIONS.map((destination) => link(hub, destination))),
];

type AuthFlowMeshProps = {
  className?: string;
};

/**
 * The prior authorization journey as an abstract mesh: documents leave the
 * practice on the left, are assembled in the middle, and reach payer endpoints
 * on the right, with packets flowing along every link.
 *
 * Strokes stay at low alpha so body text layered above keeps its contrast, and
 * the flow animation is suppressed under `prefers-reduced-motion`.
 */
export function AuthFlowMesh({ className }: AuthFlowMeshProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <g stroke="currentColor" fill="none">
        {LINKS.map((path, index) => (
          <g key={path}>
            <path d={path} strokeWidth="1" className="opacity-[0.08]" />
            {/* The packet: a short dash travelling the length of the link. */}
            <path
              d={path}
              strokeWidth="1.75"
              strokeLinecap="round"
              style={{ animationDelay: `${(index % 6) * 1.1}s` }}
              className="animate-packet-flow opacity-[0.32] [stroke-dasharray:14_150]"
            />
          </g>
        ))}
      </g>

      {/* Documents leaving the practice. */}
      {SOURCES.map((point, index) => (
        <g
          key={`source-${point.y}`}
          style={{ animationDelay: `${index * 0.9}s` }}
          className="animate-node-breathe"
        >
          <rect
            x={point.x - 17}
            y={point.y - 22}
            width="34"
            height="44"
            rx="5"
            fill="currentColor"
            className="opacity-[0.07]"
          />
          <rect
            x={point.x - 17}
            y={point.y - 22}
            width="34"
            height="44"
            rx="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            className="opacity-30"
          />
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-25">
            <line x1={point.x - 9} y1={point.y - 9} x2={point.x + 9} y2={point.y - 9} />
            <line x1={point.x - 9} y1={point.y - 1} x2={point.x + 9} y2={point.y - 1} />
            <line x1={point.x - 9} y1={point.y + 7} x2={point.x + 2} y2={point.y + 7} />
          </g>
        </g>
      ))}

      {/* Assembly hubs. */}
      {HUBS.map((point, index) => (
        <g key={`hub-${point.y}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            className="opacity-25"
          />
          <circle
            cx={point.x}
            cy={point.y}
            r="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            style={{ animationDelay: `${index * 1.4}s` }}
            className="origin-shape animate-node-halo opacity-40"
          />
          <circle cx={point.x} cy={point.y} r="6" fill="currentColor" className="opacity-40" />
        </g>
      ))}

      {/* Determinations returning approved. */}
      {DESTINATIONS.map((point, index) => (
        <g
          key={`destination-${point.y}`}
          style={{ animationDelay: `${index * 1.2 + 0.5}s` }}
          className="animate-node-breathe"
        >
          <circle
            cx={point.x}
            cy={point.y}
            r="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            className="opacity-30"
          />
          <path
            d={`M${point.x - 9} ${point.y} l6 6 l12 -13`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          />
        </g>
      ))}
    </svg>
  );
}
