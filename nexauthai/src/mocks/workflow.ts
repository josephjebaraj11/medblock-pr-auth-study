/**
 * Tasks, audit events, notifications and the tenant automation policy.
 *
 * The audit chain is built, not hand-written: each entry's `prevHash` is the
 * previous entry's `hash`, so the viewer can show a genuinely verifiable
 * chain rather than a decorative one.
 *
 * Notification bodies carry no patient name, no diagnosis and no CPT. That
 * is the rule from the source material, and it is easier to keep if the
 * fixtures themselves never break it.
 */

import type {
  AuditEvent,
  Notification,
  NotificationEventType,
  NotificationPreference,
  PolicyConfig,
  Task,
  WebPushSubscription,
} from "@/types";
import { PROVIDER_TENANT } from "./core";
import { NOW } from "./requests";

const iso = (d: Date) => d.toISOString();
const daysAgo = (d: number) => iso(new Date(NOW.getTime() - d * 86_400_000));
const hoursAgo = (h: number) => iso(new Date(NOW.getTime() - h * 3_600_000));
const hoursAhead = (h: number) => iso(new Date(NOW.getTime() + h * 3_600_000));
const daysAhead = (d: number) => iso(new Date(NOW.getTime() + d * 86_400_000));

/* ------------------------------------------------------------------ *
 * Tasks
 * ------------------------------------------------------------------ */

export const tasks: Task[] = [
  {
    id: "tsk-001",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1047",
    kind: "clinical-review",
    title: "Conservative therapy threshold not evidenced",
    reason:
      "Policy requires six weeks of provider-directed conservative therapy. Four weeks of physical therapy are documented. Whether concurrent pharmacologic management satisfies the criterion is a clinical judgement.",
    assignedRole: "clinical-reviewer",
    assignedToUserId: "usr-okafor",
    priority: "high",
    createdAt: hoursAgo(6),
    dueAt: hoursAhead(18),
    status: "open",
  },
  {
    id: "tsk-002",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1052",
    kind: "rfi-response",
    title: "Payer requested one additional document",
    reason:
      "Granite State Blue pended the request and asked for the physical therapy discharge summary. The agent can retrieve it; it needs a release.",
    assignedRole: "staff-operations",
    assignedToUserId: "usr-dana",
    priority: "high",
    createdAt: hoursAgo(22),
    dueAt: daysAhead(4),
    status: "open",
  },
  {
    id: "tsk-003",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1044",
    kind: "expiring-approval",
    title: "Authorization lapses before the scheduled procedure",
    reason:
      "Authorization MRDN-AUTH-8841992 is valid to 18 Oct 2026. The procedure is scheduled for 22 Oct 2026 — four days after it lapses.",
    assignedRole: "staff-operations",
    assignedToUserId: "usr-dana",
    priority: "urgent",
    createdAt: hoursAgo(14),
    dueAt: daysAhead(3),
    status: "open",
  },
  {
    id: "tsk-004",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1065",
    kind: "approve-submission",
    title: "Submission held — payer in Shadow mode",
    reason:
      "Caldera Medicaid Partners is in Shadow mode, so every submission waits for a human release. Confidence 0.58 is also below the 0.85 threshold.",
    assignedRole: "staff-operations",
    assignedToUserId: "usr-dana",
    priority: "normal",
    createdAt: hoursAgo(9),
    dueAt: daysAhead(2),
    status: "open",
  },
  {
    id: "tsk-005",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1067",
    kind: "admin-exception",
    title: "Coverage terminated",
    reason:
      "Eligibility returned coverage terminated 31 Aug 2026. An updated member ID is needed before the case can move.",
    assignedRole: "staff-operations",
    assignedToUserId: "usr-dana",
    priority: "high",
    createdAt: hoursAgo(7),
    dueAt: daysAhead(1),
    status: "open",
  },
  {
    id: "tsk-006",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1039",
    kind: "appeal-review",
    title: "First-level appeal filed, awaiting payer response",
    reason: "Appeal filed 25 Sep 2026. Payer response due within 30 days.",
    assignedRole: "clinical-reviewer",
    assignedToUserId: "usr-okafor",
    priority: "normal",
    createdAt: daysAgo(6),
    dueAt: daysAhead(12),
    status: "in-progress",
  },
  {
    id: "tsk-007",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1061",
    kind: "peer-to-peer",
    title: "Peer-to-peer scheduled",
    reason: "Dr. Oduya (Caldera) available in two days. Dr. Lindqvist to attend.",
    assignedRole: "clinical-reviewer",
    assignedToUserId: "usr-lindqvist",
    priority: "high",
    createdAt: daysAgo(3),
    dueAt: daysAhead(2),
    status: "in-progress",
  },
  {
    id: "tsk-008",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1060",
    kind: "clinical-review",
    title: "Criteria interpretation needed",
    reason: "Agent could not determine whether the documented injection course counts toward the conservative-management requirement.",
    assignedRole: "clinical-reviewer",
    priority: "normal",
    createdAt: daysAgo(1),
    dueAt: daysAhead(2),
    status: "open",
  },
  {
    id: "tsk-009",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1042",
    kind: "appeal-review",
    title: "Appeal draft awaiting clinical sign-off",
    reason: "The agent drafted a first-level appeal. A licensed clinician must approve it before it can be filed.",
    assignedRole: "clinical-reviewer",
    priority: "normal",
    createdAt: daysAgo(2),
    dueAt: daysAhead(8),
    status: "open",
  },

  {
    id: "tsk-010",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1048",
    kind: "appeal-review",
    title: "Denial received — appeal draft ready for review",
    reason:
      "Meridian denied on the conservative-management criterion. Every denial routes to a licensed clinician; the agent has drafted an appeal but cannot file it without clinical sign-off.",
    assignedRole: "clinical-reviewer",
    assignedToUserId: "usr-okafor",
    priority: "high",
    createdAt: daysAgo(4),
    dueAt: daysAhead(26),
    status: "open",
  },

];

