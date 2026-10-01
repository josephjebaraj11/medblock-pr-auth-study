/**
 * The 28 synthetic prior-authorization requests the prototype runs on,
 * spread across every status in the lifecycle.
 *
 * Hero cases (1039, 1044, 1047, 1052, 1055, 1058, 1061) are hand-built with
 * full supporting material — AI assessment, documents, attempts, decisions —
 * because the demo script walks through them. The remainder are generated
 * with varied but plausible values so queues, filters and KPIs have real
 * breadth to work with.
 */

import type {
  Diagnosis,
  PaStatus,
  PriorAuthRequest,
  ServiceLine,
  SubmissionAttempt,
  Urgency,
} from "@/types";
import { PROVIDER_TENANT, coverages, patients } from "./core";

/** Fixed clock so the prototype renders identically on every load. */
export const NOW = new Date("2026-10-01T14:00:00Z");

const iso = (d: Date) => d.toISOString();
const hoursFromNow = (h: number) => iso(new Date(NOW.getTime() + h * 3_600_000));
const daysAgo = (d: number) => iso(new Date(NOW.getTime() - d * 86_400_000));
const hoursAgo = (h: number) => iso(new Date(NOW.getTime() - h * 3_600_000));

/* ------------------------------------------------------------------ *
 * Catalog of services and diagnoses used across the fixtures
 * ------------------------------------------------------------------ */

export const SERVICE_CATALOG: Record<
  string,
  { display: string; system: "CPT" | "HCPCS"; unit: ServiceLine["unit"] }
> = {
  "72148": { display: "MRI lumbar spine without contrast", system: "CPT", unit: "units" },
  "72149": { display: "MRI lumbar spine with contrast", system: "CPT", unit: "units" },
  "72141": { display: "MRI cervical spine without contrast", system: "CPT", unit: "units" },
  "72158": { display: "MRI lumbar spine with and without contrast", system: "CPT", unit: "units" },
  "27447": { display: "Total knee arthroplasty", system: "CPT", unit: "units" },
  "29881": { display: "Knee arthroscopy with meniscectomy", system: "CPT", unit: "units" },
  "63030": { display: "Lumbar laminotomy, single interspace", system: "CPT", unit: "units" },
  "64483": { display: "Transforaminal epidural injection, lumbar", system: "CPT", unit: "units" },
  "97161": { display: "Physical therapy evaluation, low complexity", system: "CPT", unit: "visits" },
  "97110": { display: "Therapeutic exercise, each 15 minutes", system: "CPT", unit: "sessions" },
  E0730: { display: "TENS unit, four lead", system: "HCPCS", unit: "units" },
  E0744: { display: "Neuromuscular stimulator", system: "HCPCS", unit: "units" },
  "20610": { display: "Arthrocentesis, major joint", system: "CPT", unit: "units" },
  "73721": { display: "MRI lower extremity joint without contrast", system: "CPT", unit: "units" },
};

export const DIAGNOSIS_CATALOG: Record<string, string> = {
  "M54.16": "Radiculopathy, lumbar region",
  "M54.5": "Low back pain",
  "M51.26": "Other intervertebral disc displacement, lumbar region",
  "M47.816": "Spondylosis without myelopathy or radiculopathy, lumbar region",
  "M54.12": "Radiculopathy, cervical region",
  "M17.11": "Unilateral primary osteoarthritis, right knee",
  "M17.12": "Unilateral primary osteoarthritis, left knee",
  "M23.221": "Derangement of posterior horn of medial meniscus, right knee",
  "G89.29": "Other chronic pain",
  "M79.604": "Pain in right leg",
  "M48.061": "Spinal stenosis, lumbar region without neurogenic claudication",
};

const svc = (
  id: string,
  code: string,
  opts: Partial<ServiceLine> = {},
): ServiceLine => {
  const meta = SERVICE_CATALOG[code];
  return {
    id,
    code,
    codeSystem: meta.system,
    display: meta.display,
    placeOfService: "11",
    quantity: 1,
    unit: meta.unit,
    startDate: "2026-10-14",
    diagnosisIds: [],
    ...opts,
  };
};

