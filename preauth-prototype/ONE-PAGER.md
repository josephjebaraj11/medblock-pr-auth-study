# Agentic Prior Authorization — one-page summary

**Thesis.** Build the clinical data platform first; make prior authorization the first
workflow that runs on it. A standalone pre-auth agent demos faster and does not compound —
every subsequent workflow re-solves identity, terminology, retrieval and audit from zero.

**Why pre-auth is the right first workflow.** It exercises nearly the whole platform:
identity resolution across sources, consent, longitudinal retrieval, terminology,
form rendering, a rules engine, an audit trail and outbound integration on three
different transports. If the platform carries pre-auth, it carries most of what follows.

---

## Architecture — five layers

| Layer | What sits there | Owns |
|---|---|---|
| **01 Channels** | EHR-embedded app (SMART launch), provider portal, payer reviewer view, patient notifications | where a human meets the system |
| **02 Agent orchestration** | Orchestrator, seven specialist agents, human-in-the-loop checkpoints, agent memory | *this workflow* |
| **03 Platform** | Clinical data repository (openEHR + FHIR), terminology, form/template engine, rules & policy store, identity & consent, audit log, event bus | **the Medblocks-equivalent layer — build first, workflow-agnostic** |
| **04 Integration** | FHIR gateway, EHR connectors, payer/clearinghouse connectors, document & OCR ingestion | absorbing vendor and payer dialects |
| **05 External** | Provider EHRs, payers, clearinghouses, TEFCA/QHIN networks | not yours |

**The test for layer placement:** could you delete the entire agent layer and still have
something a customer would pay for? If a capability in layer 02 turns out to be useful to
a second workflow, it was misplaced and belongs in layer 03.

## The seven agents

Intake → Eligibility & Benefits → Clinical Evidence → Policy Matching → Packet Assembly →
Submission & Tracking → Denial & Appeal.

Each has one job, one tool set, and one escalation rule. The orchestrator holds the case
plan; the specialists hold no state. Every agent reads through platform APIs rather than
touching storage directly, so its reads are audited by construction.

**Two hard gates, neither governed by a confidence threshold:**
1. Nothing is submitted to a payer without a named human approving the packet.
2. No appeal is filed without a clinician signing it.

Confidence controls how much arrives pre-filled, how loudly gaps are flagged, and queue
ordering. It never controls whether a person is involved.

## Protocols

| Purpose | Standard |
|---|---|
| Trigger, inside the clinician's workflow | CDS Hooks 2.0 — `order-select`, `order-sign`, `order-dispatch`, `appointment-book` |
| Is authorization required, and what is needed | **Da Vinci CRD** (build against 2.2.1; CMS mandates 2.0.1) |
| The payer's questionnaire, autofilled in-workflow | **Da Vinci DTR** — FHIR Questionnaire + CQL |
| Submission and decision | **Da Vinci PAS** — `Claim/$submit`, decision pushed by FHIR Subscription |
| Legacy submission | X12 278 / 275 / 277 via clearinghouse |
| No-FHIR payers | Provider portal automation and fax, human-supervised |
| Clinical data | FHIR R4, openEHR REST + AQL, HL7 v2 (legacy), Bulk Data `$export` |
| Records from unconnected organisations | TEFCA / QHIN exchange, under a treatment relationship |
| Terminology | SNOMED CT, ICD-10-CM, CPT/HCPCS, LOINC, RxNorm — `$lookup` / `$expand` / `$translate` |
| Identity, consent, audit | OAuth 2.0 / OIDC, SMART scopes, `private_key_jwt`, FHIR Consent, FHIR AuditEvent |

**Regulatory frame.** CMS-0057-F requires covered plans to expose prior-authorization
APIs by **1 January 2027**, with expedited decisions inside 72 hours. Providers are
reached indirectly, through a MIPS electronic-prior-authorization measure attested in
CY 2027, which requires certified health IT — HTI-4 criteria (g)(31)–(g)(33), sitting
just beneath the existing (g)(10) FHIR API criterion. *Confirm criterion numbers and
dates against the Federal Register before scoping work against them.*

**One architectural constraint worth stating early.** An EHR's `fhirAuthorization` token
must not be forwarded to systems outside your trust boundary. Proxy the read and
re-tokenize. This shapes the whole vendor architecture, and it is easier to design for
than to retrofit.

---

## Mocked vs. real

| Capability | In this prototype | In production |
|---|---|---|
| All data | Local JSON — 8 patients, 3 payers, 3 policies, 20 evidence items, 11 cases | Live clinical data from connected sources, reconciled in the repository |
| Agent reasoning | Scripted, timed event sequences | Model calls inside individual agent steps; deterministic state machine at the orchestrator level |
| Confidence scores | Hand-authored constants | Calibrated against a regression suite of historical determinations — the only honest way to measure them |
| CDS Hooks trigger | Assumed to have fired | Registered CDS service; discovery cached, invocation inside a ~5-second budget |
| CRD / DTR / PAS | Fabricated payer responses | Real endpoints per payer; Inferno-tested |
| X12 278 / portal automation | Displayed, never executed | Clearinghouse connection; per-payer browser scripts, always human-reviewed |
| Terminology | Illustrative code strings | Licensed terminology server (SNOMED CT and CPT are licensed content — budget for it) |
| Clinical data repository | Fixed query results, AQL shown for illustration | openEHR CDR + FHIR, raw payloads retained alongside derived queryable shape |
| Identity & patient matching | Assumed resolved | Probabilistic matching across sources; duplicates are a clinical safety problem, not a data-quality footnote |
| Consent | Displayed, not evaluated | FHIR Consent evaluated per access, permitted purpose recorded |
| Audit | The activity timeline *is* the audit trail, rendered | Append-only FHIR AuditEvent, including model and prompt version per agent step |
| Network exchange (TEFCA) | Scripted "found it" in scenario 2 | Real query; requires treatment relationship and permitted purpose, and does not always match |
| Auth / sessions / persistence | None | OIDC sign-in, role-based access, signed approvals |
| Payer decisions | Simulated after a fixed delay | Pushed by FHIR Subscription, or polled via 277, or scraped from a portal |

**What the prototype legitimately demonstrates:** the shape of the workflow, where the
human gates sit, how evidence maps to criteria, how the three payer tiers differ, and
what a reviewer sees before approving. **What it cannot demonstrate:** whether the
matching is accurate, whether the confidence scores are calibrated, or whether any of
the outcome targets are achievable. Those need real determinations to measure against.
