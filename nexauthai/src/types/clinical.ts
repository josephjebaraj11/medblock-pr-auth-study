/**
 * Payer policy, documentation questionnaires, AI assessment, decisions,
 * appeals and the request-for-information loop.
 *
 * The boundary this file encodes, stated in almost every source document:
 * **the agent reports facts and gaps; it never issues a medical-necessity
 * verdict, and it never denies.** `AIAssessment` therefore has no "deny"
 * recommendation, and `Decision` requires a human `decidedByUserId` whenever
 * the outcome is a denial.
 */

import type { TenantId } from "./core";

/* ------------------------------------------------------------------ *
 * Payer policy and criteria
 * ------------------------------------------------------------------ */

/** FHIR: no direct resource. Da Vinci CRD serves this at order time. */
export interface PayerCriteria {
  id: string;
  payerId: string;
  planIds: string[];
  /** CPT/HCPCS codes this policy governs. */
  serviceCodes: string[];
  title: string;
  /** Payer's own policy number, as cited on a denial letter. */
  policyNumber: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  sourceUrl?: string;
  /** Does this policy require PA at all for the listed codes? */
  paRequired: boolean;
  /** Individually checkable criteria. This is what the AI matches against. */
  criteria: CriterionItem[];
  /** Document types the payer expects with the submission. */
  requiredDocuments: RequiredDocument[];
  /** Channel preference order for this payer and policy. */
  channelPreference: ("electronic" | "portal" | "voice" | "fax")[];
  /** Last time a human reviewed this rule for staleness. */
  lastReviewedAt: string;
}

export interface CriterionItem {
  id: string;
  /** Short label shown in the criteria-match panel. */
  label: string;
  /** Full policy language. */
  text: string;
  /** Whether failing this criterion alone blocks approval. */
  required: boolean;
  /** Where in the chart this is usually evidenced. */
  expectedEvidence: string;
}

export interface RequiredDocument {
  type: string;
  label: string;
  loincCode?: string;
  required: boolean;
}

/* ------------------------------------------------------------------ *
 * Documentation questionnaire (Da Vinci DTR)
 * ------------------------------------------------------------------ */

/** FHIR: Questionnaire */
export interface Questionnaire {
  id: string;
  /** FHIR canonical URL, versioned. */
  canonicalUrl: string;
  version: string;
  payerId: string;
  title: string;
  /** The criteria set this questionnaire gathers evidence for. */
  criteriaId: string;
  items: QuestionnaireItem[];
}

export interface QuestionnaireItem {
  linkId: string;
  text: string;
  type: "boolean" | "string" | "text" | "date" | "integer" | "choice";
  required: boolean;
  options?: string[];
  helpText?: string;
  /**
   * Whether DTR can pre-populate this from structured chart data (CQL), as
   * opposed to needing extraction from a narrative note or a human answer.
   */
  prepopulable: boolean;
}

/** FHIR: QuestionnaireResponse */
export interface QuestionnaireResponse {
  id: string;
  tenantId: TenantId;
  questionnaireId: string;
  requestId: string;
  status: "in-progress" | "completed" | "amended";
  answers: QuestionnaireAnswer[];
  authoredAt: string;
  /** User who reviewed and signed off the pre-populated answers. */
  authoredByUserId?: string;
}

export interface QuestionnaireAnswer {
  linkId: string;
  value: string | number | boolean | null;
  /** How this answer arrived. */
  source: "cql-prepopulated" | "ai-extracted" | "manual";
  /** 0–1. Only meaningful for ai-extracted answers. */
  confidence?: number;
  /** Provenance: which document, and where in it. */
  sourceDocumentId?: string;
  sourceSpan?: string;
}

/* ------------------------------------------------------------------ *
 * AI assessment
 * ------------------------------------------------------------------ */

/**
 * The AI's reading of one case.
 *
 * Note what is deliberately absent: there is no "deny" recommendation and no
 * medical-necessity verdict. The agent may recommend submitting, gathering
 * more, or escalating to a licensed human — nothing else.
 */
export interface AIAssessment {
  id: string;
  tenantId: TenantId;
  requestId: string;
  generatedAt: string;
  /** Model and prompt versions, stored so a case stays reproducible. */
  modelVersion: string;
  promptVersion: string;

  /** Facts pulled out of the chart, each tied back to its source. */
  extractedFacts: ExtractedFact[];
  /** How the case scores against each criterion in the matched policy. */
  criteriaMatches: CriteriaMatch[];
  /** Documents the rule asks for that are not present. */
  missingDocuments: MissingItem[];
  /** Criteria with no supporting evidence found in the chart. */
  evidenceGaps: MissingItem[];

  /** Weighted, explainable components — never a bare number. */
  confidence: ConfidenceScore;

  recommendation: AIRecommendation;
  /** One-paragraph plain-language rationale shown above the detail. */
  rationale: string;

  /** Drafted medical-necessity letter, always human-reviewed before sending. */
  draftLetter?: DraftLetter;
}

export type AIRecommendation =
  | "ready-to-submit"
  | "gather-more-documentation"
  | "escalate-clinical-review";

