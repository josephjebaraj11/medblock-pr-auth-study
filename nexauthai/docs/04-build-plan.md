# 04 — Build Plan

**MVP → v1 → scale: phases, team, milestones, risks and the metrics that decide whether it worked.**

One framing note before the plan. The source folder's own roadmap says the calendar critical path is **contracting, payer enrollment and credentials — not code**. Every date below assumes those start in week 1, in parallel with engineering. If they start when engineering is "ready for them", add six weeks.

---

## 1. Phase overview

| Phase | Weeks | Theme | Exit criterion |
|---|---|---|---|
| **0 · Discovery** | 0–2 (overlapping) | Answer the questions, sign the scope, start enrollment | Signed scope, baseline numbers, credentials requested |
| **1 · Core** | 1–3 | Case, state machine, audit, identity, work surfaces | A synthetic order runs end to end against a simulated payer |
| **2 · Electronic lane** | 4–6 | Eligibility, requirement check, packet, one EHR, one clearinghouse | A real sandbox case moves with a traceable reference |
| **3 · Fallbacks and hardening** | 7–9 | Portal, voice, clinical queue, notifications, security review | Electronic → portal → voice → human works as **one** workflow |
| **4 · Shadow pilot** | 10–13 | Run alongside staff; calibrate; measure | Agreed acceptance thresholds met (§6) |
| **5 · Supervised** | 14–18 | First payer to supervised auto-submit; widen scope | Written sign-off per payer; exception rate below the agreed line |
| **6 · Scale** | 19–26 | Second EHR, more payers, tenant self-onboarding, SOC 2 Type I | A new tenant onboards without a code branch |

---

## 2. Phase detail

### Phase 0 · Discovery (weeks 0–2)

**The single highest-leverage phase, and the one most likely to be skipped.**

All 107 discovery questions in the source folder are currently unanswered. Twenty-five are marked must-have. Until they land, every concrete value in the design is a placeholder.

| Deliverable | Owner |
|---|---|
| Run the 25 must-have discovery questions with the staff who do the work today — screen-shared, not described from memory | Product + healthcare BA |
| Pick the pilot payer and CPT family (recommended: highest-volume imaging payer, 72148/72141) | Client + PO |
| **Baseline the practice's own numbers** — minutes per authorization, first-pass approval rate, denial rate, call volume | BA |
| Sign the Vision & Scope | Founders + client |
| **Start Availity, EHR sandbox and payer-portal credential requests** | Integration lead |
| Execute BAAs with every subprocessor | Compliance |
| Resolve the open decisions in §8 | Founders |
| Obtain a de-identified sample of past authorizations and outcomes for the golden set | BA + client |

**Exit:** signed scope, baseline metrics in hand, credentials requested, decisions owned.

---

### Phase 1 · Core (weeks 1–3)

| Deliverable | Notes |
|---|---|
| Case service + state machine + transition table | Declarative transitions; the service rejects anything not in the table |
| Outbox + event bus + worker scaffolding | At-least-once, idempotent consumers |
| Append-only hash-chained audit | With a verification endpoint, not just a table |
| Keycloak realm, roles, scopes, MFA | Realm per tenant from day one — retrofitting tenancy is brutal |
| PostgreSQL schema with RLS | `tenant_id` first in every PK |
| Intake: `POST /v1/requests` + CSV/SFTP | The default integration contract |
| **Simulated payer service** | So Phase 2 is not blocked on anyone else's sandbox |
| Ops dashboard, request list, case detail | Built against the same OpenAPI spec the backend implements |

**Exit:** a synthetic order runs draft → submitted → decided against the simulated payer, with a complete audit trail.

---

### Phase 2 · Electronic lane (weeks 4–6)

| Deliverable | Notes |
|---|---|
| Clearinghouse connector: 270/271, 278 | Availity recommended; confirm what the practice actually has licensed |
| One EHR connector: read + write-back | Whichever the pilot practice runs. Epic only if they are an Epic site |
| Payer connector: CRD → DTR → PAS where live | Otherwise 278 via the clearinghouse |
| Packet builder + completeness check | Minimum-necessary by construction |
| DTR questionnaire render + CQL pre-population | Deterministic first; extraction for the rest |
| AI extraction with provenance | Structured output, source spans, per-field confidence |
| Pended / RFI loop | CDex where available; portal notice where not |
| Connection test and reconnect UI | Connection state is a first-class concept |

