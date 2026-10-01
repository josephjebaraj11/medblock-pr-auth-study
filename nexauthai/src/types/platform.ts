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
 * The three personas the portal switches between.
 *
 * The source material names four — Staff/Operations, Clinical reviewer,
 * Tenant Admin and Master Admin — and the last two are merged here into a
 * single `admin` persona whose reach is scoped by whether the signed-in user
 * is bound to one tenant or to the platform. See `User.adminScope`.
 *
 * There is no separate physician, payer or patient persona. A practice sees
 * two end-user personas plus an admin; the physician's "GET AUTHORIZATION"
 * action lives in Operations, the payer is a counterparty reached through
 * connectors, and patient access is a 2027 CMS obligation, not a seat.
 */
export type RoleId = "staff-operations" | "clinical-reviewer" | "admin";

export interface Role {
  id: RoleId;
  label: string;
  /** Which surface of the single portal this persona lands on. */
  side: "operations" | "clinical" | "admin";
  description: string;
  /** OAuth-style scopes. The real API checks these; the prototype mirrors them. */
  scopes: Scope[];
  /** Where this role lands after signing in. */
  landingPath: string;
  /** Whether holders of this role may make medical-necessity judgements. */
  canMakeClinicalDetermination: boolean;
  /** Short line used on the switcher, summarising what this persona touches. */
  sees: string;
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
  | "tenant:manage"
  | "billing:manage"
  | "platform:admin";

/**
 * How far an admin's reach extends.
 *
 * `tenant` is the practice's own admin: users, rules, connections, billing
 * and the audit log for one tenant. `platform` is the operator (us): the
 * same screens, plus every tenant and the shared connector registry — and
 * still no PHI scope anywhere. One persona, two reaches.
 */
export type AdminScope = "tenant" | "platform";

export interface User {
  id: string;
  tenantId: TenantId;
  name: string;
  email: string;
  roleIds: RoleId[];
  /** Links a clinical user to their provider record. */
  providerId?: string;
  /**
   * Only meaningful when the user holds `admin`. A tenant admin sees one
   * tenant; a platform admin sees all of them. Both use the same screens.
   */
  adminScope?: AdminScope;
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
    | "expiring-approval";
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
    | "policy.changed"
    | "billing.invoice-issued"
    | "tenant.onboarding-step";
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

/* ------------------------------------------------------------------ *
 * Notification preferences
 * ------------------------------------------------------------------ */

export type NotificationChannel = "in-app" | "email" | "web-push";

export type NotificationEventType = Notification["eventType"];

/**
 * Per-user, per-event delivery choice.
 *
 * In-app is always on — it is the queue itself. Email and web push are the
 * two outbound channels, and each is opt-out per event type. The payload
 * rule does not change with the channel: an email and a push message carry
 * the same ID-only body the in-app row does.
 */
export interface NotificationPreference {
  userId: string;
  eventType: NotificationEventType;
  email: boolean;
  webPush: boolean;
}

/** Browser push registration state, per user and device. */
export interface WebPushSubscription {
  userId: string;
  /** What the browser's Notification API reports. */
  permission: "granted" | "denied" | "default";
  endpointRef?: string;
  deviceLabel?: string;
  subscribedAt?: string;
}

/* ------------------------------------------------------------------ *
 * Billing
 * ------------------------------------------------------------------ */

/**
 * One tenant's commercial arrangement.
 *
 * The shape follows the documented model: a tiered annual license plus a
 * flat monthly managed-services fee, with one-time onboarding and net-new
 * integration charges invoiced separately, and variable pass-through costs
 * metered. It is a SaaS subscription, not per-PA pricing.
 */
export interface BillingAccount {
  tenantId: TenantId;
  /** One Stripe customer per tenant. */
  stripeCustomerRef: string;
  plan: "starter" | "growth" | "scale" | "enterprise";
  /** Contracted physician seats, which is what the license is priced on. */
  licensedPhysicians: number;
  annualLicenseUsd: number;
  managedServicesMonthlyUsd: number;
  onboardingOneTimeUsd: number;
  /** Whether variable pass-through usage is itemised or folded into the flat fee. */
  passThroughMode: "itemised" | "included";
  currency: "USD";
  billingEmail: string;
  paymentMethod: PaymentMethod;
  renewsAt: string;
  status: "active" | "past-due" | "trialing" | "cancelled";
}

export interface PaymentMethod {
  kind: "card" | "ach" | "invoice-net30";
  /** Last four only. Full instrument details never reach this app. */
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  /** Stripe payment-method reference; the instrument lives at Stripe. */
  stripeRef: string;
}

export interface Invoice {
  id: string;
  tenantId: TenantId;
  stripeInvoiceRef: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  dueAt: string;
  status: "paid" | "open" | "past-due" | "draft" | "void";
  subtotalUsd: number;
  taxUsd: number;
  totalUsd: number;
  lines: InvoiceLine[];
}

export interface InvoiceLine {
  id: string;
  kind: "license" | "managed-services" | "onboarding" | "integration" | "pass-through";
  description: string;
  quantity: number;
  unit?: string;
  unitPriceUsd: number;
  amountUsd: number;
  /** Pass-through lines trace back to the transaction ledger. */
  usageKind?: UsageKind;
}

export type UsageKind =
  | "electronic-transaction"
  | "portal-session"
  | "voice-minute"
  | "model-tokens"
  | "fax-page";

/**
 * A metered unit of consumption, always attributed to the case that caused
 * it — so an invoice line can be audited down to the exact cases behind it.
 */
export interface UsageRecord {
  id: string;
  tenantId: TenantId;
  kind: UsageKind;
  quantity: number;
  unit: string;
  unitCostUsd: number;
  requestId?: string;
  recordedAt: string;
}
