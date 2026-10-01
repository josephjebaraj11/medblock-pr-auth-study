/**
 * Platform concerns: identity and roles, work assignment, connectors,
 * field mapping, audit and notifications.
 *
 * Two rules from the source material are encoded here rather than left to
 * convention:
 *
 * 1. `Notification` carries IDs and a type, never clinical detail — "no PHI
 *    in the payload" (clearauth-end-to-end-flow.md, notifications).
 * 2. `AuditEvent` is append-only and hash-chained; nothing in the app may
 *    offer an edit or delete path for it.
 */

import type { TenantId } from "./core";

/* ------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------ */

/**
 * The six roles the prototype switches between.
 *
 * `payer-intake` and `payer-clinical` are payer-side. The source folder is
 * entirely provider-side, so those two roles and their screens are an
 * assumption grounded in the research reports (Cohere Health, Anterior,
 * Microsoft's payer-side accelerator) rather than in client requirements.
 * See docs/00-source-analysis.md, gap G1.
 */
export type RoleId =
  | "provider-staff"
  | "ordering-physician"
  | "payer-intake"
  | "payer-clinical"
  | "patient"
  | "platform-admin";

export interface Role {
  id: RoleId;
  label: string;
  /** Which side of the transaction this role sits on. */
  side: "provider" | "payer" | "patient" | "platform";
  description: string;
  /** OAuth-style scopes. The real API checks these; the prototype mirrors them. */
  scopes: Scope[];
  /** Where this role lands after signing in. */
  landingPath: string;
  /** Whether holders of this role may make medical-necessity determinations. */
  canMakeClinicalDetermination: boolean;
}

export type Scope =
  | "request:read"
  | "request:read:own"
  | "request:create"
  | "request:submit"
  | "request:approve-submission"
  | "clinical:attest"
  | "clinical:decide"
  | "appeal:file"
  | "appeal:approve"
  | "p2p:schedule"
  | "queue:work"
  | "queue:assign"
  | "policy:read"
  | "policy:write"
  | "connector:read"
  | "connector:write"
  | "user:manage"
  | "audit:read"
  | "patient:read:self";

export interface User {
  id: string;
  tenantId: TenantId;
  name: string;
  email: string;
  roleIds: RoleId[];
  /** Links a payer-side user to the payer they work for. */
  payerId?: string;
  /** Links a provider-side user to their provider record, where clinical. */
  providerId?: string;
  /** Links the patient role to the patient record it may read. */
  patientId?: string;
  title: string;
  initials: string;
  mfaEnrolled: boolean;
  lastActiveAt: string;
  status: "active" | "invited" | "disabled";
}

/* ------------------------------------------------------------------ *
 * Work
 * ------------------------------------------------------------------ */

export interface Task {
  id: string;
  tenantId: TenantId;
  requestId: string;
  kind:
    | "approve-submission"
    | "clinical-review"
    | "admin-exception"
    | "rfi-response"
    | "appeal-review"
    | "peer-to-peer"
    | "expiring-approval"
    | "intake-completeness"
    | "clinical-determination";
  title: string;
  /** Why this reached a human, in one line. */
  reason: string;
  assignedRole: RoleId;
  assignedToUserId?: string;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  dueAt?: string;
  status: "open" | "in-progress" | "done" | "cancelled";
  resolvedAt?: string;
  resolvedByUserId?: string;
  resolution?: string;
}

/* ------------------------------------------------------------------ *
 * Connectors
 * ------------------------------------------------------------------ */

export type ConnectorKind = "ehr" | "payer" | "clearinghouse" | "voice" | "document" | "fax";

export type ConnectorInterface =
  | "fhir-r4"
  | "smart-on-fhir"
  | "cds-hooks"
  | "bulk-fhir"
  | "hl7v2"
  | "x12-edi"
  | "rest"
  | "soap"
  | "sftp"
  | "browser-rpa"
  | "telephony";

/**
 * A connector *type* in the registry — "Epic", "Availity", "Aetna PAS".
 * Shared across all tenants; this is the catalog.
 */
export interface Connector {
  id: string;
  name: string;
  vendor: string;
  kind: ConnectorKind;
  interfaces: ConnectorInterface[];
  version: string;
  /** Which adapter methods this connector actually implements. */
  capabilities: ConnectorCapability[];
  /** Standards it speaks, shown as chips on the admin screen. */
  standards: string[];
  description: string;
  /** Rough onboarding effort, used by the onboarding playbook. */
  onboardingDays: number;
  logoInitials: string;
}

export type ConnectorCapability =
  | "checkEligibility"
  | "isPARequired"
  | "getQuestionnaire"
  | "fetchDocuments"
  | "submitPA"
  | "getStatus"
  | "respondToRFI"
  | "writeBack"
  | "subscribeToUpdates";

