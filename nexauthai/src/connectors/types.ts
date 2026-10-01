/**
 * The adapter contract every connector implements.
 *
 * This is the whole point of the integration layer: NexAuthAI's core talks to
 * *this* interface and nothing else. An EHR, a clearinghouse, a payer's FHIR
 * endpoint and a browser-driven portal all arrive here looking the same, and
 * adding a payer or an EHR is a new class implementing this contract rather
 * than a change to the engine.
 *
 * Shape follows the Medblocks five-layer model (medblocks-basics.html):
 * a *Source* is the system, a *Connection* is the authorized link to it,
 * `fetch*` methods are the *Pull*, `subscribeToUpdates` is *Updates*, and the
 * canonical results returned here are *Data out*.
 *
 * Every method is optional except `describe` and `test`, because capability
 * genuinely varies: most payers in 2026 do not implement CRD, DTR and PAS,
 * and the waterfall has to degrade through what each one actually supports.
 */

import type {
  ClinicalDocument,
  ConnectorCapability,
  ConnectorInterface,
  ConnectorKind,
  Questionnaire,
  RequirementSource,
} from "@/types";

/* ------------------------------------------------------------------ *
 * Connection and manifest
 * ------------------------------------------------------------------ */

/**
 * A reference to one tenant's configured connection. The credential itself
 * never travels — only a vault reference the runtime resolves.
 */
export interface ConnectionRef {
  instanceId: string;
  tenantId: string;
  credentialRef: string;
  environment: "sandbox" | "production";
}

export interface ConnectorManifest {
  id: string;
  name: string;
  vendor: string;
  kind: ConnectorKind;
  interfaces: ConnectorInterface[];
  version: string;
  /** Contract version this adapter was written against. */
  contractVersion: string;
  capabilities: ConnectorCapability[];
  standards: string[];
}

export interface HealthResult {
  healthy: boolean;
  checkedAt: string;
  latencyMs: number;
  message: string;
  /** Populated when the check fails. */
  errorCode?: string;
}

/* ------------------------------------------------------------------ *
 * Shared result envelope
 * ------------------------------------------------------------------ */

/**
 * Every call returns this envelope rather than a bare value, so the case can
 * record *which* connector answered, over *which* channel, with *what*
 * reference — the audit requirement the source material repeats throughout.
 */
export interface ConnectorResult<T> {
  ok: boolean;
  data?: T;
  error?: ConnectorFault;
  /** Provenance, written to the case ledger. */
  meta: ResultMeta;
}

export interface ResultMeta {
  connectorId: string;
  instanceId: string;
  /** Payer or source reference number for this exact exchange. */
  externalRef?: string;
  latencyMs: number;
  at: string;
  /** Which wire protocol actually carried it. */
  via: ConnectorInterface;
}

/** Native errors are mapped to this shared taxonomy before they surface. */
export interface ConnectorFault {
  code:
    | "auth_expired"
    | "rate_limited"
    | "payer_unavailable"
    | "validation_failed"
    | "ui_changed"
    | "timeout"
    | "mapping_missing"
    | "not_supported"
    | "unknown";
  message: string;
  retryable: boolean;
}

/* ------------------------------------------------------------------ *
 * Request / response shapes
 * ------------------------------------------------------------------ */

export interface EligibilityRequest {
  patientId: string;
  memberId: string;
  payerId: string;
  serviceDate: string;
  serviceCodes: string[];
}

export interface EligibilityResult {
  active: boolean;
  planName: string;
  groupNumber: string;
  coverageStart: string;
  coverageEnd?: string;
  copay?: string;
  deductibleRemaining?: string;
  /** X12 271 transaction reference. */
  transactionRef: string;
}

export interface RequirementRequest {
  patientId: string;
  memberId: string;
  payerId: string;
  serviceCodes: string[];
  diagnosisCodes: string[];
  placeOfService: string;
  orderingProviderNpi: string;
}

export interface RequirementResult {
  /**
   * Tri-state on purpose. "unknown" is a real answer and must never be
   * collapsed into "not required" — the blueprint is explicit that a case
   * never defaults to "not required".
   */
  paRequired: boolean | "unknown";
  /** How the answer was obtained, recorded on the case. */
  source: RequirementSource;
  /** Payer's reference for this determination — the proof. */
  referenceNumber: string;
  determinedAt: string;
  /** Policy the answer came from, with its version. */
  policyId?: string;
  policyVersion?: string;
  /** Documents the payer will expect, when PA is required. */
  requiredDocuments?: { type: string; label: string; required: boolean }[];
  /** Whether a DTR questionnaire is available for this service. */
  questionnaireAvailable: boolean;
  note?: string;
}