export interface ExtractedFact {
  id: string;
  label: string;
  value: string;
  /** 0–1. */
  confidence: number;
  sourceDocumentId: string;
  sourceSpan: string;
  category: "diagnosis" | "history" | "treatment" | "imaging" | "measurement" | "other";
}

export interface CriteriaMatch {
  criterionId: string;
  label: string;
  status: "met" | "not-met" | "unclear";
  /** 0–1 — how confident the agent is in this specific judgement of fit. */
  confidence: number;
  /** The evidence the agent is relying on. */
  evidence: { documentId: string; span: string }[];
  note: string;
}

export interface MissingItem {
  id: string;
  label: string;
  /** Why the payer wants it. */
  reason: string;
  severity: "blocking" | "recommended";
  /** Whether the agent can fetch this itself or a human must supply it. */
  resolvableBy: "agent" | "staff" | "clinician";
}

export interface ConfidenceScore {
  /** 0–1 overall. */
  overall: number;
  components: ConfidenceComponent[];
}

export interface ConfidenceComponent {
  key:
    | "rule-match"
    | "packet-completeness"
    | "extraction-certainty"
    | "identity-match"
    | "route-reliability"
    | "prior-outcomes";
  label: string;
  /** 0–1. */
  score: number;
  /** Contribution weight, summing to 1 across components. */
  weight: number;
  explanation: string;
}

export interface DraftLetter {
  subject: string;
  body: string;
  /** Facts cited in the letter, so a reviewer can check each one. */
  citedFactIds: string[];
  generatedAt: string;
  /** A letter is never sent until a human approves it. */
  approvedByUserId?: string;
  approvedAt?: string;
}

/* ------------------------------------------------------------------ *
 * Decision
 * ------------------------------------------------------------------ */

/** FHIR: ClaimResponse (PAS) */
export interface Decision {
  id: string;
  tenantId: TenantId;
  requestId: string;
  outcome: "approved" | "partially-approved" | "denied" | "pended";
  decidedAt: string;
  /**
   * The human who made the call.
   *
   * Required for any denial or partial approval — the platform will not
   * record one without it. Approvals may be system-recorded when they come
   * back from a payer electronically.
   */
  decidedByUserId?: string;
  decidedByName?: string;

  /** Payer-issued authorization number. */
  authorizationNumber?: string;
  validFrom?: string;
  validTo?: string;
  approvedUnits?: number;

  /** Structured reason codes, e.g. CARC 50. */
  reasonCodes: ReasonCode[];
  /** Free-text rationale the payer returned, or the reviewer wrote. */
  rationale: string;
  /** Payer's own reference for this decision. */
  payerRef?: string;
  /** Which policy version the decision was made against. */
  criteriaId?: string;

  /** Deadline for filing an appeal, where the outcome is a denial. */
  appealDeadline?: string;
}

export interface ReasonCode {
  system: "CARC" | "RARC" | "payer-internal";
  code: string;
  display: string;
}

/* ------------------------------------------------------------------ *
 * Appeal and peer-to-peer
 * ------------------------------------------------------------------ */

export interface Appeal {
  id: string;
  tenantId: TenantId;
  requestId: string;
  decisionId: string;
  level: 1 | 2 | 3;
  /** Level 3 is external / independent review. */
  levelLabel: "First-level appeal" | "Second-level appeal" | "External review";
  status: "draft" | "submitted" | "under-review" | "upheld" | "overturned" | "withdrawn";
  filedAt?: string;
  dueAt: string;
  /** The licensed person who approved filing. */
  approvedByUserId?: string;
  /** Argument assembled by the agent, reviewed by a human. */
  argument: string;
  /** Evidence added since the original submission. */
  additionalDocumentIds: string[];
  outcome?: {
    decidedAt: string;
    result: "upheld" | "overturned" | "partially-overturned";
    rationale: string;
  };
  peerToPeerId?: string;
}

export interface PeerToPeer {
  id: string;
  tenantId: TenantId;
  requestId: string;
  status: "requested" | "scheduled" | "completed" | "cancelled";
  requestedAt: string;
  scheduledAt?: string;
  durationMinutes?: number;
  /** The ordering or reviewing clinician on our side. */
  providerUserId: string;
  /** The payer's medical director. */
  payerReviewerName?: string;
  /** Slots the payer offered. */
  offeredSlots: string[];
  outcome?: "approved" | "upheld" | "resubmit" | "no-decision";
  notes?: string;
}

/* ------------------------------------------------------------------ *
 * Communication / RFI
 * ------------------------------------------------------------------ */

/**
 * FHIR: Communication / CommunicationRequest, or a Da Vinci CDex Task for
 * the additional-information loop on a pended request.
 */
export interface Communication {
  id: string;
  tenantId: TenantId;
  requestId: string;
  kind: "rfi" | "note" | "status-update" | "payer-message" | "p2p-offer";
  direction: "payer-to-provider" | "provider-to-payer" | "internal";
  sentAt: string;
  sender: string;
  subject: string;
  body: string;
  /** For an RFI: exactly what the payer asked for. */
  requestedItems?: MissingItem[];
  /** Response deadline the payer set. */
  dueAt?: string;
  status: "open" | "responded" | "closed";
  respondedAt?: string;
  attachmentIds: string[];
}
