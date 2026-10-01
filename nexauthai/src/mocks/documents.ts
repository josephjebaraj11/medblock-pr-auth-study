/**
 * Synthetic clinical documents.
 *
 * `requiredByRule` is the field that matters: it is how minimum-necessary is
 * enforced by construction. Prior authorization is a HIPAA *payment*
 * disclosure, so the treatment exception does not apply and the whole chart
 * must never be sent — only what the matched rule asked for.
 */

import type { ClinicalDocument } from "@/types";
import { PROVIDER_TENANT } from "./core";

let seq = 0;
const hash = () => {
  seq += 1;
  return `sha256:${(seq * 2654435761).toString(16).padStart(12, "0")}${"a3f9c2e8b104".slice(0, 52)}`;
};

const doc = (
  id: string,
  patientId: string,
  requestId: string | undefined,
  title: string,
  type: ClinicalDocument["type"],
  uploadedAt: string,
  opts: Partial<ClinicalDocument> = {},
): ClinicalDocument => ({
  id,
  tenantId: PROVIDER_TENANT,
  requestId,
  patientId,
  title,
  type,
  mimeType: "application/pdf",
  sizeBytes: 180_000 + ((seq * 7919) % 900_000),
  sha256: hash(),
  uploadedAt,
  uploadedBy: "Epic (automated retrieval)",
  source: "Epic",
  requiredByRule: true,
  pages: 2 + (seq % 9),
  sensitivity: "phi",
  ...opts,
});

