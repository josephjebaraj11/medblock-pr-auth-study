# 00 — Source Analysis

**What the `prior-authorization/` folder actually says, and what it leaves open.**

| | |
|---|---|
| Analysed | 1 October 2026 |
| Scope | `medblock-pr-auth-study/prior-authorization/` recursively, plus the top-level study pages in `medblock-pr-auth-study/` |
| Files in tree | 16,905 — of which **~16,780 are `node_modules`, vendored repos and video screenshots**. 125 carry requirements or decisions. |
| Method | PDFs via `pdftotext -layout`; DOCX/XLSX/XLSM via LibreOffice; HTML via BeautifulSoup; image-only PDFs and screenshots rendered and read visually. |
| Convention | Every requirement below is traced to its file. Anything I inferred is marked **[Assumption]**. |

---

## 1. What this folder is

It is a **consulting discovery pack plus a research library** for an AI prior-authorization agent, assembled between August and October 2026. It contains four distinct layers, and distinguishing them matters because they carry very different authority:

| Layer | What it is | How much it binds the design |
|---|---|---|
| **Client voice** | The client's original unedited requirements write-up | **Highest** — this is the actual ask |
| **Consulting deliverables** | Vision & Scope, Roadmap, Onboarding Costs, Discovery Questionnaire, pricing models | **High** — proposed, but *not yet signed*, and the questionnaire is *entirely unanswered* |
| **Independent research** | Five CTO-facing research reports + two architecture blueprints | **Advisory** — well-sourced, labels vendor claims vs. verified facts |
| **Prior build output** | `clearauth-solution-blueprint.md`, `clearauth-prototype.html`, the `web/` marketing site | **Precedent** — a previous run of essentially this same prompt |

The most important structural fact: **this folder has already been through one round of this exercise.** `docs/prototype-build-prompt.md` is the prompt, and `docs/clearauth-solution-blueprint.md` (820 lines) + `prototype/clearauth-prototype.html` are its outputs. My job is the *next* iteration under a new brand and a wider scope (payer-side roles, FHIR data models, Medblocks-style connector layer).

---

## 2. Every file reviewed

### 2.1 Client voice — the original ask

| File | One-line summary |
|---|---|
| `docs/discovery…/1_WHY_Client_Original_Requirements.pdf` | The founding document. Client's own words describing **VICE** (A/R collection agent) and **ClearAuth AI** (prior-auth agent), the MRI/CPT 72148 example, the electronic→portal→voice→human waterfall, the "doctor just clicks GET AUTHORIZATION" thesis, and the explicit boundary that the AI must never make medical judgments. Names competitors it admires: Infinx, Operator Labs, Waystar, Akomi, Champ AI, Flexbone AI, Infinitus. |
| `docs/discovery…/WhatsApp Image 2026-09-02 at 8.12.50 PM.jpeg` | Screenshot of AI-search results: **AMA surveys — 39–43 PAs per physician per week ≈ 160–175/month**; 10-physician practice ≈ 1,600–1,750/month; **12–14 hrs/week staff time**; **40% of practices hire staff exclusively for PA**. |
| `docs/discovery…/WhatsApp Image 2026-09-02 at 8.12.50 PM (1).jpeg` | Continuation: **$20–$30 out-of-pocket per manual PA**; 2026 industry shift toward AI PA agents reducing submission from **20+ min to under 5 min**. Sourced to "AVIA Health +1" in the screenshot. |

### 2.2 Consulting deliverables — proposed, unsigned