**Exit:** a real sandbox case moves end to end with a traceable payer reference number.

---

### Phase 3 · Fallbacks and hardening (weeks 7–9)

| Deliverable | Notes |
|---|---|
| 1–2 portal workers (Playwright) | Isolated sessions, screenshot evidence, change detection against a baseline |
| Voice flow (Retell + SIP) | Per-payer automated-caller check and per-state recording-consent check **before dialing** |
| Clinical review queue + attestation | The licensed-reviewer boundary, enforced in the service layer |
| Automation gate: kill switch, trust ramp, threshold | Tenant Admin configuration, versioned and audited |
| Notifications: email + web push | **No PHI in payload** — verified by test, not by review |
| SLA timers, rechecks, expiry watch | 72h / 7d; expiry against the scheduled service date |
| Appeals and peer-to-peer | Human approval required to file |
| **Security review + tenant-isolation tests** | Cross-tenant reads must fail at API *and* DB |
| WCAG 2.1 AA audit | |
| UAT with the pilot practice | |

**Exit:** the full waterfall runs as one workflow on one case. Shadow pilot live.

---

### Phase 4 · Shadow pilot (weeks 10–13)

The agent proposes every action; a human approves each one. Nothing goes out unattended.

| Activity | Purpose |
|---|---|
| Run the agent alongside staff on real cases | Compare agent proposal to what staff actually did |
| Measure agreement per payer, per CPT, per criterion | Where it is wrong, and why |
| **Calibrate confidence** — predicted vs actual, per payer | An uncalibrated score is decoration |
| Build the golden set from real outcomes | Regression protection for every later change |
| Tune prompts, rules and thresholds against measured error | Not against intuition |
| Weekly review with the exception owner | The named person from DQ-019 |

**Exit:** acceptance thresholds in §6 met, with the client's written agreement on what "met" means.

---

### Phase 5 · Supervised (weeks 14–18)

| Deliverable | Notes |
|---|---|
| Promote the first payer to supervised auto-submit | **Written sign-off**, per payer and per workflow |
| Widen to the second and third payers as the exception rate proves out | One at a time |
| Add CPT families beyond the pilot | Same gate each time |
| Denial-reason feedback into the rules and the eval set | Closes the loop |
| Cost-per-case telemetry: voice minutes, model tokens, EDI transactions | Margin is a product concern |

**Exit:** at least one payer running supervised for four consecutive weeks within the agreed exception rate.

---

### Phase 6 · Scale (weeks 19–26)

| Deliverable | Notes |
|---|---|
| Second EHR connector | Proves the adapter contract holds |
| Tenant provisioning + guided onboarding | Registry match → credentials → validate → shadow → live |
| Connector registry with versioning and health alerts | |
| SSO/SAML federation for health-system customers | |
| Metering + Stripe billing | Usage lines trace back to the case ledger |
| SLOs, alerting, DR rehearsal | Rehearsed, not documented-and-assumed |
| **SOC 2 Type I** | Type II observation window starts here |
| Dedicated-tier deployment tooling | Same Terraform, customer VPC |

**Exit:** a new tenant onboards without a code branch.

---

## 3. Team

### 3.1 POD 1 — Product and core (from week 1)

| Role | FTE | Why |
|---|---|---|
| Product owner / healthcare BA | 1.0 | Owns discovery, scope and the payer-rule content. The hardest role to substitute |
| Architect / tech lead | 1.0 | Owns the contract boundaries and the ADRs |
| Backend / workflow engineers | 2.0 | Case service, state machine, rules, API |
| Frontend engineer | 1.0 | The portal, against the same OpenAPI spec |
| QA automation engineer | 1.0 | Contract tests, workflow replay, isolation tests |

### 3.2 POD 2 — Integrations (from month 2)

| Role | FTE | Why |
|---|---|---|
| Integration lead | 1.0 | Owns the enrollment calendar — the real critical path |
| Healthcare integration engineer | 1.0 | FHIR, X12, HL7 v2 |
| Browser / RPA engineer | 1.0 | Portal workers. Ongoing maintenance, not a one-off build |
| Voice / agent engineer | 1.0 | IVR maps, conversation design, transcript structuring |
| QA | 0.5 | |

### 3.3 Shared

