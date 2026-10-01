/**
 * The prior-authorization request itself, plus the clinical material that
 * travels with it.
 *
 * `PriorAuthRequest` is the canonical **Case** the source material keeps
 * referring to: one object that stays the same whichever channel resolves it
 * (clearauth-end-to-end-flow.md, "The spine"). API, portal, voice and human
 * are attempts on this one record, never separate bots and never separate
 * rows.
 */

import type { Sensitivity, TenantId } from "./core";

/**
 * Case lifecycle.
 *
 * The brief's visible timeline is Draft → Submitted → In Review →
 * Pended/RFI → Approved/Denied/Partially Approved → Appealed. The states
 * below add the machine steps that sit between them (eligibility, the
 * requirement check, packet assembly, the automation gate) because the
 * source material treats "not required" and "needs a human" as real,
 * recordable outcomes rather than transient UI states.
 */
export type PaStatus =
  | "draft"
  | "eligibility-check"
  | "requirement-check"
  | "no-auth-required"
  | "documentation"
  | "clinical-review"
  | "needs-approval"
  | "submitting"
  | "submitted"
  | "in-review"
  | "pended"
  | "approved"
  | "partially-approved"
  | "denied"
  | "appealed"
  | "peer-to-peer"
  | "withdrawn"
  | "expired";

/** Statuses that end the case unless an appeal reopens it. */
export const TERMINAL_STATUSES: PaStatus[] = [
  "no-auth-required",
  "approved",
  "partially-approved",
  "denied",
  "withdrawn",
  "expired",
];

/** The five plain statuses practice staff actually see (Vision & Scope §3C). */
export type StaffFacingStatus =
  | "No authorization required"
  | "Submitted — pending"
  | "Approved"
  | "Clinical review required"
  | "Expiring soon";

export type Urgency = "standard" | "expedited";

/**
 * Submission channel, in cost order. The waterfall tries these top to bottom
 * and records which one resolved the case.
 */
export type Channel = "electronic" | "portal" | "voice" | "fax" | "human";

/** How the requirement determination was actually answered. */
export type RequirementSource =
  | "crd"
  | "x12-278-inquiry"
  | "payer-api"
  | "payer-matrix"
  | "portal-lookup"
  | "phone";

/** FHIR: Condition, or Claim.diagnosis within a PAS bundle. */
export interface Diagnosis {
  id: string;
  /** ICD-10-CM code. */
  code: string;
  display: string;
  /** Ranking within the request; 1 is principal. */
  rank: number;
  onsetDate?: string;
}

/** FHIR: Claim.item (PAS) / ServiceRequest for the originating order. */
export interface ServiceLine {
  id: string;
  /** CPT or HCPCS code. */
  code: string;
  codeSystem: "CPT" | "HCPCS";
  display: string;
  /** Place of service code (e.g. 11 office, 22 outpatient hospital). */
  placeOfService: string;
  quantity: number;
  unit: "units" | "visits" | "days" | "sessions";
  /** Requested service window. */
  startDate: string;
  endDate?: string;
  /** Diagnoses supporting this specific line. */
  diagnosisIds: string[];
  /** Populated on the ClaimResponse once a decision lands. */
  decision?: ServiceLineDecision;
}

export interface ServiceLineDecision {
  outcome: "approved" | "denied" | "modified";
  /** Where a payer approves fewer units than requested. */
  approvedQuantity?: number;
  reasonCode?: string;
  note?: string;
}

/** FHIR: DocumentReference */
export interface ClinicalDocument {
  id: string;
  tenantId: TenantId;
  requestId?: string;
  patientId: string;
  title: string;
  /** LOINC document type code where known. */
  loincCode?: string;
  type:
    | "office-note"
    | "imaging-report"
    | "lab-result"
    | "operative-report"
    | "therapy-note"
    | "order"
    | "referral"
    | "prior-auth-letter"
    | "appeal-letter"
    | "other";
  mimeType: string;
  sizeBytes: number;
  /** Content hash — the prototype fakes it, production would compute it. */
  sha256: string;
  uploadedAt: string;
  uploadedBy: string;
  /** Which EHR or upload path this came from. */
  source: string;
  /**
   * Whether the payer's matched rule actually asked for this document.
   * Minimum-necessary is enforced by construction: PA is a HIPAA *payment*
   * disclosure, so the treatment exception does not apply.
   */
  requiredByRule: boolean;
  /** Page count, where the document is paginated. */
  pages?: number;
  sensitivity: Sensitivity;
}

/**
 * One attempt to reach the payer on one channel. A case can have several —
 * an electronic attempt that failed, then a portal attempt that pended, then
 * a voice call that resolved it.
 */
export interface SubmissionAttempt {
  id: string;
  requestId: string;
  channel: Channel;
  /** Which connector instance carried the attempt. */
  connectorId: string;
  startedAt: string;
  endedAt?: string;
  outcome: "succeeded" | "failed" | "pended" | "in-progress";
  /** Payer-issued reference, tying this attempt to the payer's own record. */
  externalRef?: string;
  /** Human-readable failure reason, mapped from the shared error taxonomy. */
  errorCode?: string;
  errorMessage?: string;
  /** Voice attempts carry a recording and transcript. */
  recordingUrl?: string;
  transcript?: TranscriptTurn[];
}

export interface TranscriptTurn {
  speaker: "agent" | "representative" | "ivr";
  text: string;
  at: string;
}

/**
 * The canonical case.
 */
export interface PriorAuthRequest {
  id: string;
  tenantId: TenantId;
  /** Human-facing case number, e.g. "NA-1047". */
  caseNumber: string;

  patientId: string;
  coverageId: string;
  payerId: string;
  /** The clinician who ordered the service and owns the medical decision. */
  orderingProviderId: string;
  /** The facility or clinician who will perform it. */
  renderingProviderId?: string;
  organizationId: string;

  status: PaStatus;
  urgency: Urgency;

  serviceLines: ServiceLine[];
  diagnoses: Diagnosis[];
  documentIds: string[];

  /** Requirement determination — never a silent default. */
  paRequired?: boolean;
  requirementSource?: RequirementSource;
  requirementRef?: string;
  requirementCheckedAt?: string;
  /** Version of the payer rule that answered, so a decision stays reproducible. */
  ruleVersion?: string;

  /** Populated once the AI assist panel has run. */
  aiAssessmentId?: string;
  /** Populated once the payer responds. */
  decisionId?: string;
  questionnaireResponseId?: string;

  attempts: SubmissionAttempt[];

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  /** Decision deadline: 72h expedited / 7 calendar days standard. */
  decisionDueAt?: string;
  /** The date the service is actually booked for, if scheduled. */
  scheduledServiceDate?: string;

  /**
   * Idempotency key (tenant + order + CPT). The source material is emphatic
   * that inquire-before-submit plus this key is what prevents a duplicate
   * authorization.
   */
  idempotencyKey: string;

  /** Optimistic concurrency token, surfaced as If-Match in the real API. */
  version: number;

  assignedToUserId?: string;
  notes?: string;
}

/** Derived view flags, computed rather than stored. */
export interface RequestFlags {
  /** valid-to falls before the scheduled service date. */
  expiringSoon: boolean;
  /** Past its 72h/7d decision deadline. */
  slaBreached: boolean;
  /** Within 25% of the deadline. */
  slaAtRisk: boolean;
  hoursRemaining: number | null;
}