/* ------------------------------------------------------------------ *
 * Audit
 * ------------------------------------------------------------------ */

type AuditSeed = Omit<AuditEvent, "prevHash" | "hash">;

const auditSeeds: AuditSeed[] = [
  { id: "aud-001", tenantId: PROVIDER_TENANT, at: daysAgo(3), actorId: "usr-okafor", actorName: "Dr. Adaeze Okafor", actorType: "user", action: "request.created", targetType: "PriorAuthRequest", targetId: "req-1047", summary: "Order placed and authorization requested for CPT 72148", metadata: { channel: "ehr-order-sign" } },
  { id: "aud-002", tenantId: PROVIDER_TENANT, at: daysAgo(3), actorId: "agent:coverage", actorName: "Coverage agent", actorType: "agent", action: "eligibility.checked", targetType: "Coverage", targetId: "cvg-002", externalRef: "271-CVG-002", summary: "Eligibility confirmed active via X12 271", metadata: { connector: "con-availity-x12", latencyMs: 2140 } },
  { id: "aud-003", tenantId: PROVIDER_TENANT, at: daysAgo(3), actorId: "agent:coverage", actorName: "Coverage agent", actorType: "agent", action: "requirement.determined", targetType: "PriorAuthRequest", targetId: "req-1047", externalRef: "CRD-MRDN-8841027", summary: "Prior authorization required — determined via Da Vinci CRD", metadata: { source: "crd", ruleVersion: "MH-RAD-0412 v4.2" } },
  { id: "aud-004", tenantId: PROVIDER_TENANT, at: daysAgo(3), actorId: "agent:clinical", actorName: "Clinical agent", actorType: "agent", action: "documents.fetched", targetType: "PriorAuthRequest", targetId: "req-1047", summary: "Retrieved 4 documents matching the payer's required-document list", metadata: { connector: "con-epic", documentCount: 4, minimumNecessary: true } },
  { id: "aud-005", tenantId: PROVIDER_TENANT, at: hoursAgo(6), actorId: "agent:decision", actorName: "Decision agent", actorType: "agent", action: "assessment.generated", targetType: "AIAssessment", targetId: "ai-1047", summary: "Confidence 0.61 — below the 0.85 threshold", metadata: { confidence: 0.61, model: "nexauth-extract-2026.09", prompt: "pa-extract/v7" } },
  { id: "aud-006", tenantId: PROVIDER_TENANT, at: hoursAgo(6), actorId: "agent:orchestrator", actorName: "Orchestrator", actorType: "agent", action: "request.escalated", targetType: "PriorAuthRequest", targetId: "req-1047", summary: "Routed to clinical review — conservative-therapy criterion not evidenced", metadata: { reason: "evidence-gap", assignedRole: "clinical-reviewer" } },
  { id: "aud-007", tenantId: PROVIDER_TENANT, at: hoursAgo(22), actorId: "payer:granite", actorName: "Granite State Blue", actorType: "payer", action: "request.pended", targetType: "PriorAuthRequest", targetId: "req-1052", externalRef: "GSB-PAS-3310771", summary: "Payer pended and requested one additional document" },
  { id: "aud-008", tenantId: PROVIDER_TENANT, at: hoursAgo(14), actorId: "system:timer", actorName: "Expiry timer", actorType: "system", action: "approval.expiring", targetType: "PriorAuthRequest", targetId: "req-1044", summary: "Authorization lapses 4 days before the scheduled procedure date" },
  { id: "aud-009", tenantId: PROVIDER_TENANT, at: daysAgo(6), actorId: "usr-okafor", actorName: "Dr. Adaeze Okafor", actorType: "user", action: "appeal.approved", targetType: "Appeal", targetId: "apl-1039", summary: "First-level appeal approved for filing by a licensed clinician", metadata: { level: 1 } },
  { id: "aud-010", tenantId: PROVIDER_TENANT, at: daysAgo(6), actorId: "agent:followup", actorName: "Follow-Up agent", actorType: "agent", action: "appeal.filed", targetType: "Appeal", targetId: "apl-1039", externalRef: "ATLS-APL-7719440", summary: "Appeal submitted to Atlas Mutual with the retrieved radiograph report" },
  { id: "aud-011", tenantId: PROVIDER_TENANT, at: daysAgo(18), actorId: "payer:atlas", actorName: "Atlas Mutual", actorType: "payer", action: "decision.received", targetType: "Decision", targetId: "dec-1039", externalRef: "ATLS-DEC-7719023", summary: "Denied — CARC 50, plain radiographs not documented" },
  { id: "aud-012", tenantId: PROVIDER_TENANT, at: daysAgo(18), actorId: "agent:orchestrator", actorName: "Orchestrator", actorType: "agent", action: "request.escalated", targetType: "PriorAuthRequest", targetId: "req-1039", summary: "Denial routed to a licensed human — the agent never issues or accepts a denial unreviewed", metadata: { policy: "no-ai-denial" } },
  { id: "aud-013", tenantId: PROVIDER_TENANT, at: hoursAgo(26), actorId: "agent:coverage", actorName: "Coverage agent", actorType: "agent", action: "requirement.determined", targetType: "PriorAuthRequest", targetId: "req-1063", externalRef: "CRD-MRDN-8841455", summary: "No prior authorization required — evidenced, logged and written back to the chart", metadata: { source: "crd", paRequired: false } },
  { id: "aud-014", tenantId: PROVIDER_TENANT, at: hoursAgo(9), actorId: "agent:decision", actorName: "Decision agent", actorType: "agent", action: "submission.held", targetType: "PriorAuthRequest", targetId: "req-1065", summary: "Held by the automation gate — payer in Shadow mode", metadata: { trustMode: "shadow", confidence: 0.58 } },
  { id: "aud-015", tenantId: PROVIDER_TENANT, at: daysAgo(8), actorId: "usr-admin", actorName: "Priyanka Raghunathan", actorType: "user", action: "policy.changed", targetType: "PolicyConfig", targetId: "pol-northside", summary: "Auto-submit threshold raised from 0.82 to 0.85", metadata: { version: 7, from: 0.82, to: 0.85 } },
  { id: "aud-016", tenantId: PROVIDER_TENANT, at: daysAgo(11), actorId: "usr-admin", actorName: "Priyanka Raghunathan", actorType: "user", action: "policy.changed", targetType: "PolicyConfig", targetId: "pol-northside", summary: "Granite State Blue promoted from Shadow to Supervised", metadata: { version: 6, payer: "pay-granite", mode: "supervised" } },
  { id: "aud-017", tenantId: PROVIDER_TENANT, at: daysAgo(1), actorId: "system:connector", actorName: "Connector monitor", actorType: "system", action: "connection.state_changed", targetType: "ConnectorInstance", targetId: "ci-athena-prod", summary: "athenahealth connection moved to refresh-failed — reconnect required", metadata: { from: "active", to: "refresh-failed" } },
  { id: "aud-018", tenantId: PROVIDER_TENANT, at: hoursAgo(7), actorId: "system:connector", actorName: "Connector monitor", actorType: "system", action: "connection.state_changed", targetType: "ConnectorInstance", targetId: "ci-portal-atlas", summary: "Atlas portal automation failed — payer UI changed, cases rerouted to voice", metadata: { from: "active", to: "failed", errorCode: "ui_changed" } },
  { id: "aud-019", tenantId: PROVIDER_TENANT, at: daysAgo(21), actorId: "agent:submission", actorName: "Submission agent", actorType: "agent", action: "channel.fallback", targetType: "PriorAuthRequest", targetId: "req-1061", summary: "Electronic route unsupported — fell through to payer portal", metadata: { from: "electronic", to: "portal" } },
  { id: "aud-020", tenantId: PROVIDER_TENANT, at: daysAgo(30), actorId: "agent:submission", actorName: "Submission agent", actorType: "agent", action: "call.placed", targetType: "PriorAuthRequest", targetId: "req-1042", externalRef: "CALL-PNCL-44120", summary: "Outbound call to Pinnacle Choice — automated-caller disclosure not permitted, agent did not self-identify as automated", metadata: { durationSeconds: 1340, recordingConsent: "one-party", state: "OH" } },
];