export const clinicalDocuments: ClinicalDocument[] = [
  /* --- NA-1047 · Sofia Marino · lumbar MRI · clinical review --------- */
  doc("doc-001", "pat-002", "req-1047", "Signed order — MRI lumbar spine without contrast", "order", "2026-09-28T09:14:00Z", { loincCode: "57133-1", pages: 1 }),
  doc("doc-002", "pat-002", "req-1047", "Office visit note — 28 Sep 2026", "office-note", "2026-09-28T09:15:00Z", { loincCode: "11506-3", pages: 4 }),
  doc("doc-003", "pat-002", "req-1047", "Office visit note — 14 Aug 2026", "office-note", "2026-09-28T09:15:00Z", { loincCode: "11506-3", pages: 3 }),
  doc("doc-004", "pat-002", "req-1047", "Lumbar spine radiograph report — 16 Aug 2026", "imaging-report", "2026-09-28T09:16:00Z", { loincCode: "18748-4", pages: 2, requiredByRule: false }),

  /* --- NA-1039 · Robert Hayes · denied, appealed -------------------- */
  doc("doc-010", "pat-003", "req-1039", "Signed order — MRI lumbar spine", "order", "2026-09-02T10:02:00Z", { pages: 1 }),
  doc("doc-011", "pat-003", "req-1039", "Office visit note — 01 Sep 2026", "office-note", "2026-09-02T10:03:00Z", { pages: 5 }),
  doc("doc-012", "pat-003", "req-1039", "Physical therapy discharge summary — 22 Aug 2026", "therapy-note", "2026-09-02T10:04:00Z", { loincCode: "28653-4", pages: 6 }),
  doc("doc-013", "pat-003", "req-1039", "Physical therapy progress notes — Jul–Aug 2026 (12 visits)", "therapy-note", "2026-09-24T14:40:00Z", { loincCode: "28653-4", pages: 14, uploadedBy: "Dana Whitaker", source: "Manual upload" }),
  doc("doc-014", "pat-003", "req-1039", "Denial letter — Atlas Mutual", "prior-auth-letter", "2026-09-18T16:20:00Z", { pages: 2, uploadedBy: "Atlas Mutual", source: "Portal", requiredByRule: false }),
  doc("doc-015", "pat-003", "req-1039", "Appeal letter — first level", "appeal-letter", "2026-09-25T11:05:00Z", { pages: 3, uploadedBy: "Dr. Adaeze Okafor", source: "NexAuthAI", requiredByRule: false }),

  /* --- NA-1052 · Kwame Mensah · pended / RFI ------------------------ */
  doc("doc-020", "pat-004", "req-1052", "Signed order — MRI lumbar spine", "order", "2026-09-26T08:30:00Z", { pages: 1 }),
  doc("doc-021", "pat-004", "req-1052", "Office visit note — 25 Sep 2026", "office-note", "2026-09-26T08:31:00Z", { pages: 4 }),
  doc("doc-022", "pat-004", "req-1052", "Physical therapy notes — Aug 2026", "therapy-note", "2026-09-26T08:32:00Z", { pages: 8 }),

  /* --- NA-1044 · Eleanor Whitmore · approved, expiring soon --------- */
  doc("doc-030", "pat-006", "req-1044", "Signed order — Total knee arthroplasty, right", "order", "2026-08-20T13:00:00Z", { pages: 1 }),
  doc("doc-031", "pat-006", "req-1044", "Surgical consultation note — 19 Aug 2026", "office-note", "2026-08-20T13:01:00Z", { pages: 6 }),
  doc("doc-032", "pat-006", "req-1044", "Weight-bearing knee radiograph report", "imaging-report", "2026-08-20T13:02:00Z", { pages: 2 }),
  doc("doc-033", "pat-006", "req-1044", "Physical therapy records — May–Aug 2026", "therapy-note", "2026-08-20T13:03:00Z", { pages: 18 }),

  /* --- NA-1055 · Priya Venkatesan · awaiting payer review ----------- */
  doc("doc-040", "pat-005", "req-1055", "Signed order — MRI lumbar spine", "order", "2026-09-30T15:10:00Z", { pages: 1, source: "athenahealth", uploadedBy: "athenahealth (automated retrieval)" }),
  doc("doc-041", "pat-005", "req-1055", "Office visit note — 29 Sep 2026", "office-note", "2026-09-30T15:11:00Z", { pages: 3, source: "athenahealth", uploadedBy: "athenahealth (automated retrieval)" }),
  doc("doc-042", "pat-005", "req-1055", "Physical therapy notes — Jul–Sep 2026 (14 visits)", "therapy-note", "2026-09-30T15:12:00Z", { pages: 16, source: "athenahealth", uploadedBy: "athenahealth (automated retrieval)" }),

  /* --- NA-1058 · Harold Petrakis · partially approved --------------- */
  doc("doc-050", "pat-009", "req-1058", "DME order — TENS unit", "order", "2026-09-15T09:00:00Z", { pages: 1 }),
  doc("doc-051", "pat-009", "req-1058", "Pain management note — 14 Sep 2026", "office-note", "2026-09-15T09:01:00Z", { pages: 4 }),
  doc("doc-052", "pat-009", "req-1058", "30-day TENS trial documentation", "therapy-note", "2026-09-15T09:02:00Z", { pages: 3 }),

  /* --- NA-1061 · Imani Sowande · peer-to-peer ----------------------- */
  doc("doc-060", "pat-008", "req-1061", "Signed order — MRI cervical spine", "order", "2026-09-10T11:20:00Z", { pages: 1 }),
  doc("doc-061", "pat-008", "req-1061", "Neurology consultation note — 09 Sep 2026", "office-note", "2026-09-10T11:21:00Z", { pages: 5 }),
  doc("doc-062", "pat-008", "req-1061", "Denial letter — Caldera Medicaid Partners", "prior-auth-letter", "2026-09-22T10:00:00Z", { pages: 2, uploadedBy: "Caldera Medicaid Partners", source: "Portal", requiredByRule: false }),

  /* --- Shared chart material, not yet attached to a request --------- */
  doc("doc-069", "pat-001", undefined, "Signed order — MRI lumbar spine without contrast", "order", "2026-09-30T16:44:00Z", { loincCode: "57133-1", pages: 1 }),
  doc("doc-070", "pat-001", undefined, "Office visit note — 30 Sep 2026", "office-note", "2026-09-30T16:45:00Z", { pages: 4 }),
  doc("doc-071", "pat-001", undefined, "Physical therapy notes — Aug–Sep 2026 (13 visits)", "therapy-note", "2026-09-30T16:46:00Z", { pages: 15 }),
  doc("doc-072", "pat-001", undefined, "Lumbar spine radiograph report — 11 Aug 2026", "imaging-report", "2026-09-30T16:47:00Z", { pages: 2, requiredByRule: false }),
  doc("doc-073", "pat-001", undefined, "Medication list — current", "other", "2026-09-30T16:48:00Z", { pages: 1, requiredByRule: false }),
  doc("doc-074", "pat-010", undefined, "Office visit note — 27 Sep 2026", "office-note", "2026-09-27T14:00:00Z", { pages: 3 }),
  doc("doc-076", "pat-010", undefined, "Signed order — advanced imaging", "order", "2026-09-27T14:01:00Z", { pages: 1 }),
  doc("doc-077", "pat-010", undefined, "Physical therapy notes — Jul–Sep 2026", "therapy-note", "2026-09-27T14:02:00Z", { pages: 11 }),
  doc("doc-078", "pat-005", undefined, "Signed order — advanced imaging", "order", "2026-09-29T10:00:00Z", { pages: 1 }),
  doc("doc-079", "pat-005", undefined, "Physical therapy notes — Jul–Sep 2026", "therapy-note", "2026-09-29T10:01:00Z", { pages: 13 }),
  doc("doc-075", "pat-013", undefined, "Operative report — 12 Jun 2026", "operative-report", "2026-06-13T08:00:00Z", { loincCode: "11504-8", pages: 5, requiredByRule: false }),
];

export const documentsById = new Map(clinicalDocuments.map((d) => [d.id, d]));
