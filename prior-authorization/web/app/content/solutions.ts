import type { IconName } from "~/content/icons";

export type Capability = {
  id: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  body: string;
  bullets: readonly string[];
};

export type Audience = {
  icon: IconName;
  title: string;
  body: string;
};

export type SecurityItem = {
  icon: IconName;
  title: string;
  body: string;
};

export const SOLUTIONS_HERO = {
  eyebrow: "The platform",
  title: "One workspace for the entire authorization lifecycle.",
  body: "Intake, submission, tracking and appeal — with a human approving every request that leaves your office and a full audit trail behind each one.",
} as const;

export const CAPABILITIES: readonly Capability[] = [
  {
    id: "intake",
    icon: "file-search",
    eyebrow: "Intake",
    title: "Reads the chart the way your staff does",
    body: "Referral packets arrive as scanned faxes, PDFs and free-text notes. Nexauth AI turns them into structured clinical facts — diagnoses, prior therapies, dosages, dates, lab values and prescriber identifiers — and keeps a link from every value to the page it was read from.",
    bullets: [
      "Handles scanned, photographed and handwritten source documents",
      "Extracts ICD-10, CPT, HCPCS and NDC codes with the surrounding context",
      "Flags missing criteria before a request is assembled, not after it is denied",
      "Every field traceable to its source page for clinician review",
    ],
  },
  {
    id: "submission",
    icon: "send",
    eyebrow: "Submission",
    title: "Files it the way each payer demands",
    body: "A maintained library of plan-specific forms and coverage policies decides what the request must contain. Nexauth AI completes it, routes it through the channel that plan supports, and confirms receipt.",
    bullets: [
      "Plan- and drug-specific form selection, kept current as policies change",
      "FHIR and Da Vinci PAS where payers support it; X12 278 where they do not",
      "Secure digital fax fallback for plans still running on paper",
      "Nothing transmits until a person on your team approves it",
    ],
  },
  {
    id: "tracking",
    icon: "radar",
    eyebrow: "Tracking",
    title: "Nothing sits in a pile",
    body: "Every open request lives in one queue with its own clock. Status is polled automatically, deadlines are counted down, and the requests that need a human are the only ones that surface.",
    bullets: [
      "Automatic status polling across payers and channels",
      "Timely-filing and appeal windows tracked with advance alerts",
      "Shared queues with routing rules for multi-site groups",
      "Complete, exportable audit history per request",
    ],
  },
  {
    id: "appeals",
    icon: "scale",
    eyebrow: "Appeals",
    title: "Answers the denial that was actually issued",
    body: "When a determination comes back adverse, Nexauth AI reads the stated reason, retrieves the governing clinical guidance and the plan's own policy language, and drafts a rebuttal that addresses that reason specifically.",
    bullets: [
      "Retrieves current specialty-society guidance and product labelling at draft time",
      "Quotes the governing passage with its issuing body and year",
      "Reconstructs documented prior therapy and intolerance from the chart",
      "Signature-ready letter format with prescriber, NPI and member identifiers",
    ],
  },
  {
    id: "analytics",
    icon: "bar-chart",
    eyebrow: "Analytics",
    title: "Learns which arguments win",
    body: "Denial patterns are not random. Nexauth AI tracks which payers reject which criteria, how often appeals succeed, and where your documentation keeps falling short — so the next request is stronger than the last.",
    bullets: [
      "Denial reasons ranked by payer, plan and service line",
      "Appeal overturn rates by argument type",
      "Turnaround times measured per payer and per channel",
      "Recovered staff hours reported against your own baseline",
    ],
  },
];

export const AUDIENCES: readonly Audience[] = [
  {
    icon: "stethoscope",
    title: "Independent practices",
    body: "Stop staffing a role whose only job is chasing approvals. Start with document upload and fax on day one — no IT project required.",
  },
  {
    icon: "building",
    title: "Multi-site groups",
    body: "One queue and one policy library across every location, with routing rules so the right site handles the right request.",
  },
  {
    icon: "git-merge",
    title: "Health systems",
    body: "Integrate over FHIR, bring your own identity provider, and pass your security review with private deployment options.",
  },
  {
    icon: "heart-pulse",
    title: "Infusion and specialty pharmacy",
    body: "High-cost therapies with the strictest criteria and the longest appeals. Exactly where automated evidence assembly pays for itself.",
  },
];

export const SECURITY: readonly SecurityItem[] = [
  {
    icon: "shield-check",
    title: "HIPAA-aligned by design",
    body: "Administrative, physical and technical safeguards mapped to the Security Rule, with a business associate agreement signed before any PHI is transmitted.",
  },
  {
    icon: "lock",
    title: "Encrypted end to end",
    body: "TLS 1.2+ in transit and AES-256 at rest, with key management separated from application access.",
  },
  {
    icon: "users",
    title: "Least-privilege access",
    body: "Role-based permissions scoped to the minimum necessary, SSO and SCIM on system plans, and immutable audit logging of every record access.",
  },
  {
    icon: "map-pin",
    title: "US data residency",
    body: "Patient data is processed and stored in US regions only, and is never used to train models shared with other customers.",
  },
];

export const WORKFLOW_NOTE = {
  title: "A human approves everything that leaves your office.",
  body: "Nexauth AI is built as an assistant with a hard stop, not an autonomous filer. It drafts, assembles and tracks. A qualified person on your team reviews the request and the appeal, sees the source behind every claim, and decides whether it goes. Clinical accountability stays exactly where it belongs.",
} as const;