const dx = (id: string, code: string, rank = 1): Diagnosis => ({
  id,
  code,
  display: DIAGNOSIS_CATALOG[code],
  rank,
});

/* ------------------------------------------------------------------ *
 * Hero cases
 * ------------------------------------------------------------------ */

const heroRequests: PriorAuthRequest[] = [
  /* ---- NA-1047 · clinical review: six weeks of therapy not evidenced ---- */
  {
    id: "req-1047",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1047",
    patientId: "pat-002",
    coverageId: "cvg-002",
    payerId: "pay-meridian",
    orderingProviderId: "prv-okafor",
    renderingProviderId: "prv-whitfield",
    organizationId: "org-northside",
    status: "clinical-review",
    urgency: "standard",
    serviceLines: [svc("sl-1047-1", "72148", { diagnosisIds: ["dx-1047-1", "dx-1047-2"], startDate: "2026-10-12" })],
    diagnoses: [dx("dx-1047-1", "M54.16", 1), dx("dx-1047-2", "M51.26", 2)],
    documentIds: ["doc-001", "doc-002", "doc-003", "doc-004"],
    paRequired: true,
    requirementSource: "crd",
    requirementRef: "CRD-MRDN-8841027",
    requirementCheckedAt: daysAgo(3),
    ruleVersion: "MH-RAD-0412 v4.2",
    aiAssessmentId: "ai-1047",
    attempts: [],
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(5),
    scheduledServiceDate: "2026-10-12",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5521:72148`,
    version: 4,
    notes: "Agent could not evidence six weeks of conservative therapy in the chart.",
  },

  /* ---- NA-1039 · denied, first-level appeal filed ---- */
  {
    id: "req-1039",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1039",
    patientId: "pat-003",
    coverageId: "cvg-003",
    payerId: "pay-atlas",
    orderingProviderId: "prv-okafor",
    organizationId: "org-northside",
    status: "appealed",
    urgency: "standard",
    serviceLines: [svc("sl-1039-1", "72148", { diagnosisIds: ["dx-1039-1"], startDate: "2026-09-20" })],
    diagnoses: [dx("dx-1039-1", "M54.16", 1), dx("dx-1039-2", "M54.5", 2)],
    documentIds: ["doc-010", "doc-011", "doc-012", "doc-013", "doc-014", "doc-015"],
    paRequired: true,
    requirementSource: "x12-278-inquiry",
    requirementRef: "278-ATLS-4471209",
    requirementCheckedAt: daysAgo(29),
    ruleVersion: "AM-IMG-221 v2.6",
    aiAssessmentId: "ai-1039",
    decisionId: "dec-1039",
    attempts: [
      {
        id: "att-1039-1",
        requestId: "req-1039",
        channel: "electronic",
        connectorId: "con-availity-x12",
        startedAt: daysAgo(29),
        endedAt: daysAgo(29),
        outcome: "succeeded",
        externalRef: "278-ATLS-4471209",
      },
      {
        id: "att-1039-2",
        requestId: "req-1039",
        channel: "portal",
        connectorId: "con-portal-rpa",
        startedAt: daysAgo(28),
        endedAt: daysAgo(28),
        outcome: "succeeded",
        externalRef: "ATLS-PRTL-990214",
      },
    ],
    createdAt: daysAgo(29),
    updatedAt: daysAgo(6),
    submittedAt: daysAgo(28),
    decisionDueAt: daysAgo(21),
    scheduledServiceDate: "2026-10-20",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5488:72148`,
    version: 11,
  },

  /* ---- NA-1052 · pended, payer asked for one more document ---- */
  {
    id: "req-1052",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1052",
    patientId: "pat-004",
    coverageId: "cvg-004",
    payerId: "pay-granite",
    orderingProviderId: "prv-lindqvist",
    organizationId: "org-northside",
    status: "pended",
    urgency: "standard",
    serviceLines: [svc("sl-1052-1", "72148", { diagnosisIds: ["dx-1052-1"], startDate: "2026-10-18" })],
    diagnoses: [dx("dx-1052-1", "M48.061", 1)],
    documentIds: ["doc-020", "doc-021", "doc-022"],
    paRequired: true,
    requirementSource: "crd",
    requirementRef: "CRD-GSB-7741028",
    requirementCheckedAt: daysAgo(5),
    ruleVersion: "GSB-RAD-108 v2.0",
    aiAssessmentId: "ai-1052",
    attempts: [
      {
        id: "att-1052-1",
        requestId: "req-1052",
        channel: "electronic",
        connectorId: "con-granite-pas",
        startedAt: daysAgo(5),
        endedAt: daysAgo(5),
        outcome: "pended",
        externalRef: "GSB-PAS-3310771",
      },
    ],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    submittedAt: daysAgo(5),
    decisionDueAt: hoursFromNow(38),
    scheduledServiceDate: "2026-10-18",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5602:72148`,
    version: 7,
  },

  /* ---- NA-1044 · approved, but lapses before the procedure date ---- */
  {
    id: "req-1044",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1044",
    patientId: "pat-006",
    coverageId: "cvg-006",
    payerId: "pay-meridian",
    orderingProviderId: "prv-okafor",
    organizationId: "org-northside",
    status: "approved",
    urgency: "standard",
    serviceLines: [svc("sl-1044-1", "27447", { diagnosisIds: ["dx-1044-1"], startDate: "2026-10-22", placeOfService: "22" })],
    diagnoses: [dx("dx-1044-1", "M17.11", 1)],
    documentIds: ["doc-030", "doc-031", "doc-032", "doc-033"],
    paRequired: true,
    requirementSource: "crd",
    requirementRef: "CRD-MRDN-8841301",
    requirementCheckedAt: daysAgo(42),
    ruleVersion: "MH-ORT-220 v3.0",
    aiAssessmentId: "ai-1044",
    decisionId: "dec-1044",
    attempts: [
      {
        id: "att-1044-1",
        requestId: "req-1044",
        channel: "electronic",
        connectorId: "con-meridian-pas",
        startedAt: daysAgo(42),
        endedAt: daysAgo(42),
        outcome: "succeeded",
        externalRef: "MRDN-PAS-5520118",
      },
    ],
    createdAt: daysAgo(42),
    updatedAt: daysAgo(40),
    submittedAt: daysAgo(42),
    decisionDueAt: daysAgo(35),
    scheduledServiceDate: "2026-10-22",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5390:27447`,
    version: 6,
  },

  /* ---- NA-1055 · sitting in the Meridian payer queue ---- */
  {
    id: "req-1055",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1055",
    patientId: "pat-005",
    coverageId: "cvg-005",
    payerId: "pay-atlas",
    orderingProviderId: "prv-rahman",
    organizationId: "org-northside",
    status: "in-review",
    urgency: "standard",
    serviceLines: [svc("sl-1055-1", "72148", { diagnosisIds: ["dx-1055-1"], startDate: "2026-10-16" })],
    diagnoses: [dx("dx-1055-1", "M54.16", 1)],
    documentIds: ["doc-040", "doc-041", "doc-042"],
    paRequired: true,
    requirementSource: "x12-278-inquiry",
    requirementRef: "278-ATLS-4471880",
    requirementCheckedAt: daysAgo(1),
    ruleVersion: "AM-IMG-221 v2.6",
    aiAssessmentId: "ai-1055",
    attempts: [
      {
        id: "att-1055-1",
        requestId: "req-1055",
        channel: "electronic",
        connectorId: "con-availity-x12",
        startedAt: daysAgo(1),
        endedAt: daysAgo(1),
        outcome: "succeeded",
        externalRef: "ATLS-278-5520994",
      },
    ],
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(20),
    submittedAt: daysAgo(1),
    decisionDueAt: hoursFromNow(144),
    scheduledServiceDate: "2026-10-16",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5640:72148`,
    version: 3,
  },

  /* ---- NA-1058 · partially approved: fewer units than requested ---- */
  {
    id: "req-1058",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1058",
    patientId: "pat-009",
    coverageId: "cvg-009",
    payerId: "pay-meridian",
    orderingProviderId: "prv-rahman",
    organizationId: "org-northside",
    status: "partially-approved",
    urgency: "standard",
    serviceLines: [
      svc("sl-1058-1", "E0730", {
        diagnosisIds: ["dx-1058-1"],
        quantity: 1,
        startDate: "2026-10-01",
        decision: { outcome: "modified", approvedQuantity: 1, reasonCode: "W2", note: "Approved for a 90-day rental rather than purchase." },
      }),
    ],
    diagnoses: [dx("dx-1058-1", "G89.29", 1)],
    documentIds: ["doc-050", "doc-051", "doc-052"],
    paRequired: true,
    requirementSource: "payer-matrix",
    requirementRef: "MTX-MRDN-DME-0077",
    requirementCheckedAt: daysAgo(16),
    ruleVersion: "MH-DME-077 v1.8",
    aiAssessmentId: "ai-1058",
    decisionId: "dec-1058",
    attempts: [
      {
        id: "att-1058-1",
        requestId: "req-1058",
        channel: "electronic",
        connectorId: "con-meridian-pas",
        startedAt: daysAgo(16),
        endedAt: daysAgo(16),
        outcome: "succeeded",
        externalRef: "MRDN-PAS-5521440",
      },
    ],
    createdAt: daysAgo(16),
    updatedAt: daysAgo(12),
    submittedAt: daysAgo(16),
    decisionDueAt: daysAgo(9),
    scheduledServiceDate: "2026-10-05",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5571:E0730`,
    version: 5,
  },

  /* ---- NA-1061 · denied, peer-to-peer scheduled ---- */
  {
    id: "req-1061",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1061",
    patientId: "pat-008",
    coverageId: "cvg-008",
    payerId: "pay-caldera",
    orderingProviderId: "prv-lindqvist",
    organizationId: "org-northside",
    status: "peer-to-peer",
    urgency: "expedited",
    serviceLines: [svc("sl-1061-1", "72141", { diagnosisIds: ["dx-1061-1"], startDate: "2026-10-08" })],
    diagnoses: [dx("dx-1061-1", "M54.12", 1)],
    documentIds: ["doc-060", "doc-061", "doc-062"],
    paRequired: true,
    requirementSource: "portal-lookup",
    requirementRef: "CLDR-PRTL-118029",
    requirementCheckedAt: daysAgo(21),
    ruleVersion: "CM-RAD-044 v2.1",
    aiAssessmentId: "ai-1061",
    decisionId: "dec-1061",
    attempts: [
      {
        id: "att-1061-1",
        requestId: "req-1061",
        channel: "electronic",
        connectorId: "con-availity-x12",
        startedAt: daysAgo(21),
        endedAt: daysAgo(21),
        outcome: "failed",
        errorCode: "not_supported",
        errorMessage: "Payer does not accept 278 for this service category.",
      },
      {
        id: "att-1061-2",
        requestId: "req-1061",
        channel: "portal",
        connectorId: "con-portal-rpa",
        startedAt: daysAgo(21),
        endedAt: daysAgo(21),
        outcome: "succeeded",
        externalRef: "CLDR-PRTL-118029",
      },
    ],
    createdAt: daysAgo(21),
    updatedAt: daysAgo(3),
    submittedAt: daysAgo(21),
    decisionDueAt: daysAgo(18),
    scheduledServiceDate: "2026-10-08",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5530:72141`,
    version: 9,
  },

  /* ---- NA-1063 · evidenced "no PA required" ---- */
  {
    id: "req-1063",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1063",
    patientId: "pat-014",
    coverageId: "cvg-014",
    payerId: "pay-meridian",
    orderingProviderId: "prv-lindqvist",
    organizationId: "org-northside",
    status: "no-auth-required",
    urgency: "standard",
    serviceLines: [svc("sl-1063-1", "97161", { diagnosisIds: ["dx-1063-1"], quantity: 1, startDate: "2026-10-06" })],
    diagnoses: [dx("dx-1063-1", "M54.5", 1)],
    documentIds: [],
    paRequired: false,
    requirementSource: "crd",
    requirementRef: "CRD-MRDN-8841455",
    requirementCheckedAt: hoursAgo(26),
    ruleVersion: "MH-REH-030 v2.2",
    attempts: [],
    createdAt: hoursAgo(26),
    updatedAt: hoursAgo(26),
    scheduledServiceDate: "2026-10-06",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5655:97161`,
    version: 2,
    notes: "Meridian CRD returned 'no prior authorization required'. Logged with source and reference, written back to the chart.",
  },

  /* ---- NA-1065 · held by the automation gate (payer in Shadow) ---- */
  {
    id: "req-1065",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1065",
    patientId: "pat-011",
    coverageId: "cvg-011",
    payerId: "pay-caldera",
    orderingProviderId: "prv-castellanos",
    organizationId: "org-northside",
    status: "needs-approval",
    urgency: "standard",
    serviceLines: [svc("sl-1065-1", "E0730", { diagnosisIds: ["dx-1065-1"], startDate: "2026-10-09" })],
    diagnoses: [dx("dx-1065-1", "G89.29", 1)],
    documentIds: [],
    paRequired: true,
    requirementSource: "payer-matrix",
    requirementRef: "MTX-CLDR-DME-0077",
    requirementCheckedAt: hoursAgo(9),
    ruleVersion: "CM-DME-077 v1.8",
    aiAssessmentId: "ai-1065",
    attempts: [],
    createdAt: hoursAgo(9),
    updatedAt: hoursAgo(9),
    scheduledServiceDate: "2026-10-09",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5661:E0730`,
    version: 2,
    notes: "Caldera is in Shadow mode. Every submission waits for a human release.",
  },

  /* ---- NA-1066 · draft, started but not finished ---- */
  {
    id: "req-1066",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1066",
    patientId: "pat-012",
    coverageId: "cvg-012",
    payerId: "pay-atlas",
    orderingProviderId: "prv-okafor",
    organizationId: "org-northside",
    status: "draft",
    urgency: "standard",
    serviceLines: [svc("sl-1066-1", "29881", { diagnosisIds: ["dx-1066-1"], startDate: "2026-10-28", placeOfService: "22" })],
    diagnoses: [dx("dx-1066-1", "M23.221", 1)],
    documentIds: [],
    attempts: [],
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
    idempotencyKey: `${PROVIDER_TENANT}:ord-5668:29881`,
    version: 1,
  },

  /* ---- NA-1067 · coverage terminated, administrative exception ---- */
  {
    id: "req-1067",
    tenantId: PROVIDER_TENANT,
    caseNumber: "NA-1067",
    patientId: "pat-003",
    coverageId: "cvg-003",
    payerId: "pay-atlas",
    orderingProviderId: "prv-rahman",
    organizationId: "org-northside",
    status: "eligibility-check",
    urgency: "standard",
    serviceLines: [svc("sl-1067-1", "64483", { diagnosisIds: ["dx-1067-1"], startDate: "2026-10-15" })],
    diagnoses: [dx("dx-1067-1", "M54.16", 1)],
    documentIds: [],
    attempts: [],
    createdAt: hoursAgo(7),
    updatedAt: hoursAgo(7),
    scheduledServiceDate: "2026-10-15",
    idempotencyKey: `${PROVIDER_TENANT}:ord-5670:64483`,
    version: 2,
    notes: "271 returned coverage terminated 31 Aug 2026. Needs an updated member ID before the case can move.",
  },
];

/* ------------------------------------------------------------------ *
 * Generated breadth
 * ------------------------------------------------------------------ */

type Spec = {
  n: number;
  patient: number;
  payer: string;
  code: string;
  dxCode: string;
  status: PaStatus;
  createdDaysAgo: number;
  urgency?: Urgency;
  provider?: string;
  channel?: SubmissionAttempt["channel"];
  connectorId?: string;
};

const specs: Spec[] = [
  { n: 1040, patient: 7, payer: "pay-pinnacle", code: "73721", dxCode: "M79.604", status: "approved", createdDaysAgo: 34, channel: "portal", connectorId: "con-portal-rpa" },
  { n: 1041, patient: 10, payer: "pay-granite", code: "27447", dxCode: "M17.12", status: "approved", createdDaysAgo: 31, channel: "electronic", connectorId: "con-granite-pas" },
  { n: 1042, patient: 13, payer: "pay-pinnacle", code: "64483", dxCode: "M54.16", status: "denied", createdDaysAgo: 30, channel: "voice", connectorId: "con-voice" },
  { n: 1043, patient: 15, payer: "pay-granite", code: "72148", dxCode: "M51.26", status: "approved", createdDaysAgo: 27, channel: "electronic", connectorId: "con-granite-pas" },
  { n: 1045, patient: 1, payer: "pay-meridian", code: "64483", dxCode: "M54.16", status: "approved", createdDaysAgo: 24, channel: "electronic", connectorId: "con-meridian-pas" },
  { n: 1046, patient: 12, payer: "pay-atlas", code: "20610", dxCode: "M17.11", status: "approved", createdDaysAgo: 22, channel: "portal", connectorId: "con-portal-rpa" },
  { n: 1048, patient: 9, payer: "pay-meridian", code: "72148", dxCode: "M48.061", status: "denied", createdDaysAgo: 19, provider: "prv-okafor", channel: "electronic", connectorId: "con-meridian-pas" },
  { n: 1049, patient: 5, payer: "pay-atlas", code: "63030", dxCode: "M51.26", status: "approved", createdDaysAgo: 18, channel: "voice", connectorId: "con-voice" },
  { n: 1050, patient: 11, payer: "pay-caldera", code: "97110", dxCode: "M54.5", status: "approved", createdDaysAgo: 17, channel: "portal", connectorId: "con-portal-rpa" },
  { n: 1051, patient: 14, payer: "pay-meridian", code: "72141", dxCode: "M54.12", status: "approved", createdDaysAgo: 15, channel: "electronic", connectorId: "con-meridian-pas" },
  { n: 1053, patient: 2, payer: "pay-meridian", code: "64483", dxCode: "M54.16", status: "in-review", createdDaysAgo: 4, channel: "electronic", connectorId: "con-meridian-pas" },
  { n: 1054, patient: 6, payer: "pay-meridian", code: "73721", dxCode: "M17.11", status: "submitted", createdDaysAgo: 3, channel: "electronic", connectorId: "con-meridian-pas" },
  { n: 1056, patient: 4, payer: "pay-granite", code: "29881", dxCode: "M23.221", status: "in-review", createdDaysAgo: 2, channel: "electronic", connectorId: "con-granite-pas" },
  { n: 1057, patient: 10, payer: "pay-meridian", code: "72148", dxCode: "M54.16", status: "in-review", createdDaysAgo: 2, urgency: "expedited", channel: "electronic", connectorId: "con-meridian-pas" },
  { n: 1059, patient: 15, payer: "pay-meridian", code: "27447", dxCode: "M17.12", status: "submitted", createdDaysAgo: 1, channel: "electronic", connectorId: "con-meridian-pas" },
  { n: 1060, patient: 7, payer: "pay-atlas", code: "72149", dxCode: "M51.26", status: "clinical-review", createdDaysAgo: 2 },
  { n: 1062, patient: 13, payer: "pay-granite", code: "64483", dxCode: "M54.16", status: "documentation", createdDaysAgo: 1 },
  { n: 1064, patient: 1, payer: "pay-meridian", code: "97161", dxCode: "M54.5", status: "no-auth-required", createdDaysAgo: 1 },
  { n: 1068, patient: 8, payer: "pay-caldera", code: "72148", dxCode: "M54.16", status: "requirement-check", createdDaysAgo: 0 },
  { n: 1069, patient: 12, payer: "pay-meridian", code: "63030", dxCode: "M48.061", status: "in-review", createdDaysAgo: 5, urgency: "expedited", channel: "electronic", connectorId: "con-meridian-pas" },
  { n: 1070, patient: 11, payer: "pay-pinnacle", code: "72141", dxCode: "M54.12", status: "withdrawn", createdDaysAgo: 12, channel: "portal", connectorId: "con-portal-rpa" },
];

const providerRotation = ["prv-okafor", "prv-lindqvist", "prv-rahman", "prv-castellanos"];

const generated: PriorAuthRequest[] = specs.map((s, i) => {
  const patient = patients[s.patient - 1];
  const coverage = coverages.find((c) => c.patientId === patient.id)!;
  const urgency = s.urgency ?? "standard";
  const submittedStatuses: PaStatus[] = [
    "submitted",
    "in-review",
    "pended",
    "approved",
    "partially-approved",
    "denied",
    "appealed",
    "peer-to-peer",
    "withdrawn",
  ];
  const wasSubmitted = submittedStatuses.includes(s.status);
  const decisionHours = urgency === "expedited" ? 72 : 168;

  const attempts: SubmissionAttempt[] =
    wasSubmitted && s.channel && s.connectorId
      ? [
          {
            id: `att-${s.n}-1`,
            requestId: `req-${s.n}`,
            channel: s.channel,
            connectorId: s.connectorId,
            startedAt: daysAgo(s.createdDaysAgo),
            endedAt: daysAgo(s.createdDaysAgo),
            outcome: "succeeded",
            externalRef: `REF-${s.n}-${(s.n * 7919) % 100000}`,
          },
        ]
      : [];

  const decided = ["approved", "partially-approved", "denied", "appealed"].includes(s.status);

  return {
    id: `req-${s.n}`,
    tenantId: PROVIDER_TENANT,
    caseNumber: `NA-${s.n}`,
    patientId: patient.id,
    coverageId: coverage.id,
    payerId: s.payer,
    orderingProviderId: s.provider ?? providerRotation[i % providerRotation.length],
    organizationId: "org-northside",
    status: s.status,
    urgency,
    serviceLines: [
      svc(`sl-${s.n}-1`, s.code, {
        diagnosisIds: [`dx-${s.n}-1`],
        startDate: iso(new Date(NOW.getTime() + (14 - s.createdDaysAgo) * 86_400_000)).slice(0, 10),
      }),
    ],
    diagnoses: [dx(`dx-${s.n}-1`, s.dxCode, 1)],
    documentIds: [],
    paRequired: s.status === "no-auth-required" ? false : true,
    requirementSource: s.payer === "pay-meridian" || s.payer === "pay-granite" ? "crd" : "x12-278-inquiry",
    requirementRef: `REQ-${s.n}-${(s.n * 104729) % 1000000}`,
    requirementCheckedAt: daysAgo(s.createdDaysAgo),
    ruleVersion: "synthetic v1.0",
    aiAssessmentId: undefined,
    decisionId: decided ? `dec-${s.n}` : undefined,
    attempts,
    createdAt: daysAgo(s.createdDaysAgo),
    updatedAt: daysAgo(Math.max(0, s.createdDaysAgo - 1)),
    submittedAt: wasSubmitted ? daysAgo(s.createdDaysAgo) : undefined,
    decisionDueAt: wasSubmitted
      ? iso(new Date(NOW.getTime() - s.createdDaysAgo * 86_400_000 + decisionHours * 3_600_000))
      : undefined,
    scheduledServiceDate: iso(
      new Date(NOW.getTime() + (14 - s.createdDaysAgo) * 86_400_000),
    ).slice(0, 10),
    idempotencyKey: `${PROVIDER_TENANT}:ord-${5300 + s.n}:${s.code}`,
    version: 2 + (i % 6),
  };
});

export const priorAuthRequests: PriorAuthRequest[] = [...heroRequests, ...generated].sort(
  (a, b) => (a.caseNumber < b.caseNumber ? 1 : -1),
);