export interface QuestionnaireRequest {
  payerId: string;
  serviceCodes: string[];
  diagnosisCodes: string[];
  patientId: string;
}

export interface DocumentRequest {
  patientId: string;
  /** Only the document types the matched rule actually asked for. */
  types: string[];
  since?: string;
  limit?: number;
}

export interface SubmissionRequest {
  requestId: string;
  caseNumber: string;
  patientId: string;
  memberId: string;
  payerId: string;
  serviceCodes: string[];
  diagnosisCodes: string[];
  documentIds: string[];
  questionnaireResponseId?: string;
  urgency: "standard" | "expedited";
  /**
   * Prevents a duplicate authorization across retries and across channels.
   * The adapter must treat a repeat of the same key as the same submission.
   */
  idempotencyKey: string;
}

export interface SubmissionReceipt {
  accepted: boolean;
  /** Payer's tracking number. */
  externalRef: string;
  submittedAt: string;
  /** Payer's own estimate, where it gives one. */
  expectedDecisionBy?: string;
  status: "queued" | "in-review" | "pended" | "decided";
  note?: string;
}

export interface StatusResult {
  status: "queued" | "in-review" | "pended" | "approved" | "partially-approved" | "denied";
  checkedAt: string;
  externalRef: string;
  authorizationNumber?: string;
  validFrom?: string;
  validTo?: string;
  approvedUnits?: number;
  reasonCodes?: { system: string; code: string; display: string }[];
  /** Populated when the payer pends and asks for more. */
  requestedItems?: { type: string; label: string; reason: string }[];
  rationale?: string;
}

export interface RFIResponseRequest {
  requestId: string;
  externalRef: string;
  /** Just the items asked for — not a re-send of the whole packet. */
  documentIds: string[];
  note?: string;
}

export interface WriteBackRequest {
  patientId: string;
  requestId: string;
  authorizationNumber?: string;
  status: string;
  validFrom?: string;
  validTo?: string;
  referenceNumber: string;
  /** Free-text note written into the chart. */
  note: string;
}

/** Push events a connector can raise, mirroring the Medblocks Updates layer. */
export interface ConnectorEvent {
  type:
    | "status.changed"
    | "info.requested"
    | "decision.received"
    | "sync.completed"
    | "sync.failed"
    | "connection.token_refresh_failed";
  instanceId: string;
  at: string;
  /** IDs only — no PHI in an event payload. */
  externalRef?: string;
  requestId?: string;
  detail?: string;
}

/* ------------------------------------------------------------------ *
 * The contract
 * ------------------------------------------------------------------ */

export interface Connector {
  /** Static description of what this adapter is and can do. */
  describe(): ConnectorManifest;

  /** Liveness and credential check. Drives the connection state field. */
  test(conn: ConnectionRef): Promise<HealthResult>;

  /** X12 270/271, or a payer eligibility API. */
  checkEligibility?(
    conn: ConnectionRef,
    req: EligibilityRequest,
  ): Promise<ConnectorResult<EligibilityResult>>;

  /** Da Vinci CRD, an X12 278 inquiry, a payer API, or the payer matrix. */
  isPARequired?(
    conn: ConnectionRef,
    req: RequirementRequest,
  ): Promise<ConnectorResult<RequirementResult>>;

  /** Da Vinci DTR — fetch the payer's documentation questionnaire. */
  getQuestionnaire?(
    conn: ConnectionRef,
    req: QuestionnaireRequest,
  ): Promise<ConnectorResult<Questionnaire>>;

  /** Pull only the documents the matched rule asked for. */
  fetchDocuments?(
    conn: ConnectionRef,
    req: DocumentRequest,
  ): Promise<ConnectorResult<ClinicalDocument[]>>;

  /** Da Vinci PAS `Claim/$submit`, X12 278, a payer API, or a portal upload. */
  submitPA?(
    conn: ConnectionRef,
    req: SubmissionRequest,
  ): Promise<ConnectorResult<SubmissionReceipt>>;

  /** Poll for a decision where the payer does not push one. */
  getStatus?(conn: ConnectionRef, externalRef: string): Promise<ConnectorResult<StatusResult>>;

  /** Da Vinci CDex — resupply just the requested item, without restarting. */
  respondToRFI?(
    conn: ConnectionRef,
    req: RFIResponseRequest,
  ): Promise<ConnectorResult<SubmissionReceipt>>;

  /** Write the outcome back into the chart. */
  writeBack?(conn: ConnectionRef, req: WriteBackRequest): Promise<ConnectorResult<void>>;

  /** Webhooks / FHIR Subscriptions. Returns an unsubscribe function. */
  subscribeToUpdates?(
    conn: ConnectionRef,
    handler: (event: ConnectorEvent) => void,
  ): () => void;
}