| File | One-line summary |
|---|---|
| `docs/discovery…/3_WHAT_MVP_VICE_ClearAuth_Vision_and_Scope_Confirmation.pdf` + `VICE_ClearAuth_Vision_and_Scope_Confirmation.docx` | **The single most requirement-dense document.** 13 sections: Phase One objective, both agents' workflows, status/classification logic, human-control boundaries + the Shadow→Supervised→Wider **trust ramp**, expected outputs, integration expectations + five connector types, tenancy + three-tier admin + onboarding flow, compliance guardrails, operational knowledge to maintain, what's needed from the client, phased rollout, and 9 confirmation questions. Status line reads *"Discussion draft — for review and confirmation, not yet approved."* |
| `docs/discovery…/2_WHAT_ClearAuth_VICE_6_Month_Roadmap.html` | "Cascade Healthcare Revenue Automation Platform" roadmap. ClearAuth 0–2 months → VICE 3–4 → platform/SMB 5–6. Two PODs. Benchmarks Infinx (8 shared OS layers), Operator Labs (voice as a *channel adapter*, not a product), Waystar (connectivity graph as the moat). States the architecture rule: **external integrations stay native (FHIR/HL7/X12/REST/SFTP/SOAP/SIP); MCP is an internal tool facade only.** |
| `docs/discovery…/1.1_VICE_ClearAuth_Discovery_Questionnaire.xlsm` | **107 discovery questions** across 24 sections (25 marked "MVP1 – Must Have", 82 "Post-MVP"). **Every single one has an empty Client Response and Status = Open.** See §6 — this is the largest gap in the folder. |
| `docs/discovery…/ClearAuth_AI_Onboarding_Costs_Breaktup.html` + `…Client_Standard.pdf` | Onboarding priced by **integration complexity, not physician count**. Formula: `H = 34 + 0.25P + 3E + 4B + N`, at **$50/hr**, ×1.15 contingency → **$3,000–$3,500** standard. Derives payback in ~5–8 days against the $20–30/PA burden. Explicitly assumes **n8n** as the workflow layer. |
| `docs/discovery…/PRICE_ClearAuth_AI_Market_Licensing_Breakeven_Model_OpenAI.xlsx` | **The best-sourced numbers in the folder.** CAQH 2024 published PA volumes: **95M fully electronic, 123M partially electronic, 54M manual = 272M total US medical PAs/yr.** Provider cost per transaction: **$5.38 electronic / $8.93 partial / $12.88 manual.** Core SAM = 177M non-fully-electronic × $4 = ~$708M/yr. |
| `docs/discovery…/PRICE_AI_PriorAuth_Healthcare_TAM_SAM_SOM_US_Canada.xlsx` + `_V2.xlsx` | Software TAM $12.96B US / $13.4B US+Canada, SAM $5.36B, SOM $80M base–$161M upside, via a 12% software-capture assumption and 1.5–3% share. State/province allocations. Names the competitive set: Cohere Health, Rhyme, Availity, Waystar, Myndshft, XSOLIS. |
| `docs/discovery…/Ideas/*.pdf` (8 files) | Rendered screenshots of a competitor's **Gumroad storefront** ("PA Workflow Systems") selling SOP/template products: $999 "PA Operations System — Department Edition", a $15 "Top 10 Reasons PAs Get Delayed" guide, survival kit, intake audit tool, call-script tool, status-tracker system. **Low-tech, process-template competitors** — useful as a failure taxonomy (see §4.4), not as technology rivals. |

### 2.3 Research library