/**
 * One tenant's configured instance of a connector.
 *
 * The state field matters more than it looks: the Medblocks note is that a
 * connection which worked yesterday can quietly stop working today, and
 * nothing in the fetch path would tell you. Acting on connection *state*,
 * rather than on whether an OAuth flow once completed, is the point.
 */
export interface ConnectorInstance {
  id: string;
  tenantId: TenantId;
  connectorId: string;
  label: string;
  environment: "sandbox" | "production";
  state:
    | "active"
    | "degraded"
    | "failed"
    | "refresh-failed"
    | "expired"
    | "disconnected"
    | "configuring";
  /** Reference into the secrets vault. The secret itself never comes here. */
  credentialRef: string;
  lastSyncAt?: string;
  lastTestedAt?: string;
  /** Rolling health over the last 24h, 0–1. */
  successRate: number;
  requestsLast24h: number;
  avgLatencyMs: number;
  errors: ConnectorError[];
  mappingId?: string;
}

export interface ConnectorError {
  id: string;
  at: string;
  /** Mapped to the shared taxonomy, not the vendor's own wording. */
  code:
    | "auth_expired"
    | "rate_limited"
    | "payer_unavailable"
    | "validation_failed"
    | "ui_changed"
    | "timeout"
    | "mapping_missing"
    | "unknown";
  message: string;
  /** Which adapter method was being called. */
  operation: ConnectorCapability;
  retryable: boolean;
  occurrences: number;
}

/**
 * Field mapping between a source system's representation and our canonical
 * FHIR-based model. Shown read-only in the admin field-mapping viewer.
 */
export interface ConnectorMapping {
  id: string;
  connectorId: string;
  tenantId: TenantId;
  version: string;
  updatedAt: string;
  fields: FieldMapping[];
}

export interface FieldMapping {
  id: string;
  /** Path in the source system. */
  sourcePath: string;
  sourceSystem: string;
  /** FHIR path in our canonical model. */
  targetPath: string;
  /** Terminology translation applied, where the code systems differ. */
  transform?: string;
  codeSystemFrom?: string;
  codeSystemTo?: string;
  required: boolean;
  /** Whether live traffic has actually exercised this mapping. */
  status: "mapped" | "unmapped" | "needs-review";
  notes?: string;
}

/* ------------------------------------------------------------------ *
 * Audit and notifications
 * ------------------------------------------------------------------ */

/**
 * Append-only. `prevHash` chains each entry to the one before it, so a
 * removed or altered row is detectable.
 */
export interface AuditEvent {
  id: string;
  tenantId: TenantId;
  at: string;
  actorId: string;
  actorName: string;
  actorType: "user" | "agent" | "system" | "payer";
  /** Verb, e.g. "request.submitted", "policy.changed". */
  action: string;
  /** What was acted on. */
  targetType: string;
  targetId: string;
  /** Payer or transaction reference where the action left our boundary. */
  externalRef?: string;
  /** Short human-readable summary. */
  summary: string;
  /** Non-PHI structured detail. */
  metadata?: Record<string, string | number | boolean>;
  prevHash: string;
  hash: string;
}

/**
 * Notification payloads carry IDs and a type only. The message says a case
 * needs attention and links back into the app, where access is re-checked.
 * Clinical detail never sits in an inbox or a push message.
 */
export interface Notification {
  id: string;
  tenantId: TenantId;
  userId: string;
  eventType:
    | "case.decision-received"
    | "case.rfi-received"
    | "case.clinical-review-required"
    | "case.approval-required"
    | "case.approval-expiring"
    | "case.sla-at-risk"
    | "case.appeal-outcome"
    | "case.p2p-scheduled"
    | "connection.state-changed"
    | "policy.changed";
  /** Deliberately generic — no patient name, no diagnosis, no CPT. */
  title: string;
  body: string;
  /** Deep link; authorization is re-checked on arrival. */
  link: string;
  /** IDs only. */
  requestId?: string;
  connectorInstanceId?: string;
  createdAt: string;
  readAt?: string;
  channel: ("in-app" | "email" | "web-push")[];
  priority: "low" | "normal" | "high";
}

/* ------------------------------------------------------------------ *
 * Tenant automation policy
 * ------------------------------------------------------------------ */

/** Shadow → Supervised → Wider. Granted per payer and per workflow. */
export type TrustMode = "shadow" | "supervised" | "wider";

export interface PolicyConfig {
  id: string;
  tenantId: TenantId;
  version: number;
  /** Auto-submit only at or above this confidence. */
  autoSubmitThreshold: number;
  /** Global stop. When on, everything routes to a human. */
  killSwitch: boolean;
  /** Per-payer trust mode. */
  trustByPayer: Record<string, TrustMode>;
  standardDecisionHours: number;
  expeditedDecisionHours: number;
  /** Who triages the exception queue. */
  escalationOwnerUserId?: string;
  changedAt: string;
  changedByUserId: string;
  changeNote?: string;
}
