# The Best Solution for Prior Authorization: A CTO Recommendation

*Synthesizes the four companion research files in this folder — `pa-tech-landscape.md` (vendors), `pa-competitors.md` (who's deploying what, with results), `pa-alternatives.md` (whether PA can be replaced), and `pa-integrations.md` (the FHIR/EHR plumbing) — into one recommended path forward. Last updated: September 2026.*

**Prior Authorization (PA)** is the approval a provider must get from a health insurer (the "payer") before delivering certain treatments, tests, or drugs, or the payer may refuse to pay.

---

## Bottom line up front

> **Automate PA using FHIR-based industry standards (not custom point-to-point integrations or generic no-code tools), wrap it in a multi-agent AI architecture with mandatory human review of any denial, start narrow with high-volume/low-ambiguity cases, and treat the January 2027 CMS deadline as your forcing function.**

There is no way to make PA disappear (see [pa-alternatives.md](pa-alternatives.md)) — it is a payer cost-control lever that only genuinely goes away inside value-based, risk-sharing contracts, which cover a minority of US care. So the real question isn't "build or replace," it's "build the automation the right way, on the right standards, with the right guardrails." That's what this document lays out.

---

## 1. The recommended architecture, in one picture

```
Clinician places an order in the EHR
        │
        ▼
CDS Hooks fires → Coverage Agent calls payer's CRD API
        │  ("does this need PA, and what documentation?")
        ▼
DTR-style Documentation Agent auto-fills the payer's
questionnaire from chart data (EHR, labs, notes)
        │
        ▼
Clinical Agent + Compliance Agent validate evidence
and paperwork completeness (in parallel)
        │
        ▼
Decision Agent scores confidence and consolidates findings
        │
   ┌────┴────┐
   ▼         ▼
High conf.   Low conf. / any denial
Auto-submit  → routed to human reviewer,
via PAS API    pre-populated with agent's findings
   │         │
   └────┬────┘
        ▼
Submission Agent sends via PAS (FHIR), often through
a clearinghouse gateway, to the payer's adjudication engine
        │
        ▼
Decision returns: approved / denied (with reason) / pended
        │
        ▼
Follow-Up Agent tracks status, handles pended requests (CDex),
and feeds denial reasons back into the policy knowledge base
```

This is not a hypothetical design — it is the common pattern across every credible, production-grade implementation found in our research (Epic Payer Platform, AWS's HIPAA-agent architecture, Cohere Health, athenahealth+Availity+Humana). The pieces below explain why each layer is there and what to build it on.

---

## 2. Build on standards, not custom integrations

**Why:** Every payer historically had its own portal, its own form fields, its own fax number. Building a custom bridge to each one doesn't scale, and it's exactly the kind of fragile, ad-hoc integration that produced the n8n incident (below).

**What to use** (full detail in [pa-integrations.md](pa-integrations.md)):

| Standard | Role | Status |
|---|---|---|
| **HL7 FHIR** | The common data format (patient, coverage, claim, questionnaire records) | Mature, industry-wide |
| **CDS Hooks** | Fires the check at the moment a clinician places an order | Finalized, in production at major EHRs |
| **CRD** (Coverage Requirements Discovery) | Real-time "does this need PA?" check, at order time | Finalized Da Vinci standard; live at Epic + several large payers |
| **DTR** (Documentation Templates and Rules) | Auto-fills the payer's clinical questionnaire from chart data | Finalized; adoption growing alongside CRD |
| **PAS** (Prior Authorization Support) | Electronic submission + decision | Finalized; the explicit technical basis CMS-0057-F requires payers to expose by **Jan 1, 2027** |
| **CDex** (Clinical Data Exchange) | Handles "pended" requests needing more documentation | Finalized but least mature in real-world use |

**The practical implication:** this is not optional groundwork — it's a government-mandated timeline. Building the Coverage and Submission Agents around CRD/DTR/PAS means your system is payer-agnostic (any payer that complies with CMS-0057-F "just works") instead of needing a bespoke connector per insurer. Expect to also handle the messier reality underneath: many payers will translate FHIR calls internally into the older X12 278 transaction for a legacy backend, and a clearinghouse (e.g., Availity) will often sit between you and the payer rather than a direct connection — build for that, don't assume a clean direct API everywhere.

---

## 3. Wrap it in a multi-agent architecture with a real human-in-the-loop gate

Every credible vendor in [pa-tech-landscape.md](pa-tech-landscape.md) converges on the same underlying pattern: **LLM-driven agents for unstructured reasoning, wrapped around a rigid rules/lookup layer the LLM is not trusted to know from memory** — plus a mandatory human checkpoint before anything gets denied.

Recommended agent roles (based on Microsoft's, AWS's, and this repo's own architecture study):

| Agent | Job |
|---|---|
| **Coverage Agent** | Calls CRD to determine if PA is needed and what's required |
| **Clinical Agent** | Reads notes, extracts diagnosis/evidence, checks medical necessity |
| **Compliance Agent** | Confirms paperwork completeness, consent, auditability |
| **Decision Agent** | Consolidates findings, produces a confidence score |
| **Submission Agent** | Files the request via PAS |
| **Follow-Up Agent** | Tracks status, handles pended requests, supports appeals |

**The non-negotiable rule, drawn from every serious vendor and every failure case:** confidence-tiered automation, never full autonomy on denials.

- AWS's HIPAA-compliant agent architecture pauses for **explicit human approval before executing** any decision.
- Cohere Health states outright: **AI never denies care** — only a human clinician can issue a denial.
- Where this rule was absent or unclear, things went wrong: the n8n community template's "fast-track auto-approval" path for emergency cases had no described human check, and is tied (by its own author's account, details unverified) to a real emergency-care delay. UnitedHealth's nH Predict algorithm is under litigation alleging a ~90% appeal-reversal rate after being used with insufficient human oversight in post-acute-care denials.

**Practical threshold design:** auto-process only above a defined confidence score, on narrow, well-evidenced case types; route everything else — including every denial — to a human reviewer who sees the agent's findings pre-populated (so they correct rather than start from scratch).

---

## 4. Build vs. buy: what the market actually shows

You don't have to build all of this from scratch. Per [pa-competitors.md](pa-competitors.md), the market has real, production-grade options at different levels of the stack:

| If you need... | Consider | Maturity |
|---|---|---|
| A payer-side reviewer-assist platform | **Cohere Health**, **Anterior** | Production SaaS, in-market, $50–100M+ funded |
| A provider-side submission/tracking platform | **Humata Health**, **Notable Health**, **athenahealth's Authorization Management** | Production SaaS |
| Phone-based follow-up automation specifically | **Infinitus Systems** | Production, niche, well-funded |
| A payer-connectivity/clearinghouse layer | **Availity (AuthAI)** | Production, broad multi-payer reach |
| A reference architecture to build your own on a hyperscaler | **AWS** (most HIPAA detail) or **Microsoft** (most complete open-source agent accelerator) | Open-source, self-operated, not a shipped product |
| A quick internal prototype | **n8n or similar no-code tools** | **Do not use for real PHI/clinical decisions without hardening — see Section 6** |

**Recommendation:** if you're a payer or large health system with engineering capacity, the AWS or Microsoft open-source accelerators are a credible starting point *if* you invest in the compliance hardening they explicitly say is required (both call themselves references, not compliant products, out of the box). If you're a smaller organization or want faster time-to-value, buying a production SaaS platform (Cohere Health for payer-side, Humata/Notable for provider-side) is lower-risk than building — these are already handling real PHI at scale with documented (if vendor-reported) results.

---

## 5. Sequence the rollout — don't boil the ocean

Drawn from the recommended approach in this repo's own architecture study and reinforced by what actually succeeded in the field (Epic's phased health-system rollouts, CVS Caremark's expansion from 40 to 83+ covered medications over a year):

1. **Pilot on one payer, one high-volume/low-ambiguity authorization type** — imaging orders, routine durable medical equipment, medication renewals. These have the most predictable rules and the best confidence-scoring reliability.
2. **Measure against the manual baseline** — first-pass approval rate, turnaround time, denial rate, staff hours saved. Keep the manual process as a fallback throughout, not a one-time cutover.
3. **Expand payer-by-payer and specialty-by-specialty** as confidence and integration maturity grow — mirroring how Epic brought CRD live with UnitedHealthcare/Aetna/Network Health first, with 16 more payers in testing, rather than attempting all payers at once.
4. **Treat CMS-0057-F's January 1, 2027 deadline as your real-world forcing function** — if you're a payer, you must expose FHIR PA APIs by then regardless; if you're a provider, your EHR must demonstrate actual use of a payer's Prior Authorization API for a CMS attestation requirement. Building toward Da Vinci PAS now means compliance and your automation roadmap are the same project, not two competing ones.

---

## 6. What to avoid — two cautionary tales, two different failure modes

| Failure mode | Example | Lesson |
|---|---|---|
| **Under-engineered, unvetted no-code automation** | An n8n community template (Gmail trigger → AI PDF extraction → "fast-track auto-approval" for emergency cases → Slack/Sheets logging) reportedly linked to a delayed emergency-care case. n8n has no built-in HIPAA certification; compliance requires self-hosting plus a signed BAA on *every* connected service, which most default integrations (personal Gmail, consumer Slack) don't have. | Never let a consumer-grade automation tool handle real PHI or an auto-approval path in a clinical workflow without independent compliance hardening and an explicit human-review gate — no matter how fast it was to build. |
| **Over-funded, over-claimed AI sophistication** | Olive AI raised $850M+, claimed broad "AI workforce" automation across hospital administration including PA, and shut down in October 2023. Reported causes: RPA (scripted automation) marketed as deep AI, rules that didn't generalize across payers, and breadth without real workflow integration. Its PA business was later sold and now lives on as Humata Health. | A well-funded brand and a big claim are not evidence of a working system — verify the actual architecture (agentic reasoning + rules layer vs. brittle scripting) before betting on a vendor. |
| **Automation without independent validation of decision quality** | UnitedHealth's nH Predict algorithm: denial rate roughly doubled after introduction, ~90% reversal rate alleged on appeal, ongoing class-action litigation, court-ordered disclosure of how the tool works. | Speed and automation are not the same claim as "the decisions are correct and fair." Keep a structured, auditable decision trail (evidence used, policy matched, confidence score, human overrides) — this is what a legal challenge, an appeal, or a regulator will ask for. |

---

## 7. Set expectations correctly: automation ≠ guaranteed system-wide savings

The one genuinely independent (non-vendor) study found in this research — the Peterson Health Technology Institute's 2026 report — found that AI PA tools reduce manual effort *within* an organization but have **not been shown to lower system-wide cost**, partly because faster submission on the provider side triggers more automated scrutiny on the payer side (an "AI arms race" dynamic). Every other performance number in this space — 96% first-pass approval, 18-second approvals, 91% success rates — is vendor-reported or vendor-co-published with a hand-picked customer, not independently audited.

**Practical implication:** set your internal success metrics (turnaround time, staff hours saved, first-pass approval rate) and measure them yourself against your own manual baseline. Don't assume a vendor's published number will transfer to your organization, and budget for the possibility that automation shifts effort rather than eliminating system-wide cost — the win is still real (faster care, less staff burnout, better documentation), just don't oversell the cost case internally.

---

## 8. Compliance checklist (HIPAA, at a glance)

Every vendor in this space describes HIPAA compliance as a **shared responsibility** — the cloud/platform can be "HIPAA-eligible," but your configuration determines whether you're actually compliant. Minimum bar, synthesized from AWS's most detailed public architecture and the other vendors' disclaimers:

- [ ] Signed Business Associate Agreement (BAA) with every vendor/cloud/service that touches PHI — including every third-party integration (email, chat, spreadsheet logging) in any automated workflow
- [ ] Encryption at rest and in transit, with customer-managed keys where possible
- [ ] Fine-grained access policies restricting exactly which data/tools each agent can touch (e.g., AWS's Cedar policies at the tool/field/record level)
- [ ] Multi-factor authentication before any PHI access
- [ ] Private network paths (VPC endpoints / PrivateLink equivalents) so PHI never crosses the public internet unnecessarily
- [ ] Tamper-proof audit logging retained per HIPAA's expectations (commonly 6 years)
- [ ] Content filtering to keep PHI out of model training/knowledge bases it shouldn't be in
- [ ] An explicit, logged human-approval step before any decision (especially a denial) executes

---

## 9. Summary recommendation

| Decision | Recommendation |
|---|---|
| **Data/integration standard** | HL7 FHIR + Da Vinci CRD/DTR/PAS/CDex — not custom point-to-point integrations |
| **Architecture pattern** | Multi-agent (Coverage, Clinical, Compliance, Decision, Submission, Follow-Up) with confidence-tiered human review |
| **Human-in-the-loop policy** | Mandatory for all denials and low-confidence cases; AI recommends, humans decide on anything uncertain |
| **Build vs. buy** | Buy a production SaaS platform if speed-to-value matters and engineering capacity is limited; use AWS/Microsoft open-source accelerators as a starting reference only if you have the team to harden them for compliance |
| **Rollout sequence** | Pilot on one payer + one high-volume, low-ambiguity case type → measure against manual baseline → expand |
| **Regulatory anchor** | Build to be compliant with CMS-0057-F (FHIR PA API by Jan 1, 2027) regardless of your automation choices — it's happening either way |
| **What NOT to do** | Don't wire PHI through consumer no-code tools without independent compliance hardening; don't trust vendor performance numbers without your own measurement; don't let AI autonomously deny care |

---

## Sources & Methodology

**Methodology:** This document does not introduce new external research — it synthesizes findings already gathered and sourced in the four companion files in this folder, plus this repository's existing architecture study. Every specific claim, vendor name, statistic, or incident referenced here is drawn from and citable in one of those documents; see each file's own "Sources & Methodology" section for the full underlying source list (vendor blogs, GitHub repos, trade press, regulatory text, and the two independent/third-party sources — the Peterson Health Technology Institute report and the UnitedHealth/nH Predict litigation coverage — identified during that research). The recommendations themselves (architecture pattern, rollout sequence, build-vs-buy framing) are this document's own synthesis and judgment call, made by weighing which patterns were common across the *credible, production-grade* implementations found (Epic, AWS, Cohere Health, athenahealth+Availity+Humana) versus which patterns were present in the *failed or cautionary* cases (the n8n incident, Olive AI, nH Predict).

**Internal sources (this repository):**
- [pa-tech-landscape.md](pa-tech-landscape.md) — vendor architectures and technologies
- [pa-competitors.md](pa-competitors.md) — real-world deployments and results
- [pa-alternatives.md](pa-alternatives.md) — why the industry automates rather than replaces PA
- [pa-integrations.md](pa-integrations.md) — FHIR/HL7/Da Vinci technical standards
- [../prior-authorization-study.md](../prior-authorization-study.md) — this repo's original agentic-AI architecture proposal, whose "Recommended Solution" section this document expands on with vendor/market evidence