/** djb2 — enough to demonstrate a verifiable chain without a crypto import. */
function chainHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0").repeat(4);
}

export const auditEvents: AuditEvent[] = (() => {
  const sorted = [...auditSeeds].sort((a, b) => (a.at < b.at ? -1 : 1));
  let prev = "0".repeat(32);
  const out: AuditEvent[] = [];
  for (const seed of sorted) {
    const hash = chainHash(`${prev}|${seed.id}|${seed.at}|${seed.action}|${seed.targetId}`);
    out.push({ ...seed, prevHash: prev, hash });
    prev = hash;
  }
  return out.reverse();
})();

/* ------------------------------------------------------------------ *
 * Notifications — IDs and types only, never clinical detail
 * ------------------------------------------------------------------ */

export const notifications: Notification[] = [
  { id: "ntf-001", tenantId: PROVIDER_TENANT, userId: "usr-okafor", eventType: "case.clinical-review-required", title: "A case needs your clinical review", body: "One authorization case is waiting on a clinical judgement.", link: "/clinical/req-1047", requestId: "req-1047", createdAt: hoursAgo(6), channel: ["in-app", "email"], priority: "high" },
  { id: "ntf-002", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.rfi-received", title: "A payer requested more information", body: "One case has an open information request.", link: "/ops/requests/req-1052", requestId: "req-1052", createdAt: hoursAgo(22), channel: ["in-app", "email", "web-push"], priority: "high" },
  { id: "ntf-003", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.approval-expiring", title: "An approval expires before its service date", body: "One authorization lapses before the scheduled date.", link: "/ops/requests/req-1044", requestId: "req-1044", createdAt: hoursAgo(14), channel: ["in-app", "email"], priority: "high" },
  { id: "ntf-004", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.approval-required", title: "A submission is waiting for your release", body: "One case is held by the automation gate.", link: "/ops/requests/req-1065", requestId: "req-1065", createdAt: hoursAgo(9), channel: ["in-app"], priority: "normal" },
  { id: "ntf-005", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "connection.state-changed", title: "A connection needs reconnecting", body: "An EHR connection is no longer authorized.", link: "/admin/connectors/ci-athena-prod", connectorInstanceId: "ci-athena-prod", createdAt: daysAgo(1), channel: ["in-app", "email"], priority: "high" },
  { id: "ntf-006", tenantId: PROVIDER_TENANT, userId: "usr-okafor", eventType: "case.p2p-scheduled", title: "A peer-to-peer has been scheduled", body: "A peer-to-peer review is booked in two days.", link: "/clinical/req-1061", requestId: "req-1061", createdAt: daysAgo(3), readAt: daysAgo(3), channel: ["in-app", "email"], priority: "normal" },
  { id: "ntf-007", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.decision-received", title: "A determination was received", body: "One case has a new determination.", link: "/ops/requests/req-1058", requestId: "req-1058", createdAt: daysAgo(12), readAt: daysAgo(12), channel: ["in-app"], priority: "normal" },
  { id: "ntf-008", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.sla-at-risk", title: "A case is approaching its decision deadline", body: "One submitted case is close to its deadline.", link: "/ops/requests/req-1052", requestId: "req-1052", createdAt: hoursAgo(3), channel: ["in-app", "web-push"], priority: "normal" },
  { id: "ntf-012", tenantId: PROVIDER_TENANT, userId: "usr-admin", eventType: "policy.changed", title: "Automation policy was changed", body: "A new policy version is in effect.", link: "/admin/payers", createdAt: daysAgo(8), readAt: daysAgo(8), channel: ["in-app"], priority: "low" },
  { id: "ntf-013", tenantId: PROVIDER_TENANT, userId: "usr-admin", eventType: "connection.state-changed", title: "A payer portal connection failed", body: "One connection is reporting a changed interface.", link: "/admin/connectors/ci-portal-atlas", connectorInstanceId: "ci-portal-atlas", createdAt: hoursAgo(7), channel: ["in-app", "email", "web-push"], priority: "high" },
  { id: "ntf-014", tenantId: PROVIDER_TENANT, userId: "usr-admin", eventType: "billing.invoice-issued", title: "An invoice was issued", body: "The October invoice is available on the billing screen.", link: "/admin/billing", createdAt: daysAgo(1), channel: ["in-app", "email"], priority: "normal" },
  { id: "ntf-015", tenantId: PROVIDER_TENANT, userId: "usr-admin", eventType: "tenant.onboarding-step", title: "A tenant advanced in onboarding", body: "One onboarding tenant completed a step.", link: "/admin/tenants", createdAt: daysAgo(2), readAt: daysAgo(2), channel: ["in-app"], priority: "low" },
];

/* ------------------------------------------------------------------ *
 * Notification delivery preferences
 *
 * In-app is not a preference — it is the queue. Email and web push are the
 * two outbound channels and each is opt-out per event type. Switching one
 * off changes delivery only; the event, the audit entry and the in-app row
 * all still happen.
 * ------------------------------------------------------------------ */

/** Event types a person can choose to be told about, in display order. */
export const notifiableEvents: {
  type: NotificationEventType;
  label: string;
  description: string;
  /** Which personas ever receive it. */
  audience: string;
}[] = [
  { type: "case.clinical-review-required", label: "Clinical review required", description: "The agent found an evidence gap and stopped.", audience: "Clinical Reviewer" },
  { type: "case.approval-required", label: "Submission held for release", description: "The automation gate held a case for a human.", audience: "Staff / Operations" },
  { type: "case.rfi-received", label: "Payer requested more information", description: "A payer pended a case and asked for a document.", audience: "Staff / Operations" },
  { type: "case.decision-received", label: "Determination received", description: "A payer returned an outcome.", audience: "Staff / Operations · Clinical Reviewer" },
  { type: "case.approval-expiring", label: "Approval expiring", description: "An authorization lapses before its service date.", audience: "Staff / Operations" },
  { type: "case.sla-at-risk", label: "Decision deadline at risk", description: "A submitted case is close to its 72h or 7d deadline.", audience: "Staff / Operations" },
  { type: "case.appeal-outcome", label: "Appeal outcome", description: "A filed appeal was decided.", audience: "Clinical Reviewer" },
  { type: "case.p2p-scheduled", label: "Peer-to-peer scheduled", description: "A payer medical director confirmed a slot.", audience: "Clinical Reviewer" },
  { type: "connection.state-changed", label: "Connection state changed", description: "A connector stopped working or was reconnected.", audience: "Admin" },
  { type: "policy.changed", label: "Automation policy changed", description: "A new policy version took effect.", audience: "Admin" },
  { type: "billing.invoice-issued", label: "Invoice issued", description: "A new invoice is available.", audience: "Admin" },
  { type: "tenant.onboarding-step", label: "Tenant onboarding step", description: "A tenant advanced through onboarding.", audience: "Admin (platform)" },
];

const defaultPrefs = (userId: string, off: NotificationEventType[] = []): NotificationPreference[] =>
  notifiableEvents.map((e) => ({
    userId,
    eventType: e.type,
    email: !off.includes(e.type),
    webPush: !off.includes(e.type) && e.type !== "case.decision-received",
  }));

export const notificationPreferences: NotificationPreference[] = [
  ...defaultPrefs("usr-dana"),
  ...defaultPrefs("usr-okafor", ["case.sla-at-risk"]),
  ...defaultPrefs("usr-admin", ["case.decision-received"]),
];

export const webPushSubscriptions: WebPushSubscription[] = [
  {
    userId: "usr-dana",
    permission: "granted",
    endpointRef: "wps_7f31c2a9",
    deviceLabel: "Front-desk workstation · Chrome",
    subscribedAt: daysAgo(34),
  },
  { userId: "usr-okafor", permission: "default" },
  {
    userId: "usr-admin",
    permission: "granted",
    endpointRef: "wps_be0442d1",
    deviceLabel: "MacBook Pro · Safari",
    subscribedAt: daysAgo(12),
  },
];

/* ------------------------------------------------------------------ *
 * Policy
 * ------------------------------------------------------------------ */

export const policyConfig: PolicyConfig = {
  id: "pol-northside",
  tenantId: PROVIDER_TENANT,
  version: 7,
  autoSubmitThreshold: 0.85,
  killSwitch: false,
  trustByPayer: {
    "pay-meridian": "wider",
    "pay-granite": "supervised",
    "pay-atlas": "supervised",
    "pay-caldera": "shadow",
    "pay-pinnacle": "shadow",
  },
  standardDecisionHours: 168,
  expeditedDecisionHours: 72,
  escalationOwnerUserId: "usr-dana",
  changedAt: daysAgo(8),
  changedByUserId: "usr-admin",
  changeNote: "Auto-submit threshold raised from 0.82 to 0.85 after the September calibration review.",
};
