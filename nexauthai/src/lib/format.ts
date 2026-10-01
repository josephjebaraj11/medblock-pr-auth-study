import { NOW } from "@/mocks";
import type { Channel, PaStatus } from "@/types";

export function fullDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeOnly(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Relative to the prototype's fixed clock, so the demo reads consistently. */
export function relative(iso?: string): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - NOW.getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  let value: string;
  if (mins < 60) value = `${mins}m`;
  else if (hours < 24) value = `${hours}h`;
  else if (days < 30) value = `${days}d`;
  else value = `${Math.round(days / 30)}mo`;

  return diff < 0 ? `${value} ago` : `in ${value}`;
}

export function durationHours(hours: number | null): string {
  if (hours === null) return "—";
  const abs = Math.abs(hours);
  if (abs < 1) return `${Math.round(abs * 60)} min`;
  if (abs < 48) return `${Math.round(abs)} h`;
  return `${Math.round(abs / 24)} d`;
}

export function age(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  let years = NOW.getFullYear() - dob.getFullYear();
  const m = NOW.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && NOW.getDate() < dob.getDate())) years -= 1;
  return years;
}

export function percent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function latency(ms: number): string {
  if (ms >= 60_000) return `${Math.round(ms / 60_000)} min`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

export const STATUS_LABEL: Record<PaStatus, string> = {
  draft: "Draft",
  "eligibility-check": "Checking eligibility",
  "requirement-check": "Checking requirement",
  "no-auth-required": "No authorization required",
  documentation: "Gathering documentation",
  "clinical-review": "Clinical review required",
  "needs-approval": "Waiting for release",
  submitting: "Submitting",
  submitted: "Submitted",
  "in-review": "In review",
  pended: "Pended — information requested",
  approved: "Approved",
  "partially-approved": "Partially approved",
  denied: "Denied",
  appealed: "Appealed",
  "peer-to-peer": "Peer-to-peer",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

export type Tone = "neutral" | "brand" | "accent" | "signal" | "danger" | "aqua";

export const STATUS_TONE: Record<PaStatus, Tone> = {
  draft: "neutral",
  "eligibility-check": "neutral",
  "requirement-check": "neutral",
  "no-auth-required": "aqua",
  documentation: "brand",
  "clinical-review": "signal",
  "needs-approval": "signal",
  submitting: "brand",
  submitted: "brand",
  "in-review": "brand",
  pended: "signal",
  approved: "accent",
  "partially-approved": "aqua",
  denied: "danger",
  appealed: "signal",
  "peer-to-peer": "signal",
  withdrawn: "neutral",
  expired: "neutral",
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  electronic: "Electronic",
  portal: "Payer portal",
  voice: "Phone call",
  fax: "Fax",
  human: "Staff",
};

/** Initials from a display name, for avatar chips. */
export function initials(name: string): string {
  return name
    .replace(/^Dr\.\s+/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
