/**
 * AI assessments, decisions, appeals, peer-to-peer records and the RFI loop.
 *
 * Two things to notice in the shapes below:
 *
 * - No `AIAssessment` recommends a denial. The three recommendations are
 *   submit, gather more, or escalate to a licensed human. That is the
 *   boundary the source material states more often than any other.
 * - Every `Decision` whose outcome is a denial or partial approval carries a
 *   named `decidedByUserId`. A denial with no human attached is not
 *   representable here, by design.
 */

import type {
  AIAssessment,
  Appeal,
  Communication,
  Decision,
  PeerToPeer,
  QuestionnaireResponse,
} from "@/types";
import { PROVIDER_TENANT } from "./core";
import { NOW } from "./requests";

const iso = (d: Date) => d.toISOString();
const daysAgo = (d: number) => iso(new Date(NOW.getTime() - d * 86_400_000));
const hoursAgo = (h: number) => iso(new Date(NOW.getTime() - h * 3_600_000));
const daysAhead = (d: number) => iso(new Date(NOW.getTime() + d * 86_400_000));

const MODEL = "nexauth-extract-2026.09";
const PROMPT = "pa-extract/v7";

/* ------------------------------------------------------------------ *
 * AI assessments
 * ------------------------------------------------------------------ */

export const aiAssessments: AIAssessment[] = [
  /* ---- NA-1047 · the gap case. Agent found 4 weeks, policy wants 6 ---- */
  {
    id: "ai-1047",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1047",
    generatedAt: hoursAgo(6),
    modelVersion: MODEL,
    promptVersion: PROMPT,
    extractedFacts: [
      { id: "f-1047-1", label: "Presenting complaint", value: "Low back pain radiating to the left lower extremity", confidence: 0.97, sourceDocumentId: "doc-002", sourceSpan: "p.1 ¶2", category: "diagnosis" },
      { id: "f-1047-2", label: "Symptom duration", value: "11 weeks", confidence: 0.94, sourceDocumentId: "doc-003", sourceSpan: "p.1 ¶1", category: "history" },
      { id: "f-1047-3", label: "Conservative therapy documented", value: "Physical therapy, 4 weeks (8 visits, 14 Aug – 11 Sep 2026)", confidence: 0.88, sourceDocumentId: "doc-002", sourceSpan: "p.2 'Interval history'", category: "treatment" },
      { id: "f-1047-4", label: "Pharmacologic management", value: "Naproxen 500mg BID, cyclobenzaprine 10mg nightly", confidence: 0.96, sourceDocumentId: "doc-002", sourceSpan: "p.3 'Medications'", category: "treatment" },
      { id: "f-1047-5", label: "Neurological findings", value: "Diminished left Achilles reflex; 4/5 strength left plantarflexion", confidence: 0.91, sourceDocumentId: "doc-002", sourceSpan: "p.2 'Examination'", category: "measurement" },
      { id: "f-1047-6", label: "Prior imaging", value: "Lumbar radiograph 16 Aug 2026 — mild L4-L5 disc space narrowing", confidence: 0.99, sourceDocumentId: "doc-004", sourceSpan: "p.1 'Impression'", category: "imaging" },
      { id: "f-1047-7", label: "Red-flag indications", value: "None documented", confidence: 0.82, sourceDocumentId: "doc-002", sourceSpan: "p.2 'Review of systems'", category: "history" },
    ],
    criteriaMatches: [
      {
        criterionId: "c-mri-1",
        label: "Six weeks of conservative therapy",
        status: "not-met",
        confidence: 0.88,
        evidence: [{ documentId: "doc-002", span: "p.2 'Interval history'" }],
        note: "Four weeks of physical therapy are documented (8 visits). The policy requires six. Pharmacologic management runs concurrently and may count toward the requirement — that is a clinical judgement, not one the agent makes.",
      },
      {
        criterionId: "c-mri-2",
        label: "Persistent or progressive symptoms",
        status: "met",
        confidence: 0.95,
        evidence: [
          { documentId: "doc-003", span: "p.1 ¶1" },
          { documentId: "doc-002", span: "p.1 ¶2" },
        ],
        note: "Symptoms documented at two separate encounters six weeks apart, with reported progression.",
      },
      {
        criterionId: "c-mri-3",
        label: "Focal neurological findings",
        status: "met",
        confidence: 0.91,
        evidence: [{ documentId: "doc-002", span: "p.2 'Examination'" }],
        note: "Diminished left Achilles reflex and 4/5 plantarflexion strength are documented.",
      },
      {
        criterionId: "c-mri-4",
        label: "Red-flag indication",
        status: "not-met",
        confidence: 0.82,
        evidence: [{ documentId: "doc-002", span: "p.2 'Review of systems'" }],
        note: "No red-flag indication found. Absence of documentation is not the same as absence of the finding — a clinician should confirm.",
      },
      {
        criterionId: "c-mri-5",
        label: "No recent equivalent imaging",
        status: "met",
        confidence: 0.99,
        evidence: [{ documentId: "doc-004", span: "p.1 'Impression'" }],
        note: "No lumbar MRI in the preceding 12 months. Radiograph only.",
      },
    ],
    missingDocuments: [],
    evidenceGaps: [
      {
        id: "gap-1047-1",
        label: "Two further weeks of conservative therapy, or a documented reason to waive it",
        reason: "Policy MH-RAD-0412 v4.2 requires six weeks; four are evidenced in the chart.",
        severity: "blocking",
        resolvableBy: "clinician",
      },
    ],
    confidence: {
      overall: 0.61,
      components: [
        { key: "rule-match", label: "Rule match", score: 1.0, weight: 0.2, explanation: "Exact payer + plan + CPT policy found (MH-RAD-0412 v4.2)." },
        { key: "packet-completeness", label: "Packet completeness", score: 0.75, weight: 0.25, explanation: "3 of 4 required document types present. Therapy notes cover 4 of the 6 required weeks." },
        { key: "extraction-certainty", label: "Extraction certainty", score: 0.82, weight: 0.2, explanation: "Lowest field confidence is 0.82 (red-flag absence, inferred from a negative review of systems)." },
        { key: "identity-match", label: "Identity match", score: 1.0, weight: 0.1, explanation: "Patient, member ID and ordering NPI agree across Epic and the 271 response." },
        { key: "route-reliability", label: "Route reliability", score: 0.99, weight: 0.1, explanation: "Meridian PAS has resolved 99.4% of submissions in the last 30 days." },
        { key: "prior-outcomes", label: "Prior outcomes", score: 0.0, weight: 0.15, explanation: "Lumbar MRI requests to Meridian with under six weeks of therapy were denied in 7 of the last 8 cases." },
      ],
    },
    recommendation: "escalate-clinical-review",
    rationale:
      "The packet satisfies four of five criteria. The conservative-therapy requirement is the one gap: four weeks of physical therapy are documented against a policy threshold of six. Whether concurrent pharmacologic management satisfies the intent of that criterion is a clinical judgement, so this case is routed to a licensed reviewer rather than submitted. Historically, submitting this payer short of six weeks has produced a denial.",
    draftLetter: {
      subject: "Medical necessity — MRI lumbar spine (CPT 72148), Sofia Marino",
      body: `To the Medical Director, Meridian Health Plan:

I am requesting prior authorization for an MRI of the lumbar spine without contrast (CPT 72148) for this 44-year-old member presenting with an 11-week history of low back pain radiating into the left lower extremity.

Conservative management to date comprises eight supervised physical therapy visits between 14 August and 11 September 2026, together with a concurrent course of naproxen 500mg twice daily and cyclobenzaprine 10mg nightly. Symptoms have persisted and progressed across two documented encounters six weeks apart.

Examination on 28 September 2026 documents a diminished left Achilles reflex and 4/5 strength on left plantarflexion, consistent with an L5-S1 radiculopathy. Plain radiographs obtained on 16 August 2026 demonstrate mild L4-L5 disc space narrowing but do not characterise the neural elements.

Advanced imaging is required to identify the level and nature of nerve root compression and to determine whether the member is a candidate for targeted injection or surgical decompression.

I am available for a peer-to-peer discussion at your convenience.`,
      citedFactIds: ["f-1047-1", "f-1047-2", "f-1047-3", "f-1047-4", "f-1047-5", "f-1047-6"],
      generatedAt: hoursAgo(6),
    },
  },

  /* ---- NA-1039 · the denied case the appeal is built on ---- */
  {
    id: "ai-1039",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1039",
    generatedAt: daysAgo(29),
    modelVersion: MODEL,
    promptVersion: "pa-extract/v6",
    extractedFacts: [
      { id: "f-1039-1", label: "Presenting complaint", value: "Chronic low back pain with right-sided radiculopathy", confidence: 0.96, sourceDocumentId: "doc-011", sourceSpan: "p.1 ¶1", category: "diagnosis" },
      { id: "f-1039-2", label: "Symptom duration", value: "7 months", confidence: 0.93, sourceDocumentId: "doc-011", sourceSpan: "p.1 ¶1", category: "history" },
      { id: "f-1039-3", label: "Conservative therapy documented", value: "Physical therapy, 12 visits (03 Jul – 22 Aug 2026)", confidence: 0.97, sourceDocumentId: "doc-013", sourceSpan: "Visit log, p.1–2", category: "treatment" },
      { id: "f-1039-4", label: "Plain radiographs", value: "Not located in the chart at time of submission", confidence: 0.71, sourceDocumentId: "doc-011", sourceSpan: "p.4 'Imaging'", category: "imaging" },
    ],
    criteriaMatches: [
      { criterionId: "c-amri-1", label: "Four weeks of conservative therapy", status: "met", confidence: 0.97, evidence: [{ documentId: "doc-013", span: "Visit log, p.1–2" }], note: "Twelve supervised visits across seven weeks — comfortably above the four-week threshold." },
      { criterionId: "c-amri-2", label: "Plain radiographs obtained", status: "unclear", confidence: 0.71, evidence: [{ documentId: "doc-011", span: "p.4 'Imaging'" }], note: "The note references radiographs but no report was retrievable from the chart at submission time." },
      { criterionId: "c-amri-3", label: "Functional limitation documented", status: "met", confidence: 0.89, evidence: [{ documentId: "doc-011", span: "p.2 'Functional status'" }], note: "Unable to sit for more than 20 minutes; modified duty at work." },
    ],
    missingDocuments: [
      { id: "miss-1039-1", label: "Plain radiograph report", reason: "Policy AM-IMG-221 requires radiographs to have been obtained and reviewed.", severity: "blocking", resolvableBy: "agent" },
    ],
    evidenceGaps: [],
    confidence: {
      overall: 0.68,
      components: [
        { key: "rule-match", label: "Rule match", score: 1.0, weight: 0.2, explanation: "Exact policy match (AM-IMG-221 v2.6)." },
        { key: "packet-completeness", label: "Packet completeness", score: 0.67, weight: 0.25, explanation: "2 of 3 required documents present; radiograph report missing." },
        { key: "extraction-certainty", label: "Extraction certainty", score: 0.71, weight: 0.2, explanation: "Radiograph existence inferred from a narrative reference only." },
        { key: "identity-match", label: "Identity match", score: 1.0, weight: 0.1, explanation: "Identifiers agree across sources." },
        { key: "route-reliability", label: "Route reliability", score: 0.42, weight: 0.1, explanation: "Atlas portal automation was failing at the time; case fell through to voice." },
        { key: "prior-outcomes", label: "Prior outcomes", score: 0.55, weight: 0.15, explanation: "Atlas approves roughly 55% of lumbar MRI requests from this practice on first pass." },
      ],
    },
    recommendation: "gather-more-documentation",
    rationale:
      "Conservative therapy is well evidenced, but the radiograph report the policy requires could not be retrieved from the chart. The agent recommended obtaining it before submitting. It was submitted without it.",
  },

  /* ---- NA-1052 · pended, awaiting one document ---- */
  {
    id: "ai-1052",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1052",
    generatedAt: daysAgo(5),
    modelVersion: MODEL,
    promptVersion: PROMPT,
    extractedFacts: [
      { id: "f-1052-1", label: "Presenting complaint", value: "Neurogenic claudication, bilateral lower extremities", confidence: 0.95, sourceDocumentId: "doc-021", sourceSpan: "p.1 ¶1", category: "diagnosis" },
      { id: "f-1052-2", label: "Walking tolerance", value: "Limited to approximately 100 metres", confidence: 0.92, sourceDocumentId: "doc-021", sourceSpan: "p.2 'Functional status'", category: "measurement" },
      { id: "f-1052-3", label: "Conservative therapy documented", value: "Physical therapy, 10 visits (Aug 2026)", confidence: 0.94, sourceDocumentId: "doc-022", sourceSpan: "Visit log", category: "treatment" },
    ],
    criteriaMatches: [
      { criterionId: "c-mri-1", label: "Six weeks of conservative therapy", status: "met", confidence: 0.94, evidence: [{ documentId: "doc-022", span: "Visit log" }], note: "Ten visits across seven weeks." },
      { criterionId: "c-mri-2", label: "Persistent or progressive symptoms", status: "met", confidence: 0.9, evidence: [{ documentId: "doc-021", span: "p.1 ¶1" }], note: "Documented progression in walking tolerance." },
    ],
    missingDocuments: [],
    evidenceGaps: [],
    confidence: {
      overall: 0.91,
      components: [
        { key: "rule-match", label: "Rule match", score: 1.0, weight: 0.2, explanation: "Exact policy match." },
        { key: "packet-completeness", label: "Packet completeness", score: 1.0, weight: 0.25, explanation: "All required documents present." },
        { key: "extraction-certainty", label: "Extraction certainty", score: 0.9, weight: 0.2, explanation: "Lowest field confidence 0.92." },
        { key: "identity-match", label: "Identity match", score: 1.0, weight: 0.1, explanation: "Identifiers agree." },
        { key: "route-reliability", label: "Route reliability", score: 0.96, weight: 0.1, explanation: "Granite PAS resolved 96% of submissions this month." },
        { key: "prior-outcomes", label: "Prior outcomes", score: 0.71, weight: 0.15, explanation: "Granite approves 71% of lumbar MRI requests on first pass." },
      ],
    },
    recommendation: "ready-to-submit",
    rationale:
      "All criteria the policy states are evidenced and every required document is attached. Confidence 0.91 clears the tenant threshold of 0.85, so the case auto-submitted via Granite PAS.",
  },

  /* ---- Lighter assessments for the remaining hero cases ---- */
  {
    id: "ai-1044",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1044",
    generatedAt: daysAgo(42),
    modelVersion: MODEL,
    promptVersion: "pa-extract/v6",
    extractedFacts: [
      { id: "f-1044-1", label: "Radiographic grade", value: "Kellgren-Lawrence grade 4, right knee", confidence: 0.96, sourceDocumentId: "doc-032", sourceSpan: "p.1 'Impression'", category: "imaging" },
      { id: "f-1044-2", label: "Conservative management", value: "14 weeks physical therapy; intra-articular corticosteroid ×2", confidence: 0.93, sourceDocumentId: "doc-033", sourceSpan: "Visit log", category: "treatment" },
      { id: "f-1044-3", label: "Functional limitation", value: "Unable to climb stairs without assistance; night pain", confidence: 0.91, sourceDocumentId: "doc-031", sourceSpan: "p.3", category: "history" },
    ],
    criteriaMatches: [
      { criterionId: "c-tka-1", label: "Radiographic evidence of advanced arthritis", status: "met", confidence: 0.96, evidence: [{ documentId: "doc-032", span: "p.1" }], note: "Grade 4 — above the grade 3 threshold." },
      { criterionId: "c-tka-2", label: "Three months of conservative management", status: "met", confidence: 0.93, evidence: [{ documentId: "doc-033", span: "Visit log" }], note: "14 weeks documented." },
      { criterionId: "c-tka-3", label: "Functional impairment documented", status: "met", confidence: 0.91, evidence: [{ documentId: "doc-031", span: "p.3" }], note: "Clear ADL impact documented." },
    ],
    missingDocuments: [],
    evidenceGaps: [],
    confidence: {
      overall: 0.94,
      components: [
        { key: "rule-match", label: "Rule match", score: 1.0, weight: 0.2, explanation: "Exact policy match." },
        { key: "packet-completeness", label: "Packet completeness", score: 1.0, weight: 0.25, explanation: "All four required documents present." },
        { key: "extraction-certainty", label: "Extraction certainty", score: 0.91, weight: 0.2, explanation: "Lowest field confidence 0.91." },
        { key: "identity-match", label: "Identity match", score: 1.0, weight: 0.1, explanation: "Identifiers agree." },
        { key: "route-reliability", label: "Route reliability", score: 0.99, weight: 0.1, explanation: "Meridian PAS stable." },
        { key: "prior-outcomes", label: "Prior outcomes", score: 0.82, weight: 0.15, explanation: "82% first-pass approval for TKA with this payer." },
      ],
    },
    recommendation: "ready-to-submit",
    rationale: "All criteria evidenced. Submitted electronically via Meridian PAS and approved within 48 hours.",
  },
  {
    id: "ai-1055",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1055",
    generatedAt: daysAgo(1),
    modelVersion: MODEL,
    promptVersion: PROMPT,
    extractedFacts: [
      { id: "f-1055-1", label: "Symptom duration", value: "14 weeks", confidence: 0.95, sourceDocumentId: "doc-041", sourceSpan: "p.1", category: "history" },
      { id: "f-1055-2", label: "Conservative therapy documented", value: "Physical therapy, 14 visits (Jul–Sep 2026)", confidence: 0.96, sourceDocumentId: "doc-042", sourceSpan: "Visit log", category: "treatment" },
      { id: "f-1055-3", label: "Neurological findings", value: "Positive straight-leg raise at 40° on the right", confidence: 0.93, sourceDocumentId: "doc-041", sourceSpan: "p.2 'Examination'", category: "measurement" },
    ],
    criteriaMatches: [
      { criterionId: "c-amri-1", label: "Four weeks of conservative therapy", status: "met", confidence: 0.96, evidence: [{ documentId: "doc-042", span: "Visit log" }], note: "14 visits across 11 weeks." },
      { criterionId: "c-amri-2", label: "Plain radiographs obtained", status: "met", confidence: 0.88, evidence: [{ documentId: "doc-041", span: "p.4" }], note: "Radiograph report retrieved and attached." },
      { criterionId: "c-amri-3", label: "Functional limitation documented", status: "met", confidence: 0.9, evidence: [{ documentId: "doc-041", span: "p.2" }], note: "Documented limitation in occupational duties." },
    ],
    missingDocuments: [],
    evidenceGaps: [],
    confidence: {
      overall: 0.93,
      components: [
        { key: "rule-match", label: "Rule match", score: 1.0, weight: 0.2, explanation: "Exact policy match." },
        { key: "packet-completeness", label: "Packet completeness", score: 1.0, weight: 0.25, explanation: "All required documents present." },
        { key: "extraction-certainty", label: "Extraction certainty", score: 0.88, weight: 0.2, explanation: "Lowest field confidence 0.88." },
        { key: "identity-match", label: "Identity match", score: 1.0, weight: 0.1, explanation: "Identifiers agree." },
        { key: "route-reliability", label: "Route reliability", score: 0.87, weight: 0.1, explanation: "Availity 278 route degraded but functional." },
        { key: "prior-outcomes", label: "Prior outcomes", score: 0.78, weight: 0.15, explanation: "78% first-pass approval for this payer and code." },
      ],
    },
    recommendation: "ready-to-submit",
    rationale: "Every criterion in AM-IMG-221 is evidenced, including the radiograph report that was missing on NA-1039. Submitted via Availity 278.",
  },
  {
    id: "ai-1058",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1058",
    generatedAt: daysAgo(16),
    modelVersion: MODEL,
    promptVersion: "pa-extract/v6",
    extractedFacts: [
      { id: "f-1058-1", label: "Pain duration", value: "8 months, chronic intractable", confidence: 0.94, sourceDocumentId: "doc-051", sourceSpan: "p.1", category: "history" },
      { id: "f-1058-2", label: "Trial outcome", value: "30-day TENS trial completed with documented 40% pain reduction", confidence: 0.92, sourceDocumentId: "doc-052", sourceSpan: "p.2", category: "treatment" },
    ],
    criteriaMatches: [
      { criterionId: "c-dme-1", label: "Chronic intractable pain", status: "met", confidence: 0.94, evidence: [{ documentId: "doc-051", span: "p.1" }], note: "Eight months documented." },
      { criterionId: "c-dme-2", label: "Other modalities tried", status: "met", confidence: 0.89, evidence: [{ documentId: "doc-051", span: "p.3" }], note: "NSAIDs, PT and injection therapy all documented." },
      { criterionId: "c-dme-3", label: "Trial period completed", status: "met", confidence: 0.92, evidence: [{ documentId: "doc-052", span: "p.2" }], note: "30-day trial with documented benefit." },
    ],
    missingDocuments: [],
    evidenceGaps: [],
    confidence: {
      overall: 0.89,
      components: [
        { key: "rule-match", label: "Rule match", score: 1.0, weight: 0.2, explanation: "Exact policy match." },
        { key: "packet-completeness", label: "Packet completeness", score: 1.0, weight: 0.25, explanation: "All required documents present." },
        { key: "extraction-certainty", label: "Extraction certainty", score: 0.89, weight: 0.2, explanation: "Lowest field confidence 0.89." },
        { key: "identity-match", label: "Identity match", score: 1.0, weight: 0.1, explanation: "Identifiers agree." },
        { key: "route-reliability", label: "Route reliability", score: 0.99, weight: 0.1, explanation: "Meridian PAS stable." },
        { key: "prior-outcomes", label: "Prior outcomes", score: 0.6, weight: 0.15, explanation: "DME requests are frequently modified rather than approved outright." },
      ],
    },
    recommendation: "ready-to-submit",
    rationale: "All three criteria evidenced. Submitted electronically; the payer approved a 90-day rental rather than the requested purchase.",
  },
  {
    id: "ai-1061",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1061",
    generatedAt: daysAgo(21),
    modelVersion: MODEL,
    promptVersion: "pa-extract/v6",
    extractedFacts: [
      { id: "f-1061-1", label: "Presenting complaint", value: "Cervical radiculopathy with progressive right-hand weakness", confidence: 0.95, sourceDocumentId: "doc-061", sourceSpan: "p.1", category: "diagnosis" },
      { id: "f-1061-2", label: "Neurological findings", value: "3/5 grip strength right; Hoffmann sign positive bilaterally", confidence: 0.93, sourceDocumentId: "doc-061", sourceSpan: "p.2 'Examination'", category: "measurement" },
      { id: "f-1061-3", label: "Conservative therapy documented", value: "2 weeks NSAIDs only", confidence: 0.9, sourceDocumentId: "doc-061", sourceSpan: "p.3", category: "treatment" },
    ],
    criteriaMatches: [
      { criterionId: "c-cmri-1", label: "Six weeks of conservative therapy", status: "not-met", confidence: 0.9, evidence: [{ documentId: "doc-061", span: "p.3" }], note: "Two weeks documented." },
      { criterionId: "c-cmri-2", label: "Radicular symptoms documented", status: "met", confidence: 0.95, evidence: [{ documentId: "doc-061", span: "p.1" }], note: "Clear C6-C7 distribution." },
      { criterionId: "c-cmri-3", label: "Myelopathy signs (waives conservative therapy)", status: "met", confidence: 0.93, evidence: [{ documentId: "doc-061", span: "p.2 'Examination'" }], note: "Positive Hoffmann sign bilaterally with progressive motor deficit. On the face of the policy this waives the conservative-therapy requirement — a clinical reviewer should confirm." },
    ],
    missingDocuments: [],
    evidenceGaps: [],
    confidence: {
      overall: 0.72,
      components: [
        { key: "rule-match", label: "Rule match", score: 0.8, weight: 0.2, explanation: "Policy matched, but the waiver clause requires interpretation." },
        { key: "packet-completeness", label: "Packet completeness", score: 1.0, weight: 0.25, explanation: "All required documents present." },
        { key: "extraction-certainty", label: "Extraction certainty", score: 0.9, weight: 0.2, explanation: "Lowest field confidence 0.90." },
        { key: "identity-match", label: "Identity match", score: 1.0, weight: 0.1, explanation: "Identifiers agree." },
        { key: "route-reliability", label: "Route reliability", score: 0.42, weight: 0.1, explanation: "No electronic route; portal only." },
        { key: "prior-outcomes", label: "Prior outcomes", score: 0.33, weight: 0.15, explanation: "Caldera denies most cervical MRI requests submitted under six weeks of therapy." },
      ],
    },
    recommendation: "escalate-clinical-review",
    rationale:
      "The myelopathy waiver clause appears to apply — positive Hoffmann sign with progressive motor deficit — but whether those findings meet the policy's bar is a medical judgement. Escalated to a licensed reviewer. It was submitted on clinical sign-off, denied, and is now at peer-to-peer.",
  },
  {
    id: "ai-1065",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1065",
    generatedAt: hoursAgo(9),
    modelVersion: MODEL,
    promptVersion: PROMPT,
    extractedFacts: [
      { id: "f-1065-1", label: "Pain duration", value: "5 months", confidence: 0.91, sourceDocumentId: "doc-074", sourceSpan: "p.1", category: "history" },
    ],
    criteriaMatches: [
      { criterionId: "c-dme-1", label: "Chronic intractable pain", status: "met", confidence: 0.91, evidence: [{ documentId: "doc-074", span: "p.1" }], note: "Five months documented." },
      { criterionId: "c-dme-3", label: "Trial period completed", status: "unclear", confidence: 0.64, evidence: [], note: "No trial documentation located in the chart." },
    ],
    missingDocuments: [
      { id: "miss-1065-1", label: "30-day TENS trial documentation", reason: "Policy CM-DME-077 requires a documented supervised trial with benefit.", severity: "blocking", resolvableBy: "staff" },
    ],
    evidenceGaps: [],
    confidence: {
      overall: 0.58,
      components: [
        { key: "rule-match", label: "Rule match", score: 1.0, weight: 0.2, explanation: "Exact policy match." },
        { key: "packet-completeness", label: "Packet completeness", score: 0.33, weight: 0.25, explanation: "1 of 3 required documents present." },
        { key: "extraction-certainty", label: "Extraction certainty", score: 0.64, weight: 0.2, explanation: "Trial documentation not found." },
        { key: "identity-match", label: "Identity match", score: 1.0, weight: 0.1, explanation: "Identifiers agree." },
        { key: "route-reliability", label: "Route reliability", score: 0.88, weight: 0.1, explanation: "Caldera portal automation stable." },
        { key: "prior-outcomes", label: "Prior outcomes", score: 0.5, weight: 0.15, explanation: "Mixed outcomes for DME with this payer." },
      ],
    },
    recommendation: "gather-more-documentation",
    rationale:
      "Trial documentation the policy requires is not in the chart. Caldera is also in Shadow mode, so this case would wait for a human release regardless of its score.",
  },
];