| File | One-line summary |
|---|---|
| `README.md` | Repo index. States plainly: *"This is currently a documentation-only repository… No implementation exists yet."* |
| `docs/prior-authorization-study.md` | The original agentic-AI proposal: problem statement, six agent roles (Clinical, Coverage, Compliance, Decision, Submission, Follow-Up) under an Orchestrator, four technical layers (foundation models → RAG → tool calling → human-in-the-loop), and a 7-point best-practice recommendation. |
| `docs/research/pa-integrations.md` | **The spine of the connector design.** FHIR/HL7 in plain terms; the Da Vinci IGs (CRD/DTR/PAS/CDex) + CDS Hooks with what each does and when it fires; legacy X12 278 and NCPDP SCRIPT; CMS-0057-F's four APIs and mechanics; how Epic, Oracle Health and athenahealth are actually implementing; 8 named integration challenges. Fully sourced. |
| `docs/research/pa-best-solution.md` | Synthesis + recommendation: build on Da Vinci standards not custom integrations, multi-agent with confidence-tiered HITL, start narrow, treat Jan 1 2027 as the forcing function. Contains the HIPAA checklist and the three cautionary tales. |
| `docs/research/pa-tech-landscape.md` | Vendor architectures: Microsoft's open-source multi-agent accelerator, Google's Claims Acceleration Suite, AWS's three reference architectures (most compliance detail), and the **n8n cautionary case**. Labels every performance number as vendor-reported. |
| `docs/research/pa-competitors.md` | Who is deploying: payers, PBMs, health systems, startups. Separates **[Vendor claim]** / **[Customer case study]** / **[Independent]**. The independent counter-narrative: PHTI 2026 found AI PA tools reduce *internal* effort but have **not** been shown to lower system-wide cost. |
| `docs/research/pa-alternatives.md` | Can PA be replaced? Gold-carding (narrow, revocable), value-based care (the only structural alternative, minority of spend), RTPB (earlier warning, same rule), CMS-0057-F (digitizes, doesn't reduce), insurer pledges (real but partial). **Conclusion: the industry automates and narrows PA; it does not replace it.** |
| `docs/research/html/*.html` + `diagrams.js` | Six Mermaid-based visual companions to the five reports; click-to-enlarge modal. Content mirrors the Markdown. |
| `reference/Healthcare-Interop-PA-Platform-Architecture-Blueprint-v2.pdf` / `.html` (also duplicated at `docs/discovery…/Prior_Auth/`) | **113 pages, the deepest technical document in the folder.** §10.3 standards table with exact version baselines; §10.4 eight ADRs; §11.2 EHR-by-EHR integration comparison (Epic / Oracle Health / athenahealth / eCW / MEDITECH); §12.1 payer categories by regulatory position; §12.4 the **payer-capability decision tree** ("never default to *not required*"); §14.2 a 25-entity catalog with PHI sensitivity and retention; §15 terminology normalization. Labels each claim *Verified / Inferred / Recommended / Needs validation*. |
| `reference/Healthcare-Interoperability-Prior-Authorization-Blueprint.pdf` | The v1 of the above, shorter. |
| `docs/output-video-1/Prior-Authorization-Agentic-AI-Panel-Walkthrough.docx` + 22 screenshots | Walkthrough of an industry panel on agentic AI for PA: current-state portals, operational breakdowns, clinical vs. financial PA, cancellations/no-shows, escalation triggers, CFO ROI, in-house vs. outsourced trends, documentation bottlenecks, why PA suits AI, what to automate next, unstructured data. |
| `docs/output-video-2/CMS-0057-F-Prior-Authorization-Rule-Walkthrough.docx` + 21 screenshots | Walkthrough of the CMS-0057-F rule and Da Vinci stack: the four APIs and the 2027 deadline, provider APIs G31–33, the MIPS e-prior-auth measure, CDS Hooks feedback loop, CRD success scenarios, discovery endpoint, `order-select`/`order-sign` hooks, CRD→DTR sequence, composability/prefetch, and the **Inferno CRD test kit**. |
| `docs/output-video-3/MedGemma-Google-Open-Health-AI-Models-Walkthrough.docx` + 23 screenshots + `sources/` | Google's open health AI models (MedGemma, HAI-DEF). Relevant for the **PHI-boundary option**: self-hostable open-weight medical models. `sources/` vendors the MedGemma repo and four demo apps — *noted, not treated as requirements*. |

### 2.4 Prior build output

| File | One-line summary |
|---|---|
| `docs/prototype-build-prompt.md` | The reusable prompt that produced the blueprint + prototype. Its "Rules" section states the four non-negotiables: agent never makes medical-necessity decisions, every denial to a licensed human, electronic→portal→voice→human, prefer the folder's own decisions. |
| `docs/clearauth-solution-blueprint.md` | **820-line prior solution document.** 20 sections. Its §2.2 contradictions table (C1–C6) and §19 decisions table (D1–D9) are the most valuable part — they are the unresolved questions, already catalogued. I carry them forward in §6. |
| `docs/clearauth-end-to-end-flow.md` | One PA request end-to-end in 8 stages, each with a "▶ What happens" (user view) and "⚙ Under the hood" (agent role / connector / standard) lens. Plus the platform layer: Keycloak realm-per-tenant identity, the four personas, notifications with **no PHI in payload**, patient journey, and Stripe billing. |
| `docs/Roadmap.drawio.png` | Hand-drawn architecture sketch. Dashboard flow (Input Patient → Provider → EHR → Business rules → Approve/more info/Deny → end) over a Platform blob containing MCP Server, API/WebHooks, webhooks, AgentsPrompts, PatientJourney, Provider Connector, EHR Connector, email, Stripe, multi-tenant — feeding Provider (UnitedHeal, MedCore, MCES) and EHR (Epic, Athena, Oracle Health). Voice agent on the outside. |
| `prototype/clearauth-prototype.html` | 125KB single-file clickable prototype. Screens: Today, Exception queue, All cases, Case drawer, My orders/New order, Patient journey, Clinical review, Automation rules, Payer requirements, Connections, Users & roles, Audit log, Billing, Tenants, Connector registry, Onboarding, plus a Blueprint section. **Provider-side only — no payer-side roles.** |
| `web/` (React Router 7 + TS + Tailwind marketing site) | **Package name: `nexauth-ai-web`. `tailwind.config.ts` header: "Nexauth AI design tokens."** Full semantic token system (surface/content/line/tint) over ink/brand/aqua/accent/mint/signal palettes, WCAG-checked pairings, light+dark via CSS variables in `app.css`, Inter + Source Serif 4. |

### 2.5 Top-level study pages (context, not requirements)

`medblocks-basics.html` (the five layers: Source → Connection → Pull → Updates → Data out), `medblocks-case-study.html`, `medblocks-teardown.html`, `build-your-own.html`, `five-healthcare-standards.html`, `cms-0057-f.html`, `medgemma-in-practice.html`.

**`medblocks-basics.html` is the explicit model for Phase 5.** Its five layers map directly onto the connector architecture: a *Source* is an EHR or payer system; a *Connection* is a per-tenant, per-source authorized link that can independently lapse; a *Pull* is a background fetch; *Updates* are the webhook events (including `connection.token_refresh_failed`, the one that justifies the whole layer); *Data out* is export / API read / downstream workflow.

### 2.6 Noted but not read as requirements

`web/node_modules/` (~16,000 files), `web/.react-router/types/`, `docs/output-video-3/sources/medgemma/` and `sources/demo-apps/` (vendored Google repos: rad_explain, appoint-ready, rad_learning_companion, ehr-navigator-agent), and the ~66 video screenshots whose content is already transcribed in the three `.docx` walkthroughs.

---

## 3. Stakeholders the folder identifies

| Stakeholder | Where from | What they need |
|---|---|---|
| **Ordering physician** | Client requirements; end-to-end flow §cast | One button. "The doctor doesn't care how the authorization gets obtained." |
| **Practice / RCM / operations staff** | Client requirements §4; Vision & Scope §5 | To see *only* exceptions, each pre-loaded with context — not a queue of everything |
| **Clinical reviewer (licensed)** | Vision & Scope §4, §8; end-to-end flow | A distinct, audited role. Medical necessity, peer-to-peer, denials. Kept separate **on purpose** so only licensed people make — and are audited for — medical calls |
| **Tenant Admin (practice's own)** | Vision & Scope §7 | Users, roles, auto-submit thresholds, escalation routing, payer-matrix overrides, the tenant's audit log — *as configuration, never a code change* |
| **Master Admin / platform operator** | Vision & Scope §7 | Tenants, connector registry, cross-tenant health — **never PHI** |
| **Patient** | end-to-end flow §patient journey; `pa-integrations.md` §5 | Benefits indirectly today. From Jan 2027, CMS **Patient Access API** must expose PA status/history to patient apps |
| **Payer-side reviewers** | `pa-tech-landscape.md` (Microsoft accelerator), `pa-competitors.md` (Cohere Health, Anterior) | ⚠️ **Present in the research, absent from every client/consulting document.** See §6, Gap G1. |

> **What was built from this table.** Three personas, not seven. The client's own persona table (end-to-end flow §identity) names four — Staff/Operations, Clinical reviewer, Tenant Admin, Master Admin — and the two admins are one persona with two reaches, because the difference between them is scope and not screens. The ordering physician has no seat: their one action, *GET AUTHORIZATION*, is placed by Operations or arrives from the EHR at `order-sign`. The payer-side reviewers and the patient portal were modelled in an earlier draft and have been **withdrawn** (G1, G4): payers are counterparties reached through connectors, and patient access is a 2027 obligation served through the practice. See `01-personas-and-journeys.md` §3.

---

## 4. Pain points, workflow and rules found in the material

### 4.1 The pain, quantified

| Figure | Value | Source | Credibility |
|---|---|---|---|
| US medical PA volume | **272M/yr** (95M electronic, 123M partial, 54M manual) | `PRICE_…Breakeven_Model` (CAQH 2024) | **Strongest in the folder** — named industry body, published |
| Provider cost per PA transaction | **$5.38 / $8.93 / $12.88** by mode | same (CAQH 2024) | Strong |
| PAs per physician | 39–43/week ≈ 160–175/month | WhatsApp screenshot (AMA surveys) | Medium — screenshot of a search result, not the AMA source itself |
| Staff time | 12–14 hrs/week per physician | same | Medium |
| Practices hiring dedicated PA staff | 40% | same | Medium |
| Manual cost per PA | $20–30 | same, reused throughout the costs page | Medium — and *conflicts* with CAQH's $12.88 for fully manual |
| Time reduction | 20+ min → under 5 min | same ("AVIA Health +1") | Weak — vendor-adjacent |
| System-wide savings | **Not demonstrated** | `pa-competitors.md` §5 (PHTI 2026) | **Independent** — the one non-vendor study |

The folder is unusually honest about this: `pa-best-solution.md` §7 says plainly that every other number in the space is vendor-reported, and that faster provider submission can trigger more payer-side scrutiny — an "AI arms race" dynamic.

### 4.2 The workflow everything agrees on

Every document — client, consulting, and research — converges on the same shape:

```
order → eligibility (270/271) → is PA required? (CRD / 278 / payer matrix)
     → assemble packet (DTR) → decide + gate → submit (waterfall)
     → pended/RFI loop (CDex) → decision → write back → expiry watch
```

with the submission waterfall ordered by cost: **electronic → payer portal (browser) → voice → human.**

### 4.3 Payer rules the folder specifies

- **Decision timeframes: 72 hours expedited / 7 calendar days standard** — CMS-0057-F, in effect for impacted payers since 1 Jan 2026 (`pa-integrations.md` §5; blueprint v2 §12.1).
- **"Not required" is a positive, evidenced assertion** — result, source, date and reference number written to the record. **Never a silent default** (`clearauth-end-to-end-flow.md` §2; blueprint v2 §12.4 is emphatic: *"never default to 'not required'"*).
- **Partial / modified approval is a first-class outcome**, not a yes/no (end-to-end flow §6; Vision & Scope §3C).
- **Automated-caller permission is per-payer**; recording consent is **one-party vs. two-party by state**, checked per call (Vision & Scope §8).
- **Impacted payers** = Medicare Advantage, Medicaid/CHIP (FFS + managed care), ACA/QHP on FFEs. **Not** commercial employer plans, **not** Medicare FFS (blueprint v2 §12.1).
- **Payer capability varies per payer, per product line** — the system must degrade CRD→matrix, DTR→checklist, PAS→278→portal→fax, recording which branch it took (blueprint v2 §12.4).
- **PA is a HIPAA "payment" disclosure**, so the treatment exception does not apply — **minimum-necessary by construction** (end-to-end flow §3; blueprint v2 §1.5).

### 4.4 Why PAs get delayed — a reason taxonomy

From the competitor's "Top 10 Reasons" infographic (`Ideas/pa-top-10-failures.pdf`), top five causes: **missing or incomplete clinical documentation; incorrect or missing CPT/ICD codes; authorization requirement not verified; payer-specific requirements not reviewed; inconsistent intake process across staff.** Secondary drivers: delayed referral/no-show follow-up, incorrect submission method, lack of ownership or tracking, rework from missing information.

Cross-checks neatly against VICE's reason classification (Vision & Scope §3A): missing document · timely-filing · medical necessity · coordination of benefits · coding issue · in process · other.

### 4.5 Guardrails stated as non-negotiable

1. **The agent never makes a medical-necessity judgment.** Stated in the client's original requirements, Vision & Scope §4 and §8, the end-to-end flow, the build prompt's Rules, and `pa-best-solution.md` §3. The most-repeated sentence in the folder.
2. **Every denial routes to a licensed human.**
3. **Autonomy is earned per payer, per action type, per workflow** — Shadow → Supervised auto-submit → Wider autonomy, each promotion gated on measured exception rate and (for the last) written sign-off.
4. **Thresholds and kill switch are Tenant-Admin configuration, never a code change**, and every change is itself a versioned, audited event.
5. **Write-once audit + reference/transaction ledger** tying every check, submission and call to a timestamp, source and reference number — with call recordings and transcripts.
6. **No PHI in notification payloads, logs or traces.**
7. **BAA with every subprocessor before PHI enters.**
8. **Client owns its data**; never used to train a cross-tenant model without explicit opt-in.

### 4.6 Cautionary tales the design must answer

| Case | Failure mode | Design consequence |
|---|---|---|
| **n8n community PA template** | Consumer no-code tools on the PHI path; a "fast-track auto-approval" branch with no human gate | Keep workflow in our own durable engine; no consumer tools touch PHI |
| **Olive AI** ($850M raised, shut down Oct 2023) | RPA marketed as deep AI; rules that didn't generalize across payers | Rules engine must be versioned, per-payer, and inspectable |
| **UnitedHealth nH Predict** | Denial rate ~doubled, ~90% alleged appeal-reversal, class action | **AI never denies.** Structured, auditable decision trail is the legal artifact |

---

## 5. Settled decisions I will build on

| # | Decision | Source |
|---|---|---|
| S1 | One platform, one canonical **Case**, one state machine, one audit ledger, one connector framework | Roadmap §3; blueprint v2 §10; prior blueprint §1 |
| S2 | Cost-ordered waterfall: electronic → portal → voice → human | Client requirements; Vision & Scope §1–2 |
| S3 | Agent roles: Orchestrator → Coverage · Clinical · Compliance → Decision → Submission → Follow-Up | `prior-authorization-study.md`; end-to-end flow |
| S4 | FHIR R4 + Da Vinci CRD/DTR/PAS/CDex where live; X12 270/271, 276/277, 278 underneath | `pa-integrations.md`; blueprint v2 §10.3 |
| S5 | **Core closed, connectors open** — a new EHR or payer is a new adapter, never a branch in the engine | Roadmap §3; Vision & Scope §6 |
| S6 | MCP is an **internal** tool facade only; external integrations stay native | Roadmap §3 (resolves Vision & Scope §6's ambiguity) |
| S7 | Multi-tenant SaaS default + dedicated/air-gapped on request; three-tier admin | Vision & Scope §7 |
| S8 | Postgres + RLS per tenant, outbox pattern, append-only audit, modular monolith first | blueprint v2 ADR-003/005/007; prior blueprint §8.2 |
| S9 | Trust ramp Shadow → Supervised → Wider, per payer and workflow | Vision & Scope §4 |
| S10 | Start narrow: one practice, one EHR, one clearinghouse lane, one high-volume imaging CPT family (**72148**) | Vision & Scope §11; `pa-best-solution.md` §5 |
| S11 | Reuse the `web/` design tokens — Nexauth AI's existing palette, Inter + Source Serif 4, light/dark via CSS variables | `web/tailwind.config.ts`, `web/app/app.css` |

---

## 6. Gaps, contradictions and open questions

### 6.1 Contradictions

| # | Conflict | Sources | My resolution |
|---|---|---|---|
| **C1** | **Product name.** "ClearAuth AI" (discovery pack) vs. **"Nexauth AI"** (`web/` package name + tailwind token header) vs. vendor called "Relay Health AI" (Vision & Scope cover) and "InfiniAI" (Roadmap §1) vs. client called "Cascade AI" / "Cascade Healthcare" (Roadmap title) | Vision & Scope; `web/package.json`; Roadmap | **Resolved by the brief: NexAuthAI.** This matches the already-built marketing site, so app and site converge rather than diverge further. The prior blueprint flagged C1 as unresolved; the brief settles it. |
| **C2** | **Pricing model.** Walkthrough says *pay-per-use, metered, no flat fee*. End-to-end flow says *annual license + flat $3K/month managed services + one-time onboarding*. Costs page prices onboarding at $3,000–3,500 and is silent on recurring. | `4_HOW_…walkthrough` §12; `clearauth-end-to-end-flow.md`; `ClearAuth_AI_Onboarding_Costs_Breaktup.html` | **Unresolved — a business decision, not mine.** I model both: the data model carries `UsageRecord` so subscription, metered and hybrid all work. Flagged in the solution doc as a decision needing an owner. |
| **C3** | **n8n.** The onboarding cost model builds **n8n** into the standard onboarding (and prices 4 hrs for "n8n/HITL workflow configuration"). The research names an n8n PA template as a **cautionary failure**. | Costs page; `pa-best-solution.md` §6 | **Resolve against n8n on the PHI path.** Workflow lives in our own durable state machine. If n8n survives at all it is for internal, non-PHI ops glue. This also invalidates ~4 hrs of the onboarding formula. |
| **C4** | **MCP's role.** Vision & Scope §6 lists MCP as a *customer-facing connector type*. The Roadmap says MCP must be an *internal tool facade only*. | Vision & Scope §6; Roadmap §3 | **Internal only.** Agents reach connectors through an MCP-style tool router; customers and payers integrate over FHIR/X12/REST/SFTP. |
| **C5** | **Manual cost per PA.** Folder uses **$20–30** throughout its ROI maths. CAQH (the folder's own best source) says **$12.88** for a fully manual PA. | WhatsApp screenshot + costs page vs. `PRICE_…Breakeven_Model` | **Use CAQH for anything defensible.** The $20–30 figure appears to bundle follow-up labour beyond CAQH's per-transaction scope. Any ROI claim should state which basis it uses. The costs page's ~5-day payback is built on the higher figure and should be re-derived. |
| **C6** | **Which agent first.** Vision & Scope §11 asks the client to choose; Roadmap and walkthrough say ClearAuth first. | Vision & Scope §11; Roadmap §4 | **ClearAuth/PA first** — and the brief scopes this build to PA only. VICE is out of scope here but the data model stays compatible. |
| **C7** | **$4 per PA.** Appears as the unit price across the TAM/SAM/SOM models. | `PRICE_…` workbooks | It is a **sizing device only**, stated as such in the workbook's own note. Not a billing mechanism. Must not leak into pricing copy. |

### 6.2 Gaps

| # | Gap | Impact |
|---|---|---|
| **G1** | **No payer-side requirements anywhere.** Every client and consulting document is provider-side. Payer intake reviewers, clinical reviewers/medical directors, work queues, reason codes and decision forms appear only in the *research* (Microsoft's accelerator, Cohere Health, Anterior). The brief asks for four payer-side screens. | **Largest design gap — resolved by removal.** An earlier draft built payer intake and clinical-reviewer screens as **[Assumption]**, grounded in `pa-tech-landscape.md` and `pa-competitors.md` rather than client requirements. They are out of the product. Determinations now arrive through a connector and are recorded as the payer's act, which makes the no-AI-denial rule stronger: there is no code path that produces a determination at all. |
| **G2** | **All 107 discovery questions are unanswered.** Status = Open, Client Response = empty, for every row. | No EHR named, no clearinghouse named, no payer list, no CPT list, no volumes, no baseline, no acceptance thresholds, no deployment mode. **Every concrete choice in the prototype is a placeholder.** |
| **G3** | **No real payer policy content.** No actual medical-necessity criteria, no CPT→documentation mappings, no questionnaire definitions. | The AI criteria-matching must use synthetic, clearly-labelled criteria. |
| **G4** | **No patient-portal requirements.** Patient appears only as indirect beneficiary + a 2027 Patient Access API obligation. The brief asks for a read-only patient portal. | **Resolved by removal.** An earlier draft scoped it to status + timeline only. Patient access to PA status is a CMS-0057-F obligation from 1 Jan 2027, served through the practice and consent-gated — an API surface, not a seat in this portal. Revisit when the obligation is in scope. |
| **G5** | **Appeals are thin.** Named as an outcome and an obligation ("every denial to a licensed human", appeal packet, peer-to-peer) but no appeal levels, deadlines, or submission mechanics. | **[Assumption]** — I model level 1 / level 2 / external review with a deadline clock. |
| **G6** | **No signed anything.** Vision & Scope is a "discussion draft, not yet approved". README says no implementation exists. | Everything is proposal-grade. The solution document must not read as though scope is agreed. |
| **G7** | **Volume/ROI numbers rest on a screenshot.** The AMA figures come from a WhatsApp screenshot of a search result, not the AMA publication. | Use for sizing only; baseline against the pilot practice's own data (DQ-011, DQ-027). |
| **G8** | **Connector onboarding time is asserted, never measured.** Vision & Scope §7 says a registry match auto-provisions "in minutes"; the costs page says 3 hrs per electronic route, 4 hrs per portal. No evidence either is real. | The Phase 5 onboarding playbook's "under N days" must be presented as a **target with a stated basis**, not a measured fact. |

### 6.3 Open questions for the client

Carried forward from the prior blueprint's D1–D9 and the Vision & Scope's own 9 confirmation questions, reduced to what actually blocks work:

1. **Pricing model** (C2) — subscription, metered, or hybrid? Blocks billing design and the commercial sections.
2. **Does NexAuthAI serve payers as well as providers?** (G1) — the brief implied yes; no source document does. **Answered for now: no.** The product is provider-side; payers are counterparties reached through connectors. Reopening this changes the product's shape, go-to-market and compliance posture fundamentally, so it should be a deliberate client decision rather than an inference.
3. **Which EHR, which clearinghouse, which payers, which CPT family** (G2, DQ-001/002/008/009) — the whole integration plan is placeholder until these land.
4. **Acceptance thresholds for leaving Shadow mode** (DQ-028) — who signs, and at what measured accuracy?
5. **Deployment mode** — multi-tenant SaaS or dedicated/air-gapped (Vision & Scope Q9)?
6. **Is n8n in or out?** (C3) — affects the onboarding price and the compliance story.
7. **Retention period** — Vision & Scope defers to "the practice's existing HIPAA policy"; blueprint v2 recommends ≥6 years *"validate with counsel"*. Unowned.
8. **Who owns the payer-requirement matrix** (DQ-017, DQ-020) — the folder names it as the single biggest source of stale-data error and assigns it to nobody.

---

## 7. What I verify against current regulation

Flagged for the reader to re-check — regulatory dates move, and the folder's own evidence date is **30 September 2026**:

- **CMS-0057-F**: four FHIR APIs (Patient Access, Provider Access, Payer-to-Payer, Prior Authorization) due **1 Jan 2027** for impacted payers; **72h expedited / 7 calendar days standard** decision timeframes already in effect since **1 Jan 2026**. Prior Authorization API covers medical items/services, **not drug PAs**.
- **Da Vinci IG versions**: current CRD 2.2.1 / DTR 2.2.0 / PAS 2.2.1; CMS rule text references the older 2.0.1 / 2.1.0 line; HTI-4 certification at 2.0.1. **Support multiple versions per payer.**
- **CMS-0062-P** (drug PA / HIPAA standards) was **proposed, not final** as of the folder's evidence date.
- **WISeR model** (1 Jan 2026 – 31 Dec 2031, six states, selected services) affects Medicare FFS routing.
- **X12 275/277 claims-attachments v6020** compliance date **26 May 2028**; PA attachments not finalized.
- **NCPDP SCRIPT 2023011** required for Part D from **1 Jan 2028**.

---

## 8. Traceability index

| Requirement area | Primary source | Corroborating |
|---|---|---|
| Waterfall order | `1_WHY_Client_Original_Requirements.pdf` | Vision & Scope §1–2; Roadmap §1; end-to-end flow |
| No-medical-judgment boundary | `1_WHY_Client_Original_Requirements.pdf` | Vision & Scope §4, §8; build prompt Rules; `pa-best-solution.md` §3 |
| Trust ramp | Vision & Scope §4 | end-to-end flow §7; prior blueprint §11 |
| Statuses / indicators | Vision & Scope §3C | end-to-end flow §6 |
| Personas & three-tier admin | Vision & Scope §7 | end-to-end flow §identity; prior blueprint §5 |
| Connector types | Vision & Scope §6 | Roadmap §3 (MCP correction); blueprint v2 §11.1 |
| Onboarding flow | Vision & Scope §7 | blueprint v2 §11.5, §12.3 |
| Compliance guardrails | Vision & Scope §8 | `pa-best-solution.md` §8; blueprint v2 §1.5 |
| FHIR / Da Vinci stack | `pa-integrations.md` §3, §9 | blueprint v2 §10.3; `cms-0057-f.html` |
| CMS-0057-F mechanics | `pa-integrations.md` §5 | `pa-alternatives.md` §5; blueprint v2 §12.1; output-video-2 |
| EHR capability per vendor | blueprint v2 §11.2 | `pa-integrations.md` §6 |
| Payer capability degradation | blueprint v2 §12.4 | `pa-integrations.md` §8 |
| Entity catalog / retention | blueprint v2 §14.2 | prior blueprint §9.1 |
| Market sizing | `PRICE_…Breakeven_Model.xlsx` (CAQH 2024) | `PRICE_…TAM_SAM_SOM_V2.xlsx` |
| Volume & burden | WhatsApp screenshots (AMA) | costs page |
| Cautionary tales | `pa-tech-landscape.md`; `pa-competitors.md` | `pa-best-solution.md` §6 |
| Connector-layer model | `medblocks-basics.html` (five layers) | Roadmap §3 integration fabric |
| Design tokens | `web/tailwind.config.ts`, `web/app/app.css` | — |

---

*Next: `01-personas-and-journeys.md`.*