| Role | FTE | Why |
|---|---|---|
| Clinical SME (part-time) | 0.3 | Clinical-review UX, criteria interpretation, what "unclear" should mean |
| Compliance / privacy officer | 0.5 | BAAs, HIPAA, SOC 2, call-consent rules |
| DevOps / security engineer | 1.0 | Infra, secrets, monitoring, pen-test remediation |

**Peak: ~11.3 FTE.** The two roles most often under-resourced are the healthcare BA and the integration lead — and they are the two whose absence silently adds months.

---

## 4. Milestones

| # | Milestone | Week | Evidence it actually happened |
|---|---|---|---|
| M1 | Scope signed, baseline measured | 2 | Signed document; baseline numbers from the practice's own data |
| M2 | Synthetic case end to end | 3 | Demo against the simulated payer with a full audit trail |
| M3 | First real sandbox case | 6 | Payer reference number on a real case |
| M4 | Full waterfall on one case | 9 | A case that fell electronic → portal → voice, with all three attempts recorded |
| M5 | Shadow pilot live | 10 | Agent proposing on real cases; staff approving |
| M6 | Calibration report | 13 | Predicted vs actual confidence, per payer |
| M7 | First payer supervised | 15 | Written client sign-off |
| M8 | Second EHR connected | 22 | Without a core code change |
| M9 | SOC 2 Type I | 26 | Auditor report |

---

## 5. Risks

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | **Payer enrollment and credentials take longer than code** | Pilot slips weeks | **High** | Start week 1. Build against a simulated payer. Promise connector and sandbox readiness, never "live with payer X by week N" |
| R2 | **Discovery questions stay unanswered** | Everything is a placeholder | **High** | Make Phase 0 a gate, not a parallel track. No build on an unanswered must-have |
| R3 | Portal UI changes break automation silently | Cases stall invisibly | High | Change detection against a recorded baseline, screenshot evidence, automatic fallback to voice, connector health alerts |
| R4 | **Stale payer-requirement matrix** | Wrong submissions, denials | High | Versioned rules with source and review date; a **named owner**; CRD where live; denial feedback loop. The folder names this as its single biggest source of error |
| R5 | LLM extraction errors | Bad packets, denials | Medium | Deterministic first; structured output with source spans; Shadow calibration; reviewer corrections feed the eval set |
| R6 | **Over-automation harms a patient** | Patient harm, legal exposure | Low / catastrophic | No AI denials — enforced in code. Licensed reviewer role. Trust ramp with written sign-off. Kill switch |
| R7 | PHI leakage via a tool or log | Breach | Low / catastrophic | BAAs everywhere. No consumer tools on the PHI path. PHI scrubbing at the OTel collector. No PHI in notifications — tested |
| R8 | Call-consent or disclosure violation | Legal | Medium | Per-payer automated-caller check and per-state consent check before every dial |
| R9 | Cost per case exceeds the price | Margin erosion | Medium | Cheapest-channel-first by design; per-case usage metering; alert on voice-minute outliers |
| R10 | Scope creep — every EHR, every payer | Delay | High | Signed MVP scope table; the adapter contract makes "later" cheap, which is the point |
| R11 | **ROI over-claimed, trust lost** | Relationship damage | Medium | Measure against the practice's own baseline. Cite CAQH, not the $20–30 screenshot. Quote PHTI's finding honestly |
| R12 | EHR vendor ships native CRD/DTR/PAS | Differentiation erodes | Medium | Design for coexistence — consume native outcomes rather than intercepting them. The moat is the connectivity graph and the workflow, not the LLM |
| R13 | Key-person dependency on the BA | Stall | Medium | Document payer rules as versioned data, not as knowledge in one head |

---

## 6. Success metrics

### 6.1 Pilot acceptance criteria

Proposed; **confirm with the client before Phase 4**, because "met" needs a shared definition.

| Measure | Target | Why this one |
|---|---|---|
| Field-level extraction accuracy on required items | **≥ 95%** | Bad packets cause denials |
| Correct "is PA required?" determinations | **≥ 98%** | A wrong "no" is an unpaid claim months later |
| **Duplicate submissions** | **0** | Not a tunable. Any non-zero value halts the pilot |
| Call outcomes matching transcript review | ≥ 90% | Voice is the least verifiable channel |
| Actions with a source and reference ID | **100%** | The audit requirement |
| Exception rate per payer | Below the line the practice signs off for Supervised | Theirs to set |
| Confidence calibration error per payer | ≤ 0.10 | An uncalibrated score cannot gate anything |