/* ------------------------------------------------------------------ *
 * Decisions
 * ------------------------------------------------------------------ */

export const decisions: Decision[] = [
  {
    id: "dec-1039",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1039",
    outcome: "denied",
    decidedAt: daysAgo(18),
    decidedByUserId: "payer-reviewer-external",
    decidedByName: "Dr. L. Brennan, Atlas Mutual Medical Director",
    reasonCodes: [
      { system: "CARC", code: "50", display: "These are non-covered services because this is not deemed a medical necessity by the payer." },
      { system: "payer-internal", code: "AM-IMG-221.2", display: "Plain radiographs not documented prior to advanced imaging." },
    ],
    rationale:
      "Submitted documentation does not include a radiographic report confirming that plain films were obtained and reviewed prior to advanced imaging, as required by policy AM-IMG-221 section 2.",
    payerRef: "ATLS-DEC-7719023",
    criteriaId: "crit-atlas-lumbar-mri",
    appealDeadline: daysAhead(42),
  },
  {
    id: "dec-1044",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1044",
    outcome: "approved",
    decidedAt: daysAgo(40),
    decidedByName: "Meridian Health Plan (electronic determination)",
    authorizationNumber: "MRDN-AUTH-8841992",
    validFrom: "2026-08-24",
    validTo: "2026-10-18",
    approvedUnits: 1,
    reasonCodes: [],
    rationale: "Criteria met. Authorization valid for 55 days from the date of determination.",
    payerRef: "MRDN-PAS-5520118",
    criteriaId: "crit-granite-tka",
  },
  {
    id: "dec-1058",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1058",
    outcome: "partially-approved",
    decidedAt: daysAgo(12),
    decidedByUserId: "usr-abara",
    decidedByName: "Dr. Chidi Abara, Meridian Health Plan",
    authorizationNumber: "MRDN-AUTH-8842107",
    validFrom: "2026-09-19",
    validTo: "2026-12-18",
    approvedUnits: 1,
    reasonCodes: [
      { system: "payer-internal", code: "W2", display: "Approved as rental rather than purchase." },
    ],
    rationale:
      "Medical necessity established. Approved as a 90-day rental rather than outright purchase, consistent with policy MH-DME-077 for first-time TENS provision. Purchase may be reconsidered on documented continued benefit at 90 days.",
    payerRef: "MRDN-PAS-5521440",
    criteriaId: "crit-caldera-dme",
  },
  {
    id: "dec-1061",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1061",
    outcome: "denied",
    decidedAt: daysAgo(18),
    decidedByUserId: "payer-reviewer-external",
    decidedByName: "Dr. P. Oduya, Caldera Medicaid Partners",
    reasonCodes: [
      { system: "CARC", code: "50", display: "These are non-covered services because this is not deemed a medical necessity by the payer." },
      { system: "payer-internal", code: "CM-RAD-044.1", display: "Conservative management threshold not met." },
    ],
    rationale:
      "Two weeks of conservative management documented against a policy requirement of six. The submitted examination findings were not accepted as satisfying the myelopathy waiver.",
    payerRef: "CLDR-DEC-1180884",
    criteriaId: "crit-mh-cervical-mri",
    appealDeadline: daysAhead(24),
  },
  // Generated-case decisions, kept minimal.
  // Decided 1-5 days after the case was created, so turnaround reads realistically.
  ...(
    [
      ["1040", 34, 3],
      ["1041", 31, 2],
      ["1043", 27, 4],
      ["1045", 24, 1],
      ["1046", 22, 2],
      ["1049", 18, 5],
      ["1050", 17, 3],
      ["1051", 15, 2],
    ] as const
  ).map(([n, created, lag]) => ({
    id: `dec-${n}`,
    tenantId: PROVIDER_TENANT,
    requestId: `req-${n}`,
    outcome: "approved" as const,
    decidedAt: daysAgo(created - lag),
    decidedByName: "Electronic determination",
    authorizationNumber: `AUTH-${n}-${(Number(n) * 7919) % 100000}`,
    validFrom: "2026-09-01",
    validTo: "2026-12-01",
    approvedUnits: 1,
    reasonCodes: [],
    rationale: "Criteria met.",
    payerRef: `REF-${n}`,
  })),
  ...(
    [
      ["1042", 30, 6],
      ["1048", 19, 4],
    ] as const
  ).map(([n, created, lag]) => ({
    id: `dec-${n}`,
    tenantId: PROVIDER_TENANT,
    requestId: `req-${n}`,
    outcome: "denied" as const,
    decidedAt: daysAgo(created - lag),
    decidedByUserId: "payer-reviewer-external",
    decidedByName: "Payer medical director",
    reasonCodes: [
      { system: "CARC" as const, code: "50", display: "Not deemed a medical necessity by the payer." },
    ],
    rationale: "Conservative management threshold not met on the submitted documentation.",
    payerRef: `REF-${n}`,
    appealDeadline: daysAhead(30),
  })),
];

