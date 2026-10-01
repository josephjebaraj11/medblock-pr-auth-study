/**
 * Core demographic, organisational and coverage entities.
 *
 * Every entity carries `tenantId` because the production design is pooled
 * multi-tenancy with PostgreSQL row-level security (blueprint v2 ADR-007).
 * Carrying it in the prototype keeps the mock service layer honest: a service
 * call that forgets to scope by tenant is visible here, not in production.
 *
 * FHIR mappings are recorded in docs/02-data-models.md. Where a field maps to
 * a specific FHIR element it is noted inline.
 */

/** Discriminator used across the app for per-tenant scoping. */
export type TenantId = string;

/** PHI sensitivity class, mirroring the blueprint's entity catalog (§14.2). */
export type Sensitivity = "phi" | "config" | "secret-ref";

export type DeploymentMode = "multi-tenant" | "dedicated" | "air-gapped";

export interface Tenant {
  id: TenantId;
  name: string;
  /** Provider organisations run the platform; payers are counterparties. */
  kind: "provider" | "payer";
  tier: "starter" | "growth" | "scale" | "enterprise";
  deploymentMode: DeploymentMode;
  region: string;
  /** Tenant-wide automation posture. See PolicyConfig for the detail. */
  status: "active" | "onboarding" | "suspended";
  createdAt: string;
}

/** FHIR: Organization */
export interface Organization {
  id: string;
  tenantId: TenantId;
  name: string;
  /** Type 2 (organisational) NPI. */
  npi: string;
  taxId: string;
  type: "practice" | "hospital" | "imaging-center" | "rehab" | "payer";
  address: Address;
  phone: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

/** FHIR: Practitioner (+ PractitionerRole for the specialty/org link). */
export interface Provider {
  id: string;
  tenantId: TenantId;
  organizationId: string;
  firstName: string;
  lastName: string;
  credential: string;
  /** Type 1 (individual) NPI. */
  npi: string;
  specialty: string;
  /** Licensed clinicians may act as clinical reviewers; others may not. */
  isLicensedReviewer: boolean;
}

/**
 * FHIR: Patient.
 *
 * All records in this prototype are synthetic. Names, MRNs, member IDs and
 * dates of birth are invented and must never be replaced with real data.
 */
export interface Patient {
  id: string;
  tenantId: TenantId;
  mrn: string;
  firstName: string;
  lastName: string;
  /** ISO date. */
  dateOfBirth: string;
  sex: "male" | "female" | "other" | "unknown";
  phone: string;
  email?: string;
  address: Address;
  /** Source system identifiers, so the same person can be matched across EHRs. */
  sourceIds: { system: string; value: string }[];
}

/** FHIR: Organization (payer role) — the insurer itself. */
export interface Payer {
  id: string;
  name: string;
  /** X12 payer identifier used for EDI routing. */
  payerIdX12: string;
  /**
   * Regulatory position under CMS-0057-F. Drives which APIs a payer is
   * obliged to expose by 1 Jan 2027, and whether the 72h/7d decision
   * timeframes already apply. (blueprint v2 §12.1)
   */
  regulatoryCategory:
    | "medicare-advantage"
    | "medicaid-managed-care"
    | "qhp-ffe"
    | "commercial"
    | "medicare-ffs";
  cms0057Impacted: boolean;
  /** Which Da Vinci / EDI capabilities this payer actually supports today. */
  capabilities: PayerCapabilities;
  /** Whether an automated caller may identify itself on payer phone lines. */
  automatedCallerPermitted: boolean;
  portalUrl?: string;
  phone: string;
  logoInitials: string;
  /** Tailwind token name used for the payer chip, so colour stays consistent. */
  accent: "brand" | "aqua" | "accent" | "signal" | "ink";
}

/**
 * A payer's real capability surface. The submission waterfall degrades
 * through these in order, recording which branch it took on every case
 * (blueprint v2 §12.4 — "never default to 'not required'").
 */
export interface PayerCapabilities {
  crd: boolean;
  dtr: boolean;
  pas: boolean;
  cdex: boolean;
  x12_278: boolean;
  portal: boolean;
  /** Fax is a human-assisted last resort, never automated. */
  fax: boolean;
  /** Current Da Vinci IG version the payer negotiates, where applicable. */
  igVersion?: string;
}

/** FHIR: InsurancePlan */
export interface PayerPlan {
  id: string;
  payerId: string;
  name: string;
  productLine: "HMO" | "PPO" | "EPO" | "POS" | "Medicare Advantage" | "Medicaid";
  /** Group number as printed on the member card. */
  groupNumber: string;
}

/** FHIR: Coverage */
export interface Coverage {
  id: string;
  tenantId: TenantId;
  patientId: string;
  payerId: string;
  planId: string;
  memberId: string;
  /** Subscriber relationship when the patient is not the subscriber. */
  relationship: "self" | "spouse" | "child" | "other";
  status: "active" | "inactive" | "terminated" | "unknown";
  periodStart: string;
  periodEnd?: string;
  /** When eligibility was last confirmed, and by which transaction. */
  verifiedAt?: string;
  verificationRef?: string;
  /** Payer order where more than one coverage exists. */
  order: number;
}