### 6.2 Operational metrics

| Metric | Baseline | Target |
|---|---|---|
| % of cases resolved with no staff touch, per payer lane | Measure in Phase 0 | Rising per payer |
| Order received → submitted (median, p90) | Measure in Phase 0 | Hours, not days |
| Staff minutes per authorization, **including review and correction** | Measure in Phase 0 | Falling — and this is the honest number, not raw submission time |
| % of missing-document cases caught **before** submission | Measure in Phase 0 | Rising — prevents pends and denials |
| First-pass approval rate | Measure in Phase 0 | ≥ baseline |
| Approvals that lapsed before the procedure date | Measure in Phase 0 | → 0 |
| Exceptions by reason | — | Tells you what to fix next |

### 6.3 Business metrics

| Metric | Note |
|---|---|
| Time to onboard a new tenant | Target: days for a registry match. **Currently asserted, never measured** |
| Cost per case by channel | Electronic vs portal vs voice. Prices the waterfall honestly |
| Connector reuse rate | A connector built once and used by *n* customers is where margin comes from |
| Gross margin per tenant | After pass-through costs |

### 6.4 ⚠️ On the ROI numbers

The source folder's business case runs on **$20–30 per manual PA**, from a screenshot of a search result. **CAQH 2024 — the best-sourced figure in the folder, in its own pricing workbook — says $12.88 for a fully manual transaction.** The ~5-day onboarding-payback claim is built on the higher number.

Three things follow:

1. Re-derive any client-facing ROI on CAQH, or state the basis explicitly.
2. Baseline against the practice's **own** data (DQ-011, DQ-027), not either figure.
3. Quote the Peterson Health Technology Institute's 2026 finding honestly: AI PA tools reduce manual effort *within* an organisation but have **not** been shown to lower system-wide cost. The win — faster care, less burnout, better documentation — is real. Don't oversell the cost case.

---

## 7. Cost drivers

| Driver | Shape | Note |
|---|---|---|
| Engineering | ~11 FTE at peak over 26 weeks | The dominant cost |
| Cloud hosting | Flat per tenant, scaling with volume | |
| Model API | Per token; falls with deterministic-first | Self-hosted MedGemma shifts this to compute |
| Voice | Per minute including hold | **The most expensive channel by a wide margin** — which is why it is third in the waterfall |
| Clearinghouse / EDI | Per transaction | |
| Portal automation maintenance | Ongoing, unpredictable | Every payer UI change is unplanned work |
| Compliance | BAAs, pen test, SOC 2 audit | |
| Payer-rule curation | Ongoing human effort | Underestimated in every plan, including this one |

---

## 8. Decisions needed

| # | Decision | Recommendation | Owner | Blocks |
|---|---|---|---|---|
| D1 | **Does NexAuthAI serve payers as well as providers?** | Provider-side first; payer-side is a separate product with a different buyer and compliance posture | Founders | Product shape, GTM |
| D2 | **Pricing model** — subscription, metered, or hybrid? | License + flat managed fee + one-time onboarding, with pass-through itemised | Founders | Billing design |
| D3 | Pilot payer and CPT family | Highest-volume imaging payer; 72148 / 72141 | Client + PO | Phase 2 |
| D4 | Launch EHR | Whatever the pilot practice runs | Client | Phase 2 |
| D5 | **Is n8n in or out?** | Out of the PHI path entirely | Architect + compliance | Onboarding price, compliance story |
| D6 | FHIR store | HAPI vs Medplum vs HealthLake, after a 3-day spike | Architect | Phase 2 |
| D7 | LLM provider and PHI boundary | Frontier model under BAA; MedGemma for the dedicated tier | Architect + compliance | Phase 2 |
| D8 | Acceptance thresholds for Supervised | §6.1 as the proposal | Client + compliance | Phase 4 exit |
| D9 | Audit retention period | 6 years is the common HIPAA reading — **confirm with counsel** | Compliance | Phase 1 schema |
| D10 | **Who owns the payer-requirement matrix?** | A named person with a review schedule | Client | R4 mitigation |

---

*Next: `05-connector-architecture.md`.*