/* ------------------------------------------------------------------ *
 * Appeals and peer-to-peer
 * ------------------------------------------------------------------ */

export const appeals: Appeal[] = [
  {
    id: "apl-1039",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1039",
    decisionId: "dec-1039",
    level: 1,
    levelLabel: "First-level appeal",
    status: "under-review",
    filedAt: daysAgo(6),
    dueAt: daysAhead(12),
    approvedByUserId: "usr-okafor",
    argument:
      "The denial cites absence of plain radiographs. Radiographs were in fact obtained on 11 August 2026 at an outside facility; the report was not available in the chart at the time of submission and has since been retrieved and is attached. In addition, twelve supervised physical therapy visits between 3 July and 22 August 2026 are documented, well in excess of the four-week policy threshold. The clinical picture — seven months of symptoms, documented functional limitation, and failure of conservative management — meets policy AM-IMG-221 in full on the complete record.",
    additionalDocumentIds: ["doc-013"],
  },
  {
    id: "apl-1042",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1042",
    decisionId: "dec-1042",
    level: 1,
    levelLabel: "First-level appeal",
    status: "draft",
    dueAt: daysAhead(8),
    argument:
      "Draft prepared by the agent. Awaiting review by a licensed clinician before filing.",
    additionalDocumentIds: [],
  },
];

