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

import type { AuditEvent, Notification, PolicyConfig, Task } from "@/types";
import { PAYER_TENANT, PROVIDER_TENANT } from "./core";
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
    assignedRole: "ordering-physician",
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
    assignedRole: "provider-staff",
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
    assignedRole: "provider-staff",
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
    assignedRole: "provider-staff",
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
    assignedRole: "provider-staff",
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
    assignedRole: "ordering-physician",
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
    assignedRole: "ordering-physician",
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
    assignedRole: "ordering-physician",
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
    assignedRole: "ordering-physician",
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
    assignedRole: "ordering-physician",
    assignedToUserId: "usr-okafor",
    priority: "high",
    createdAt: daysAgo(4),
    dueAt: daysAhead(26),
    status: "open",
  },

  /* ---- Payer-side queue ---- */
  {
    id: "tsk-p01",
    tenantId: PAYER_TENANT,
    requestId: "req-1057",
    kind: "intake-completeness",
    title: "Expedited request — completeness check",
    reason: "Expedited submission received. 72-hour clock running.",
    assignedRole: "payer-intake",
    assignedToUserId: "usr-reyes",
    priority: "urgent",
    createdAt: daysAgo(2),
    dueAt: hoursAhead(8),
    status: "open",
  },
  {
    id: "tsk-p02",
    tenantId: PAYER_TENANT,
    requestId: "req-1053",
    kind: "clinical-determination",
    title: "Criteria review — lumbar epidural injection",
    reason: "Intake complete, triaged to clinical review.",
    assignedRole: "payer-clinical",
    assignedToUserId: "usr-halvorsen",
    priority: "normal",
    createdAt: daysAgo(3),
    dueAt: daysAhead(3),
    status: "open",
  },
  {
    id: "tsk-p03",
    tenantId: PAYER_TENANT,
    requestId: "req-1069",
    kind: "clinical-determination",
    title: "Expedited — lumbar laminotomy",
    reason: "Expedited request triaged to clinical review. Decision due within 72 hours of receipt.",
    assignedRole: "payer-clinical",
    assignedToUserId: "usr-halvorsen",
    priority: "urgent",
    createdAt: daysAgo(5),
    dueAt: hoursAgo(48),
    status: "open",
  },
  {
    id: "tsk-p04",
    tenantId: PAYER_TENANT,
    requestId: "req-1054",
    kind: "intake-completeness",
    title: "New submission — completeness check",
    reason: "Received via PAS. Awaiting intake triage.",
    assignedRole: "payer-intake",
    priority: "normal",
    createdAt: daysAgo(3),
    dueAt: daysAhead(4),
    status: "open",
  },
  {
    id: "tsk-p05",
    tenantId: PAYER_TENANT,
    requestId: "req-1059",
    kind: "intake-completeness",
    title: "New submission — completeness check",
    reason: "Received via PAS. Awaiting intake triage.",
    assignedRole: "payer-intake",
    priority: "normal",
    createdAt: daysAgo(1),
    dueAt: daysAhead(6),
    status: "open",
  },
  {
    id: "tsk-p06",
    tenantId: PAYER_TENANT,
    requestId: "req-1051",
    kind: "clinical-determination",
    title: "Criteria review — cervical MRI",
    reason: "Intake complete, triaged to clinical review.",
    assignedRole: "payer-clinical",
    priority: "normal",
    createdAt: daysAgo(15),
    dueAt: daysAgo(8),
    status: "done",
    resolvedAt: daysAgo(13),
    resolvedByUserId: "usr-abara",
    resolution: "Approved — criteria met.",
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
  { id: "aud-006", tenantId: PROVIDER_TENANT, at: hoursAgo(6), actorId: "agent:orchestrator", actorName: "Orchestrator", actorType: "agent", action: "request.escalated", targetType: "PriorAuthRequest", targetId: "req-1047", summary: "Routed to clinical review — conservative-therapy criterion not evidenced", metadata: { reason: "evidence-gap", assignedRole: "ordering-physician" } },
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
  { id: "aud-021", tenantId: PAYER_TENANT, at: daysAgo(13), actorId: "usr-abara", actorName: "Dr. Chidi Abara", actorType: "user", action: "determination.issued", targetType: "Decision", targetId: "dec-1051", summary: "Approved — criteria met", metadata: { outcome: "approved" } },
  { id: "aud-022", tenantId: PAYER_TENANT, at: daysAgo(12), actorId: "usr-abara", actorName: "Dr. Chidi Abara", actorType: "user", action: "determination.issued", targetType: "Decision", targetId: "dec-1058", summary: "Partially approved — rental rather than purchase", metadata: { outcome: "partially-approved" } },
  { id: "aud-023", tenantId: PAYER_TENANT, at: daysAgo(3), actorId: "usr-reyes", actorName: "Marcus Reyes", actorType: "user", action: "request.triaged", targetType: "PriorAuthRequest", targetId: "req-1053", summary: "Intake complete, assigned to clinical review", metadata: { assignedTo: "usr-halvorsen" } },
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
  { id: "ntf-001", tenantId: PROVIDER_TENANT, userId: "usr-okafor", eventType: "case.clinical-review-required", title: "A case needs your clinical review", body: "One authorization case is waiting on a clinical judgement.", link: "/physician/review/req-1047", requestId: "req-1047", createdAt: hoursAgo(6), channel: ["in-app", "email"], priority: "high" },
  { id: "ntf-002", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.rfi-received", title: "A payer requested more information", body: "One case has an open information request.", link: "/provider/requests/req-1052", requestId: "req-1052", createdAt: hoursAgo(22), channel: ["in-app", "email", "web-push"], priority: "high" },
  { id: "ntf-003", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.approval-expiring", title: "An approval expires before its service date", body: "One authorization lapses before the scheduled date.", link: "/provider/requests/req-1044", requestId: "req-1044", createdAt: hoursAgo(14), channel: ["in-app", "email"], priority: "high" },
  { id: "ntf-004", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.approval-required", title: "A submission is waiting for your release", body: "One case is held by the automation gate.", link: "/provider/requests/req-1065", requestId: "req-1065", createdAt: hoursAgo(9), channel: ["in-app"], priority: "normal" },
  { id: "ntf-005", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "connection.state-changed", title: "A connection needs reconnecting", body: "An EHR connection is no longer authorized.", link: "/admin/connectors/ci-athena-prod", connectorInstanceId: "ci-athena-prod", createdAt: daysAgo(1), channel: ["in-app", "email"], priority: "high" },
  { id: "ntf-006", tenantId: PROVIDER_TENANT, userId: "usr-okafor", eventType: "case.p2p-scheduled", title: "A peer-to-peer has been scheduled", body: "A peer-to-peer review is booked in two days.", link: "/physician/review/req-1061", requestId: "req-1061", createdAt: daysAgo(3), readAt: daysAgo(3), channel: ["in-app", "email"], priority: "normal" },
  { id: "ntf-007", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.decision-received", title: "A determination was received", body: "One case has a new determination.", link: "/provider/requests/req-1058", requestId: "req-1058", createdAt: daysAgo(12), readAt: daysAgo(12), channel: ["in-app"], priority: "normal" },
  { id: "ntf-008", tenantId: PROVIDER_TENANT, userId: "usr-dana", eventType: "case.sla-at-risk", title: "A case is approaching its decision deadline", body: "One submitted case is close to its deadline.", link: "/provider/requests/req-1052", requestId: "req-1052", createdAt: hoursAgo(3), channel: ["in-app", "web-push"], priority: "normal" },
  { id: "ntf-009", tenantId: PAYER_TENANT, userId: "usr-halvorsen", eventType: "case.sla-at-risk", title: "An expedited case is past its decision deadline", body: "One expedited review has exceeded its 72-hour window.", link: "/payer/clinical/req-1069", requestId: "req-1069", createdAt: hoursAgo(2), channel: ["in-app", "email", "web-push"], priority: "high" },
  { id: "ntf-010", tenantId: PAYER_TENANT, userId: "usr-reyes", eventType: "case.sla-at-risk", title: "An expedited intake is waiting", body: "One expedited submission has not yet been triaged.", link: "/payer/queue", requestId: "req-1057", createdAt: hoursAgo(5), channel: ["in-app", "web-push"], priority: "high" },
  { id: "ntf-011", tenantId: PROVIDER_TENANT, userId: "usr-brooks", eventType: "case.decision-received", title: "Your authorization status has been updated", body: "There is an update on one of your requests.", link: "/patient", requestId: "req-1045", createdAt: daysAgo(20), readAt: daysAgo(19), channel: ["in-app", "email"], priority: "normal" },
  { id: "ntf-012", tenantId: PROVIDER_TENANT, userId: "usr-admin", eventType: "policy.changed", title: "Automation policy was changed", body: "A new policy version is in effect.", link: "/admin/rules", createdAt: daysAgo(8), readAt: daysAgo(8), channel: ["in-app"], priority: "low" },
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
