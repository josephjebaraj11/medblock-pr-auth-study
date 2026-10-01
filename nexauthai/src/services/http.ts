/**
 * The seam where a real API would go.
 *
 * Every service function below returns a promise and takes a simulated
 * round trip, so the UI is built against latency from day one rather than
 * discovering it at integration time. Swapping these for `fetch` against a
 * real `/v1` endpoint should not require touching a single component.
 */

/** Tunable so a demo can be sped up without editing call sites. */
export const LATENCY_SCALE = 1;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Resolve after a realistic round trip. */
export async function simulate<T>(value: T | (() => T), minMs = 180, maxMs = 480): Promise<T> {
  await new Promise((r) => setTimeout(r, rand(minMs, maxMs) * LATENCY_SCALE));
  return typeof value === "function" ? (value as () => T)() : value;
}

/** A failure that looks like an API error rather than a thrown string. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function simulateFailure(message: string, status = 409, code = "conflict"): Promise<never> {
  await new Promise((r) => setTimeout(r, rand(140, 320) * LATENCY_SCALE));
  throw new ApiError(message, status, code);
}

/** Deep clone on the way out, so callers cannot mutate the store by accident. */
export function snapshot<T>(value: T): T {
  return structuredClone(value);
}