export const peerToPeers: PeerToPeer[] = [
  {
    id: "p2p-1061",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1061",
    status: "scheduled",
    requestedAt: daysAgo(10),
    scheduledAt: new Date(NOW.getTime() + 2 * 86_400_000 + 3 * 3_600_000).toISOString(),
    durationMinutes: 15,
    providerUserId: "usr-lindqvist",
    payerReviewerName: "Dr. P. Oduya, Caldera Medicaid Partners",
    offeredSlots: [
      new Date(NOW.getTime() + 2 * 86_400_000 + 3 * 3_600_000).toISOString(),
      new Date(NOW.getTime() + 2 * 86_400_000 + 6 * 3_600_000).toISOString(),
      new Date(NOW.getTime() + 3 * 86_400_000 + 2 * 3_600_000).toISOString(),
    ],
    notes:
      "Discussion will focus on whether the documented Hoffmann sign and progressive motor deficit satisfy the myelopathy waiver in CM-RAD-044.",
  },
];

/* ------------------------------------------------------------------ *
 * RFI / communications
 * ------------------------------------------------------------------ */

export const communications: Communication[] = [
  {
    id: "com-1052-1",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1052",
    kind: "rfi",
    direction: "payer-to-provider",
    sentAt: daysAgo(1),
    sender: "Granite State Blue — Utilization Management",
    subject: "Additional information required — NA-1052",
    body:
      "Prior authorization request GSB-PAS-3310771 has been pended. To complete our review, please provide the most recent physical therapy discharge summary documenting functional outcome measures. All other submitted documentation has been accepted.",
    requestedItems: [
      {
        id: "rfi-1052-1",
        label: "Physical therapy discharge summary with functional outcome measures",
        reason: "Payer requires documented functional outcome at discharge to assess response to conservative management.",
        severity: "blocking",
        resolvableBy: "agent",
      },
    ],
    dueAt: daysAhead(4),
    status: "open",
    attachmentIds: [],
  },
  {
    id: "com-1039-1",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1039",
    kind: "status-update",
    direction: "payer-to-provider",
    sentAt: daysAgo(18),
    sender: "Atlas Mutual",
    subject: "Determination issued — NA-1039",
    body: "A determination has been issued on this request. See the attached notice for reason codes and appeal rights.",
    status: "closed",
    attachmentIds: ["doc-014"],
  },
  {
    id: "com-1061-1",
    tenantId: PROVIDER_TENANT,
    requestId: "req-1061",
    kind: "p2p-offer",
    direction: "payer-to-provider",
    sentAt: daysAgo(4),
    sender: "Caldera Medicaid Partners",
    subject: "Peer-to-peer review slots available — NA-1061",
    body:
      "Dr. Oduya is available for a peer-to-peer discussion. Please select one of the offered times. A peer-to-peer must take place within 10 business days of the determination date.",
    status: "responded",
    respondedAt: daysAgo(3),
    attachmentIds: [],
  },
];

