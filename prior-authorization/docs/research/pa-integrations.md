# Integrating Prior Authorization: EHRs, FHIR, and Data Standards

*A CTO briefing on the plumbing underneath Prior Authorization (PA) automation — the data standards and system-to-system connections that let a provider's software talk to a payer's software. Companion to `pa-tech-landscape.md` (vendor tools), `pa-competitors.md` (who's deploying them and results), and `pa-alternatives.md` (whether PA itself can be avoided). Last researched: September 2026.*

**Prior Authorization (PA)** is the process where a healthcare provider must get sign-off from a patient's health insurance company (the "**payer**") before delivering certain treatment, tests, or medications — or the payer may refuse to pay. Every automation product described in the sibling documents ultimately depends on one unglamorous question: *can the provider's software and the payer's software actually exchange data in a format both sides understand, without a human retyping it in the middle?* This document is about that question specifically.

---

## 1. What "integration" means here, and why it's historically been hard

Today, a large share of PA still runs on:
- **Faxes** — yes, still, in 2026, for a meaningful share of requests, especially for smaller or slower-moving payers.
- **Payer web portals** — a staff member at the provider logs into a separate website per payer (a mid-size practice may deal with dozens of payers) and manually re-types information that already exists in the **EHR** (Electronic Health Record — the software a doctor's office or hospital uses to record patient care, such as Epic or Oracle Health/Cerner).
- **Phone calls** — to check status or resolve a stuck request.

The core problem is not a lack of computers — it's a lack of a **shared data standard**. Historically, each payer's PA system was its own island: its own web form fields, its own required document formats, its own way of describing "this procedure code requires prior auth." A provider's EHR had no reliable, universal way to ask a payer's system a structured question ("does this MRI need PA for this patient's plan?") and get back a structured, machine-readable answer. Without a common format, every provider-payer pair either builds a custom point-to-point connection (expensive, and there are thousands of provider-payer pairs) or falls back to the lowest common denominator: a fax machine or a web form a human fills out by hand.

**Integration**, in this document, means replacing that manual bridge with software that exchanges data automatically, using standards both sides agree on in advance — so a new payer or a new EHR doesn't require custom-building a new bridge from scratch every time.

---

## 2. HL7 and FHIR, in plain terms

**HL7 (Health Level Seven)** is the non-profit standards organization that has been writing data-exchange rules for healthcare software since the 1980s. "Level Seven" refers to the top (application) layer of a networking model — the point at which two different computer systems need to agree on what the data actually *means*, not just how to move bits around. HL7 doesn't build software; it publishes specifications that vendors (Epic, Oracle Health, insurance companies, everyone) agree to implement so their systems can talk to each other.

**FHIR (Fast Healthcare Interoperability Resources, pronounced "fire")** is HL7's modern data standard, built around web/internet conventions most engineers already know — **APIs** (Application Programming Interfaces — a defined way for one piece of software to request data or actions from another) that use standard web calls (HTTP, JSON/XML), rather than the older, more rigid, batch-file-based HL7 standards (like HL7 v2) that dominated healthcare IT for decades.

FHIR organizes data into **resources** — small, standardized building blocks, each representing one real-world healthcare concept: a `Patient` resource, a `Coverage` resource (insurance plan details), a `Claim` resource, a `QuestionnaireResponse` resource (answers to a form), and so on. For PA specifically, this matters because the entire prior-authorization conversation — "here's the patient, here's their coverage, here's the requested procedure, here's the supporting clinical documentation, here's the payer's decision" — can be expressed as a standardized package of FHIR resources, sent over a standard API call, instead of a payer-specific PDF form or a phone call. Any EHR that "speaks FHIR" and any payer system that "speaks FHIR" can, in principle, exchange this package without a custom integration for that specific pair.

---

## 3. The HL7 Da Vinci Project: the PA-specific FHIR playbook

FHIR by itself is a general-purpose data format — it doesn't tell two systems *when* to talk to each other or *what exact sequence of steps* a prior-authorization conversation should follow. That's the job of the **Da Vinci Project**, an HL7-run initiative where EHR vendors, payers, and health IT companies jointly write more specific "recipes" on top of FHIR, called **implementation guides (IGs)** — detailed technical specifications for one particular workflow. Four Da Vinci IGs matter most for PA, plus one supporting mechanism (CDS Hooks):

| Standard | What it does | Where it fires in the PA workflow |
|---|---|---|
| **CDS Hooks** (Clinical Decision Support Hooks) | Not itself a Da Vinci IG — a separate HL7 standard that defines the "triggers." It lets an EHR automatically call an outside service at a specific moment in a clinician's workflow (e.g., the instant an order is placed), and get back a "card" (a small pop-up with information or a link to act on). | The mechanism that fires CRD (and can launch DTR) at the moment a doctor places an order or books an appointment — before submission. |
| **CRD** (Coverage Requirements Discovery) | Lets the EHR ask the payer, in real time, "does this specific order need prior authorization, and if so, what documentation will you require?" — surfaced to the clinician at the point of ordering, not after the fact. | Point of ordering (earliest possible stage). |
| **DTR** (Documentation Templates and Rules) | Delivers the payer's specific clinical-documentation questionnaire directly into the EHR, and auto-fills as many answers as possible from data already in the patient's chart, using embedded logic (**CQL**, Clinical Quality Language) to know which chart fields answer which questions. | Documentation-gathering, immediately after CRD flags that PA is required. |
| **PAS** (Prior Authorization Support) | The actual electronic submission: bundles the request (a FHIR `Claim` resource) and the completed DTR questionnaire answers, sends it to the payer, and receives back a structured decision — approved, denied with a specific reason, or "pended" (payer needs more information). | Submission and decision — the step that actually replaces the fax/portal. |
| **CDex** (Clinical Data Exchange) | Handles the back-and-forth when a payer needs *more* clinical documentation than what PAS/DTR already captured — e.g., a pended request that needs additional chart notes or imaging reports. | Follow-up documentation requests, mid-review. |

**Maturity/adoption status (as of September 2026):** CRD, DTR, PAS, and the supporting HRex (Health Record Exchange) guide are all **published, stable HL7 standards** (CRD/DTR/PAS are at version 2.1.0/2.2.0, with a 2.2.0 ballot in progress for further refinement) — this is "official standard, finalized," not experimental. They are also **federally referenced**: CMS's own Prior Authorization API rule (Section 5, below) points directly to PAS as the technical basis for compliance. That said, "the standard is finalized" is different from "everyone has implemented it" — real production use is still concentrated among large payers and large EHR vendors (Epic being the most visible), with many smaller and mid-size payers still building or piloting as of this writing. CDex is comparatively less mature in production use than CRD/DTR/PAS.

---

## 4. Legacy/incumbent standards still in play

FHIR-based Da Vinci standards did not appear in a vacuum — they sit on top of, and in the near term must coexist with, older transaction standards that payers have run for years:

- **X12 278** — a **HIPAA-mandated** (Health Insurance Portability and Accountability Act — the federal law that, among other things, requires standardized electronic transactions and patient-data privacy protections) transaction standard for "Health Care Services Review – Request and Response." This is the older **EDI** (Electronic Data Interchange — structured, code-based file formats used for business transactions since the 1990s) format payers have used to process PA requests electronically for years, well before FHIR existed. It works, but it is rigid, harder for typical application developers to work with than a modern API, and adoption of the X12 PA-specific transaction by EHR vendors has historically been low compared to other X12 transactions like eligibility checks.
- **NCPDP standards** (National Council for Prescription Drug Programs) — the pharmacy industry's own, separate standard family, most relevantly **NCPDP SCRIPT**, used for electronic prescribing and pharmacy-specific electronic prior authorization (**ePA**). Pharmacy ePA achieved much higher real-world adoption than the medical-side X12 278, largely because the pharmacy ecosystem is narrower and more centrally coordinated (a small number of networks, chiefly **Surescripts**, connect nearly all US pharmacies and prescribers) — a simpler problem than the fragmented medical-benefit side.

**How they coexist with FHIR:** Rather than requiring payers to throw away X12 278 systems overnight, the Da Vinci PAS guide was deliberately designed to be a wrapper: a provider's EHR can submit a request using the modern FHIR API, and the payer's system is allowed to translate that internally into an X12 278 transaction before it reaches an older backend rules engine — the FHIR layer is a "front door," X12 can remain the "back office" plumbing. CMS has gone further and granted **enforcement discretion**, meaning a payer can run a fully FHIR-based Prior Authorization API without separately filing an X12 278 transaction at all, as long as they meet CMS-0057-F's requirements. In practice, expect three coexisting patterns at different payers for the next several years: FHIR-only, FHIR-with-X12-translation-underneath, and (for lagging or smaller payers) X12/portal-only.

---

## 5. CMS-0057-F: the technical mandate (API mechanics)

*(`pa-alternatives.md` covers this rule's policy intent — reducing friction, not reducing PA itself. This section focuses only on the technical "what must actually be built.")*

The **CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F)**, finalized January 2024, requires impacted payers (Medicare Advantage, most Medicaid/CHIP managed-care and fee-for-service programs, and ACA marketplace plans) to expose four specific FHIR-based APIs:

| API | What it must do | Deadline |
|---|---|---|
| **Patient Access API** (expanded) | Lets patients (via their own apps) pull their PA status/history alongside existing claims and clinical data | Jan 1, 2027 |
| **Provider Access API** | Payers must share claims, encounters, and PA data electronically with a patient's in-network providers | Jan 1, 2027 |
| **Payer-to-Payer API** | When a patient switches health plans, the new payer can electronically pull up to 5 years of PA/claims history from the old one | Jan 1, 2027 |
| **Prior Authorization API** | Built on the **Da Vinci PAS** implementation guide (with CRD/DTR as the supporting discovery/documentation steps) — lets an EHR submit a PA request and get back a decision electronically, for medical items/services (this specific API requirement does not cover drug PAs) | Jan 1, 2027 |

Technical specifics worth a CTO's attention:
- **Required underlying versions:** the operative Da Vinci IG versions referenced are CRD/DTR/PAS 2.1.0 (with newer ballots in progress), alongside **US Core 6.1.0** (a baseline FHIR profile for core clinical data) and **SMART App Launch 2.0.0** (the standard for securely authorizing an app to access a FHIR API on a user's behalf) — servers are expected to support multiple US Core versions simultaneously, since providers will migrate at different speeds.
- **Response-time expectations differ by stage:** CRD calls (the "does this need PA" check) are expected to be synchronous and fast — industry guidance targets roughly a five-second response — because they happen live, in front of a clinician placing an order. PAS submissions can be asynchronous, and the rule separately requires payers to return a PA decision within **72 hours for urgent requests and 7 calendar days for standard requests** (a related, non-API requirement that took effect starting in 2026).
- **The rule doesn't just target payers — it also creates provider-side obligations.** Under a related CMS incentive-program requirement, eligible hospitals must actually *use* the Prior Authorization API — specifically, attest that they requested at least one prior authorization electronically via the API (using data from their certified EHR) during the 2027 reporting period, or report a valid exclusion. In other words, the mandate isn't satisfied just by payers building an API that nobody calls — provider EHR systems are expected to demonstrate real usage.
- **FHIR vs. X12 flexibility remains:** as noted above, CMS allows an all-FHIR path, and does not force payers to retire X12 278 by this deadline, as long as the FHIR-facing Prior Authorization API itself meets the requirements.

---

## 6. How EHR vendors are actually implementing this

| Vendor | What's live/announced | Notes |
|---|---|---|
| **Epic** | **Epic Payer Platform**, using CRD to surface PA requirements at the point a clinician places an order or books an appointment, followed by DTR (documentation) and PAS v2.1.0 (submission) for the full loop. Live, in production, with UnitedHealthcare, Aetna, and Network Health as connected payers, and 16 more payers in active integration testing. Four health systems — **Ochsner Health, Froedtert ThedaCare, Denver Health, and Summit Health** — went live with real-time CRD checks more than five months ahead of the CMS January 2027 deadline. | This is the most publicly detailed, production-grade EHR-side implementation found in this research — not a pilot or a press-release-only announcement. |
| **Oracle Health (Cerner)** | Building FHIR R4 APIs meeting ONC certification requirements (the federal certification program for EHR technology), including USCDI (a defined core dataset) support, SMART on FHIR authentication, and bulk-data access — the technical foundation the Da Vinci PA IGs are built on. Public reporting on Oracle Health's specific CRD/DTR/PAS production rollouts (as opposed to Epic's) was thinner and less independently detailed in sources found during this research. | Treat as "building toward the same standards" rather than having the same publicly verified depth of live customer deployments as Epic. |
| **athenahealth** | A named joint project with **Availity** (a large payer-connectivity clearinghouse) and **Humana**: a provider initiates a PA inside athenahealth, it routes through Availity's FHIR gateway to Humana's FHIR server, and the decision flows back — using CRD, DTR, and PAS together as an integrated pipeline. The project won a KLAS (a healthcare-IT research firm) innovation award. | A concrete example of a three-party (EHR + clearinghouse + payer) FHIR pipeline actually working end-to-end, not just each side separately claiming FHIR support. |

**Read across vendors:** the pattern is consistent — CRD fires at order time via CDS Hooks, DTR follows to gather documentation, PAS carries the submission and decision. Epic's version is the most mature and most independently verified as live, production infrastructure; other major EHRs are moving the same direction but with less public first-party evidence found in this research.

---

## 7. Integration architecture: how the pieces actually connect

A simplified, plain-language view of the typical technical path from "doctor places an order" to "payer sends back a decision," under the modern FHIR-based model:

```
1. Clinician places an order inside the EHR (e.g., orders an MRI)
        │
        ▼
2. EHR fires a CDS Hooks call ("order-select" or "order-sign" event)
        │
        ▼
3. Payer's CRD service responds in real time:
   "Yes, this needs PA" + "here's what documentation we'll need"
        │
        ▼
4. EHR launches a DTR session: pulls the payer's FHIR Questionnaire,
   auto-fills answers from the patient's chart data, clinician
   reviews/completes any remaining fields
        │
        ▼
5. EHR (via PAS) bundles the completed questionnaire + a FHIR Claim
   resource into a request, sends it to the payer's FHIR-facing
   "gateway" — often via a clearinghouse (e.g., Availity) sitting
   between the EHR and the payer, rather than a direct connection
        │
        ▼
6. Payer's gateway translates/routes the request into its internal
   adjudication engine (this backend is very often still a legacy
   rules engine, sometimes fed via an X12 278 translation step)
        │
        ▼
7. Decision comes back through the same FHIR/PAS path:
   approved / denied (with a specific reason) / pended (more
   info needed, handled via CDex)
        │
        ▼
8. If pended: CDex requests/exchanges the additional clinical
   documentation, looping back toward step 7
```

The one detail worth calling out for a CTO: **the clearinghouse rarely disappears** in this picture — it usually just gets a FHIR-facing "coat of paint" (see Section 8). Very few providers connect directly, point-to-point, to a payer's FHIR server; most traffic still passes through an intermediary that already had the payer relationships built for older EDI (X12) transactions like eligibility and claims.

---

## 8. Known integration challenges and limitations

- **Payer FHIR-readiness lags the deadline.** As of early-to-mid 2026, only a handful of large payers had standards-aligned Prior Authorization APIs live in production; most were still in development or pilot stages, with the January 2027 deadline inside a year out. Expect some payers to ship minimal-viable compliance rather than full-featured implementations, and some to request extensions or face enforcement questions.
- **Interoperability is a two-way requirement, and provider-side readiness is uneven.** Even where a payer's API is ready, a small practice's EHR (or the practice's own IT capacity) may not be — smaller and rural provider organizations in particular lack the engineering resources that large health systems and large EHR vendors have to build and maintain FHIR integrations.
- **Clearinghouses are not going away — they're repositioning as the FHIR translation layer.** Companies like **Availity** (and others in this space) already aggregate payer connectivity for claims and eligibility; rather than being disintermediated by FHIR, they are building FHIR gateway capabilities on top of their existing payer relationships, so many providers will reach payer PA APIs *through* a clearinghouse rather than connecting directly.
- **Data-quality and documentation-matching problems don't disappear just because the pipe is now an API.** DTR is required to accept any questionnaire response that is technically valid against the published data profile — but if PAS then rejects that same submission for a different, business-logic reason (e.g., the clinical answer doesn't actually satisfy the payer's medical-necessity criteria), the workflow breaks even though every step was technically "standards-conformant." Standardizing the pipe does not standardize the judgment call at the other end.
- **Rules-consistency risk between CRD and DTR.** Since CRD (which flags that PA is needed) and DTR (which serves the actual questionnaire) are typically powered by the same underlying payer policy logic, payers need a single, well-maintained rules repository — if the two drift out of sync, a case can be flagged as needing PA by CRD but then served the wrong (or an outdated) questionnaire by DTR.
- **Provider-side "meaningful use" risk.** Because CMS requires hospitals to actually demonstrate use of the Prior Authorization API (not just have access to one), a health system's EHR configuration, staff training, and workflow adoption all have to catch up to the technical capability — a live API that clinical staff route around (because the fax or portal habit is faster in practice) doesn't satisfy the spirit of the rule, and risks the attestation requirement.
- **Security and cross-organization data exchange.** API-based exchange between a provider and a payer's system — two separate organizations, each a HIPAA-covered entity — raises the same authentication, authorization-scope, and audit-logging questions as any cross-organization API: standards like **SMART App Launch** (secure app authorization) address the technical mechanics, but a payer or provider still has to correctly configure access scopes, key management, and logging on their own side — the standard enables secure exchange, it doesn't guarantee a given implementation is configured securely.
- **Legacy back-ends persist underneath a modern front door.** Even a payer with a shiny FHIR API may be translating requests internally into an X12 278 transaction feeding a decades-old adjudication system — meaning the *speed and reliability* of a "modern," FHIR-based PA request can still be bottlenecked by the legacy system it ultimately depends on.

---

## 9. Synthesis: standards and their role

| Standard / IG | What it does | Workflow stage | Maturity / adoption status |
|---|---|---|---|
| **HL7 FHIR** | General-purpose, API-based healthcare data-exchange format (the foundation everything else below is built on) | Underlying data layer for all stages | Official, mature core standard; widely adopted across the industry |
| **CDS Hooks** | Triggers an external service call from inside the EHR at a defined clinical moment (e.g., placing an order) | Trigger mechanism for CRD/DTR | Official, stable HL7 standard; in production use at major EHRs |
| **CRD** (Coverage Requirements Discovery) | Real-time "does this need PA" check at point of ordering | Point of ordering | Finalized Da Vinci IG (v2.1.0/2.2.0 ballot); production use at Epic + several large payers; referenced directly by CMS-0057-F |
| **DTR** (Documentation Templates and Rules) | Delivers and auto-fills the payer's required clinical questionnaire | Documentation gathering | Finalized Da Vinci IG; production use growing alongside CRD/PAS |
| **PAS** (Prior Authorization Support) | Electronic submission of the PA request and receipt of the decision | Submission and decision | Finalized Da Vinci IG; the explicit technical basis for CMS-0057-F's Prior Authorization API requirement (deadline Jan 1, 2027) |
| **CDex** (Clinical Data Exchange) | Exchanges additional clinical documentation for "pended" requests | Mid-review follow-up | Finalized Da Vinci IG; least mature in real-world production use of the four |
| **X12 278** | Legacy, HIPAA-mandated EDI transaction for PA requests | Submission and decision (legacy path) | Long-standing HIPAA-mandated standard; low historical EHU-side adoption; still runs "underneath" many FHIR-facing systems, or can be bypassed under CMS enforcement discretion |
| **NCPDP SCRIPT** | Pharmacy-specific electronic PA standard | Submission and decision (pharmacy PA only) | Mature, high-adoption legacy standard for drug PA, largely via Surescripts network; separate track from the medical-benefit CRD/DTR/PAS/CMS-0057-F path |
| **CMS-0057-F Prior Authorization API** | Federal mandate requiring impacted payers to expose a PAS-based FHIR API | Regulatory umbrella over submission/decision | Finalized federal rule (Jan 2024); compliance deadline Jan 1, 2027; payer readiness as of Sept 2026 is uneven, pilot-to-partial-production |

---

## Sources & Methodology

**Methodology:** This document was produced from live web searches and page fetches conducted in September 2026 (not from model memory), focused specifically on the integration/interoperability layer of PA — HL7/FHIR fundamentals, the Da Vinci Project's PA-relevant implementation guides (CRD, DTR, PAS, CDex) and CDS Hooks, legacy X12/NCPDP standards, the technical mechanics of CMS-0057-F, EHR vendor implementations (Epic, Oracle Health/Cerner, athenahealth), and known integration challenges. Claims about standards maturity are based on whether an implementation guide is published/finalized by HL7 versus still in ballot/draft, and whether production deployments (not just pilots or announcements) could be independently confirmed via trade press or vendor/health-system joint statements. Vendor-specific performance or adoption claims are presented as reported by the vendor or health system named, consistent with the labeling convention used in the sibling documents in this folder.

**Sources used:**
- [HL7 Da Vinci Project Update — HL7 News](https://hl7news.hl7.org/2026/05/30/hl7-da-vinci-project-update/)
- [Documentation Templates and Rules Implementation Guide Home Page (DTR v2.2.0) — HL7](https://hl7.org/fhir/us/davinci-dtr/en/)
- [DTR Metrics — Da Vinci DTR v2.2.0](https://build.fhir.org/ig/HL7/davinci-dtr/en/metrics.html)
- [Technical Background — Da Vinci Prior Authorization Support (PAS) FHIR IG v2.2.0-ballot](https://build.fhir.org/ig/HL7/davinci-pas/background.html)
- [Prior Authorization Implementation Guide Home Page — Da Vinci PAS](https://build.fhir.org/ig/HL7/davinci-pas/)
- [Use Cases and Overview — Da Vinci PAS FHIR IG](https://build.fhir.org/ig/HL7/davinci-pas/usecases.html)
- [CDex ImplementationGuide Resource — Da Vinci Clinical Data Exchange](https://build.fhir.org/ig/HL7/davinci-ecdx/ImplementationGuide-hl7.fhir.us.davinci-cdex.html)
- [The Standard | The Official Blog of HL7 | CDex](https://blog.hl7.org/topic/cdex)
- [Da Vinci HL7 FHIR® Project Implementation — Kodjin](https://kodjin.com/blog/da-vinci-project-implementation-healthcare/)
- [Prior Authorization Rule: CDS Hooks (Series Part 4 of 6) — Smile Digital Health](https://www.smiledigitalhealth.com/our-blog/prior-authorization-part-4-cds-hooks)
- [A technical guide to the Prior Authorization API under CMS-0057-F — Firely](https://fire.ly/blog/a-technical-guide-to-the-prior-authorization-api-under-cms-0057-f/)
- [CRD | Payerbox Docs — Health Samurai](https://www.health-samurai.io/docs/payerbox/prior-auth/crd)
- [Why CRD is the starting point for seamless prior authorization — Firely](https://fire.ly/blog/prior-authorization-with-crd-explained/)
- [1.0 — CDS Hooks — HL7.org](https://cds-hooks.hl7.org/1.0/)
- [Supported Hooks — Da Vinci Coverage Requirements Discovery v2.2.1](https://build.fhir.org/ig/HL7/davinci-crd/branches/__default/en/hooks.html)
- [What is CDS Hooks? — Taction](https://www.tactionsoft.com/glossary/cds-hooks/)
- [CMS Interoperability and Prior Authorization Final Rule CMS-0057-F — CMS.gov](https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f)
- [CMS-0057-F Final Rule: 4 FHIR APIs Due by 2027 — Health Samurai](https://www.health-samurai.io/articles/understanding-the-cms-0057-f-interoperability-and-prior-authorization-final-rule)
- [CMS 0057: Prior Authorization Rule Guide — Neolytix](https://neolytix.com/articles/cms-0057/)
- [Epic Launches Coverage Requirements Discovery API with Ochsner, Froedtert, Denver Health, and Summit Health — HIT Consultant](https://hitconsultant.net/2026/08/17/epic-deploys-real-time-crd-prior-authorization-apis-ochsner-froedtert/)
- [open.epic :: Explore By Interface Type (FHIR)](https://open.epic.com/interface/FHIR)
- [Epic Payer Platform Guide for Payer-Provider Integration — Mindbowser](https://www.mindbowser.com/epic-payer-platform-guide/)
- [Health systems test real-time prior auths through Epic — TechTarget](https://www.techtarget.com/revcyclemanagement/news/366649207/Health-systems-test-real-time-prior-auths-through-Epic)
- [Four health systems go live with Epic's real-time prior authorization checks — Fierce Healthcare](https://www.fiercehealthcare.com/health-tech/ochsner-summit-health-among-health-systems-launch-real-time-prior-authorization-checks)
- [X12 EDI Transactions: A Guide to Healthcare's 270/271 & 278 — IntuitionLabs](https://intuitionlabs.ai/articles/x12-edi-transactions-guide)
- [ePA Explained: NCPDP SCRIPT & Surescripts Prior Authorization — IntuitionLabs](https://intuitionlabs.ai/articles/ncpdp-script-epa-surescripts)
- [X12 278 Prior Authorization: HIPAA Standard vs FHIR PAS — Redix](https://redix.com/blogs/architecture/why-278-pas)
- [SCRIPT Electronic Prior Authorization Transactions Overview — NCPDP](https://www.ncpdp.org/ncpdp/media/pdf/ncpdp_script_epa_standard.pdf)
- [Federal Register: Interoperability Standards and Prior Authorization for Drugs (2026 rule)](https://www.federalregister.gov/documents/2026/04/14/2026-07205/medicare-and-medicaid-programs-patient-protection-and-affordable-care-act-interoperability-standards)
- [Oracle Health (Cerner) Referral & Prior Auth Automation (2026) — Linear Health](https://linear.health/blog/oracle-health-cerner-prior-auth-automation)
- [FHIR Prior Authorization: CRD, DTR & PAS Architecture Guide — CapMinds](https://www.capminds.com/blog/fhir-prior-authorization-architecture-pack-crd-dtr-pas-sequence-diagrams-and-readiness-checklist/)
- [Cerner Oracle Health Integration Guide 2026 — FHIR + HL7 Playbook — Taction](https://www.tactionsoft.com/blog/cerner-oracle-health-integration-guide/)
- [The FHIR-First Mandate: Why 2026 is the Critical Turning Point for Prior Authorization — eFax](https://www.efax.com/blog/fhir-prior-authorization-mandate-2026-trends)
- [Many payers, providers unprepared for interoperability and prior authorization rule, WEDI finds — Healthcare Finance News](https://www.healthcarefinancenews.com/news/many-payers-providers-unprepared-interoperability-and-prior-authorization-rule-wedi-finds)
- [Your Guide to CMS-0057-F Compliance — Tegria](https://www.tegria.com/resources/thought-leadership/your-guide-to-cms-0057-f-compliance/)
- [End-to-End Prior Authorizations Using FHIR APIs — Availity case study](https://www.availity.com/case-studies/end-to-end-prior-authorizations-using-fhir-apis/)
- [Availity for Payers: Analysis of EDI & Interoperability — IntuitionLabs](https://intuitionlabs.ai/articles/availity-platform-payers-analysis)
- [Using Da Vinci Implementation Guides for End-to-End Prior Authorization — HIMSS24 session handout](https://himss24.mapyourshow.com/mys_shared/himss24/handouts/Session151.pdf)
- [Da Vinci Prior Authorization Support (PAS) FHIR IG — HL7.org](https://www.hl7.org/fhir/us/davinci-pas/)
- [Enhancing Healthcare Interoperability: Launching the Da Vinci PAS Test Kit — ONC Blog](https://healthit.gov/blog/interoperability/enhancing-healthcare-interoperability-launching-the-davinci-prior-authorization-support-pas-test-kit/)