/* ------------------------------------------------------------------ *
 * Questionnaire responses
 * ------------------------------------------------------------------ */

export const questionnaireResponses: QuestionnaireResponse[] = [
  {
    id: "qr-1047",
    tenantId: PROVIDER_TENANT,
    questionnaireId: "qst-mh-lumbar-mri",
    requestId: "req-1047",
    status: "in-progress",
    authoredAt: hoursAgo(6),
    answers: [
      { linkId: "q1", value: 11, source: "cql-prepopulated", sourceDocumentId: "doc-003", sourceSpan: "onset date" },
      { linkId: "q2", value: false, source: "ai-extracted", confidence: 0.88, sourceDocumentId: "doc-002", sourceSpan: "p.2 'Interval history'" },
      { linkId: "q3", value: "Physical therapy, NSAIDs, Muscle relaxants", source: "ai-extracted", confidence: 0.94, sourceDocumentId: "doc-002", sourceSpan: "p.2–3" },
      { linkId: "q4", value: true, source: "ai-extracted", confidence: 0.91, sourceDocumentId: "doc-002", sourceSpan: "p.2 'Examination'" },
      { linkId: "q5", value: "Diminished left Achilles reflex; 4/5 strength left plantarflexion", source: "ai-extracted", confidence: 0.91, sourceDocumentId: "doc-002", sourceSpan: "p.2 'Examination'" },
      { linkId: "q6", value: "None", source: "ai-extracted", confidence: 0.82, sourceDocumentId: "doc-002", sourceSpan: "p.2 'Review of systems'" },
      { linkId: "q7", value: "2026-08-16", source: "cql-prepopulated", sourceDocumentId: "doc-004", sourceSpan: "study date" },
      { linkId: "q8", value: "1629384756", source: "cql-prepopulated" },
    ],
  },
];
