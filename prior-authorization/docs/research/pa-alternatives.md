# Alternatives to Prior Authorization

**Audience:** CTO / technical leadership evaluating whether to build for "automating PA" or "replacing PA."

**Bottom line up front:** After reviewing state laws, federal rules, payer announcements, and value-based care contracts, there is **no widely-adopted mechanism that eliminates the concept of prior authorization (PA)** — the process where a provider must get a health insurer's ("payer's") sign-off before a treatment, test, or drug is delivered, or risk non-payment. Every approach we found either (a) exempts a narrow slice of providers or services from PA, or (b) makes the same underlying approval process faster and more digital. The one model that structurally removes the payer's *need* for PA — value-based, risk-sharing contracts — works, but only for the small share of care delivered under those contracts, and even there PA is usually reduced, not abolished. Details and evidence below.

---

## 1. What PA actually is, in one paragraph

A provider (doctor, hospital, pharmacy) wants to deliver a service — an MRI, a surgery, a specialty drug. Before doing so, many insurance contracts require the provider to submit a request to the payer justifying medical necessity. The payer reviews it (a nurse, an algorithm, sometimes a doctor) and approves, denies, or asks for more information. If the provider skips this step, the payer can refuse to pay even if the care was appropriate. PA exists because payers pay for volume of care, so they use PA as a **cost and utilization control lever** — a way to prevent unnecessary or low-value spending before the money goes out the door. This single fact — PA is a control payers use to manage what they pay for — is why every "alternative" below either keeps that lever in a lighter form or replaces it with a different lever (risk-sharing) rather than removing control altogether.

---

## 2. Gold-carding: exempting trusted providers, not removing PA

**Gold-carding** is a state-law arrangement where a provider who gets approved (not denied) a high percentage of their PA requests — typically 80-90% — over a look-back period earns an exemption from needing PA for that specific service, usually for about a year, subject to periodic re-review.

**What we found:**

- As of 2025, **six states** have gold-carding laws: Arkansas, Colorado, Louisiana, Texas, West Virginia, and Wyoming. Texas was the first (2021) and is the most closely watched.
- Texas requires a 90% historical approval rate; **HB 3812 (signed 2025, effective September 1, 2025)** extended the qualifying look-back window from 6 months to 1 year, aiming to make it easier for more providers to qualify.
- **Adoption has been very low.** Texas's own insurance regulator testified that statewide, only about **3% of providers** met the bar for gold-card status — years after the original 2021 law passed.
- Texas's law (like most state gold-card laws) applies only to **state-regulated insurance plans**, which cover roughly **one-fifth of the state's insurance market**. Self-funded employer plans (governed by federal ERISA law, a large share of US commercial coverage) and Medicare are outside state jurisdiction and therefore untouched by these laws.
- Other 2025 state moves: Arkansas removed a rule letting insurers revoke gold-card status if a provider's procedure volume rose >25%, and extended the exemption to group practices; West Virginia actually **removed prescription drugs** from its gold-card program (narrowing it); several states (Indiana, Iowa, Montana) instead focused on mandating faster PA decision *timeframes* rather than exemptions.
- Expert and industry commentary (Medscape, state hospital/medical associations) describes gold-carding as offering **"little relief"** in practice — the eligibility bar is high, insurers control the criteria and can revoke status, and the exemption only covers services the provider already has a track record with (i.e., it doesn't help with new or less-common treatments, which is where PA friction is often worst).

**Verdict:** Gold-carding is a real exemption, but it is narrow (few qualifying providers), partial (limited plan types), and revocable — a carve-out for a trusted minority, not a redesign of the system.

---

## 3. Value-based care and risk-sharing: the one model that removes the payer's *incentive* for PA

**Value-based care (VBC)** means paying providers based on patient outcomes and total cost of care, instead of paying separately for each service delivered (fee-for-service). **Risk-sharing** means the provider takes on some financial responsibility if costs run over target — sometimes through **capitation** (a fixed prepaid amount per patient per period, regardless of how much care is delivered) or through an **ACO (Accountable Care Organization** — a group of providers who jointly take on cost/quality accountability for a patient population).

**Why this is structurally different from every other item on this list:** PA exists because payers and providers have misaligned incentives — the payer wants to avoid unnecessary spending, and under fee-for-service the provider is paid more the more they do. Risk-sharing removes that misalignment: if the provider already bears the cost of over-treating, the payer doesn't need to police each individual service, because the provider's own incentives now do that job.

**What we found:**

- Under CMS's own Medicare ACO programs — the **Medicare Shared Savings Program** and **ACO REACH** — traditional Medicare generally **does not use PA** for ACO-attributed patients at all; the ACO's shared financial risk substitutes for it.
- **ACO REACH** offers capitation payment structures (Primary Care Capitation or Total Care Capitation) specifically to shift risk to provider groups, reducing the payer's need for per-service review.
- Commercial example: a value-based contract between **Blue Cross Blue Shield of Minnesota and Mayo Clinic** removed PA for specific rare-condition therapies (e.g., proton beam therapy for pediatric cancer) *in exchange for* Mayo accepting downside financial risk if costs exceeded agreed targets. This is a direct, documented instance of risk absorption substituting for review.
- Some state Medicaid agencies now offer PA "flexibilities" to Medicaid ACOs that accept risk and meet quality/cost benchmarks — structurally similar to gold-carding but triggered by risk-bearing rather than a track record of approvals.
- **But the scope is narrow.** Analysts are explicit that this relief is targeted at "low-risk, high-cost services" and "clear-evidence therapies" — complex or high-variance care usually keeps some review even in these arrangements. And only a minority of US care is delivered under full risk-sharing contracts; most providers remain on fee-for-service where the incentive misalignment (and hence the payer's rationale for PA) still exists.

**Verdict:** This is the closest thing to a genuine structural alternative — it removes the payer's *reason* to run PA, rather than just exempting or speeding it up. But it only applies where risk-sharing contracts exist, which remains a minority of US healthcare spending, and even within those contracts PA is typically reduced for a defined service list, not abolished altogether.

---

## 4. Real-time benefit checks (RTPB): faster visibility, not fewer requirements

**Real-time prescription benefit (RTPB)** tools show a prescriber, at the moment they're writing an electronic prescription, whether a drug is covered, what it will cost the patient, whether cheaper alternatives exist, and whether it needs PA. This runs through networks like **Surescripts**, which connects e-prescribing systems to **PBMs (pharmacy benefit managers** — companies that manage the drug-coverage side of insurance) covering about 95% of the US population.

**What we found (from a peer-reviewed study, PMC/NCBI):**

- RTPB does **not remove** the PA requirement — it **surfaces it earlier**, before the prescription is even sent, instead of after the pharmacy rejects the claim days later.
- When an RTPB alert showed the original order required PA, prescribers were about 2.5x more likely to switch to a covered alternative — avoiding the *need* to go through PA for that particular prescription, but only by picking a different drug, not by removing the payer's review process itself.
- If the *alternative* drug also required PA, prescribers were far less likely to switch (roughly 3x less likely) — showing that RTPB helps route around PA case-by-case, but has no effect when PA is unavoidable for the class of drug needed.
- Only about 15% of RTPB alerts in the study involved PA at all; the large majority (67%) were about cost/formulary tier, not PA status — so RTPB's main value is price transparency, with PA-avoidance as a secondary, situational benefit.

**Verdict:** RTPB is a real efficiency win (it saves 20-40 minutes per avoided PA event by some industry estimates) but it is explicitly an early-warning and workaround tool, not a replacement for the PA requirement itself. The payer's underlying rule ("this drug needs approval") is unchanged; only when in the workflow the provider learns about it changes.

---

## 5. CMS's Interoperability and Prior Authorization Final Rule (CMS-0057-F): digitizing PA, not eliminating it

**CMS (Centers for Medicare & Medicaid Services** — the federal agency that runs Medicare and Medicaid and regulates much of the US insurance market) finalized **CMS-0057-F** in January 2024. It is the single largest federal intervention on PA to date, and it is explicitly a **speed and transparency mandate, not a reduction mandate.**

**What it requires, and when (for Medicare Advantage, Medicaid/CHIP managed care and fee-for-service, and ACA exchange plans):**

| Requirement | What it does | Deadline |
|---|---|---|
| Decision timeframes | 72 hours for urgent PA requests, 7 calendar days for standard requests | Compliance begins 2026 |
| Denial reason transparency | Payers must give specific reasons for PA denials, not boilerplate | 2026 |
| Public reporting | Payers publish PA approval/denial/turnaround metrics annually | Reporting starts 2026 |
| Patient Access API (expanded) | Adds PA status/history to the patient's existing data-access API | By Jan 1, 2027 |
| Provider Access API | Payers must share claims, encounters, and PA data with in-network providers electronically | By Jan 1, 2027 |
| Payer-to-Payer API | Lets a patient's new insurer pull up to 5 years of PA/claims history when they switch plans | By Jan 1, 2027 |
| Prior Authorization API (built on the **Da Vinci PAS — Prior Authorization Support — FHIR implementation guide**, a technical standard using **FHIR**, a common healthcare data-exchange format) | Lets EHRs submit PA requests and receive decisions electronically instead of by fax/portal | By Jan 1, 2027 |

**What it deliberately does not do:** it does not reduce the list of services that require PA, cap how often PA can be used, or change payers' authority to deny requests. Multiple technical analyses (Firely, Health Samurai) describe the rule in blunt terms: it standardizes *how* PA requests move between systems and *how fast* decisions must come back — it does not touch *whether* PA is required in the first place. In other words, it is **interoperability** (the ability of different computer systems — here, provider EHRs and payer systems — to exchange data in a common format) applied to an unchanged approval workflow.

**Adjacent legislative effort:** The **Improving Seniors' Timely Access to Care Act** (reintroduced in the 119th Congress as H.R. 3514 and S. 1816, 2025) would codify similar speed/transparency/e-PA requirements specifically for Medicare Advantage and require CMS to study how AI-driven automated PA decisions affect access, including disparities for rural and low-income patients. As of September 2026 it remains a bill, not law, and — like CMS-0057-F — it targets speed and process quality, not a reduction in the scope of what requires PA.

**Verdict:** This is automation and standardization at the largest scale we found, but by CMS's own rule text and every technical analysis reviewed, it makes the same approval requirement faster and electronic — it does not remove any payer's ability to require or deny approval.

---

## 6. Insurer-led "PA elimination" pilots: real cuts, but partial and reversible

Since 2023, major insurers have made public commitments to cut PA volume, partly under public/political pressure and partly to get ahead of CMS-0057-F:

- **UnitedHealthcare** committed in 2023 to eliminating about 20% of PA requirements, later citing a cumulative ~30% reduction, covering certain outpatient surgeries, some diagnostic tests (e.g., echocardiograms), and chiropractic care; it also launched its own gold-card program in 2024.
- **Cigna** announced removal of PA from 25% of medical services in commercial plans, bringing its cumulative removals to over 1,100 codes since 2020.
- **Aetna** rolled back PA for cataract surgery, video EEGs, and home infusion for some drugs, and runs its own gold-card program.
- In **June 2025**, over 60 insurers (including UnitedHealthcare, Aetna, Cigna, Humana, Elevance, and BCBS-affiliated plans) made an industry-wide pledge: reduce the number of services requiring PA, honor existing approvals for 90 days when a patient switches plans, and standardize electronic PA — targeting January 1, 2026 for the reductions and January 1, 2027 for a shared e-PA framework. This closely mirrors CMS-0057-F's own timeline, reinforcing that insurers are largely complying with (and getting ahead of) the federal mandate rather than acting independently.

**Reasons for caution, drawn directly from provider-side reaction:**
- Provider associations (Medical Group Management Association) responded to UnitedHealthcare's 2023 announcement with explicit skepticism about *execution*, not intent — "it remains to be seen how it will be rolled out."
- Some observers noted insurers may be motivated to "get out front of" incoming regulation rather than reduce burden for its own sake.
- Despite these pledges, broader survey data referenced in coverage found that roughly 80% of physicians reported *increased* PA burden from 2021-2022 — i.e., these percentage cuts are happening against a backdrop of overall PA volume still trending up in many areas, and a percentage cut applies only to the specific codes named, not to the concept of PA generally.
- These are voluntary, unilateral pledges — not law. Any insurer can reintroduce PA on a given code if utilization or costs shift, and pledges are enforced only by public/regulatory pressure and self-reporting, not statute.

**Verdict:** Real, measurable reductions in the *number of codes* subject to PA — the most concrete volume reduction of anything reviewed — but scoped to specific procedure codes chosen by the insurer, voluntary, and reversible. It reduces PA's footprint; it does not retire the mechanism.

---

## 7. Comparison table

| Approach | What it actually changes | Eliminates PA, or reduces/speeds it? | Adoption / maturity (as of Sept 2026) |
|---|---|---|---|
| **Gold-carding** (state laws) | Exempts individual high-performing providers from PA for specific services, for ~1 year, revocable | Reduces — for a small, qualifying subset of providers and services | 6 states; Texas found only ~3% of providers qualify; state-regulated plans only (~20% of TX market) |
| **Value-based care / risk-sharing** (ACOs, capitation) | Removes the payer's *financial incentive* to require PA, because the provider bears cost risk | Closest to true elimination — but only within the risk contract's scope of services and patients | Mature in Medicare ACO programs (PA typically not used there); commercial examples exist (Mayo/BCBS MN) but remain a minority of total US care |
| **Real-time benefit checks (RTPB)** | Shows PA requirement and cost before the prescription is sent, letting providers pick a non-PA alternative | Speeds up / routes around — does not remove the requirement itself | Widely deployed via Surescripts (~95% of US population's pharmacy data reachable); PA-specific benefit only ~15% of alerts |
| **CMS-0057-F (federal interoperability rule)** | Mandates faster decision times, denial-reason transparency, and FHIR-based electronic PA APIs | Speeds up / digitizes — explicitly does not reduce which services need PA | Finalized 2024; operational rules take effect 2026; APIs required by Jan 1, 2027 |
| **Improving Seniors' Timely Access to Care Act** (proposed federal law) | Would codify e-PA, timeliness, and reporting standards for Medicare Advantage; study AI-driven PA impact | Speeds up / digitizes, same as CMS-0057-F, for MA specifically | Bill only (H.R. 3514 / S. 1816, 119th Congress); not yet law as of Sept 2026 |
| **Insurer PA-elimination pledges** (UnitedHealthcare, Cigna, Aetna, industry-wide 2025 pledge) | Removes PA requirement entirely for specific, named procedure codes | Eliminates PA for those specific codes only; broader PA volume trend still rising | Real cuts (20-30% of codes at some insurers) but voluntary, insurer-chosen, and reversible |

---

## 8. Direct answer: is there a true alternative to PA, or does the industry mostly automate rather than replace it?

**The industry mostly automates and narrows PA — it does not replace it.**

The only mechanism found in this research that changes the underlying *reason* PA exists — misaligned financial incentives between payer and provider — is value-based, risk-sharing contracting (Section 3). Everywhere that model is genuinely in place (Medicare ACOs, a handful of high-profile commercial contracts like Mayo/BCBS Minnesota), PA does functionally disappear for the services in scope, because the payer no longer needs a case-by-case check on a provider that already eats the cost of over-treatment. That is a real, structural substitute — not just a faster version of the same thing.

But three limits keep this from being a general answer:

1. **Coverage is narrow.** Risk-sharing arrangements cover a minority of US healthcare spending. Most providers are still paid fee-for-service, where the payer's incentive to control utilization via PA is untouched.
2. **Even inside risk contracts, PA is usually reduced, not abolished outright** — payers still tend to keep some review for complex, high-variance, or high-cost-outlier services, only waiving it for predictable, well-evidenced care.
3. **Nobody has found a substitute for the control lever itself outside of risk-sharing.** Gold-carding narrows PA to a small trusted cohort (and even then, the qualifying bar keeps 97% of Texas providers out). RTPB, CMS-0057-F, and the insurer pledges all leave the payer's authority to require and deny PA fully intact — they change *when* the provider learns about it, *how fast* the decision comes back, and *how many procedure codes* are on the list, but never *whether the payer can say no*.

**Why the industry converges on automation rather than replacement:** PA is not primarily a paperwork problem to payers — it is a cost-control instrument in a system where providers are otherwise paid more for doing more. Removing PA without another control mechanism in place would remove the payer's main lever against unnecessary or low-value utilization, which no payer has volunteered to do at scale. Value-based care is the one model that supplies an alternative lever (the provider's own balance sheet), which is exactly why it's the one place PA genuinely recedes. Every other initiative — gold-carding, RTPB, CMS-0057-F, insurer pledges — works within the fee-for-service model, where the payer still needs *some* form of case-by-case control, so those efforts optimize the process (faster, more transparent, narrower in scope) rather than eliminating the control point itself.

**Practical implication for a CTO building in this space:** Building tools that make PA faster, more transparent, or electronically native (à la CMS-0057-F, RTPB, gold-card eligibility tracking) addresses a durable, government-mandated, multi-year need — this space is not going away by 2027, it's being formalized. Building toward "PA elimination" as a product thesis is only realistic in the value-based-care segment of the market, and even there the realistic pitch is "PA reduction for a defined service set under risk contracts," not full elimination of insurer review.

---

## Sources & Methodology

**Methodology:** Research was conducted in September 2026 using live web search and page retrieval (not model memory), targeting five areas: state gold-carding laws, the CMS-0057-F federal rule, value-based care/risk-sharing effects on PA, real-time prescription benefit tools, and payer-led PA reduction announcements. Searches were run first to identify current, dated sources (prioritizing 2025-2026 coverage given the fast-moving regulatory timeline), followed by direct page fetches of the most substantive, specific sources for verification and detail. Two sources (Medscape, CMS.gov's own page) returned access errors (HTTP 402/403) and were not used directly; findings attributed to those topics instead draw on the search-result summaries and corroborating secondary sources (MultiState, Firely) that covered the same facts.

**Sources used:**

- [State-Mandated 'Gold Card' Programs to Ease Prior Authorization Burdens Offer Little Relief, Experts Say — Medscape (via search summary)](https://www.medscape.com/viewarticle/state-mandated-gold-card-programs-ease-prior-authorization-2025a1000hw9)
- [Prior Authorization Reform Gains Momentum in States — MultiState](https://www.multistate.us/insider/2025/8/14/prior-authorization-reform-gains-momentum-in-states)
- [Texas Preauthorization Gold Card Rules — Harris County Medical Society](https://www.hcms.org/tmaimis/HARRIS/Practice_Resources/Billing_and_Payers/Texas_Preauthorization_Gold_Card_Rules.aspx)
- [Texas gold card exemptions FAQ — UnitedHealthcare provider portal](https://www.uhcprovider.com/content/dam/provider/docs/public/health-plans/tx-commercial-gold-card-faq.pdf)
- [Shielding the Gold Card Law — Texas Medical Association](https://www.texmed.org/ShieldGoldCard/)
- [Gold Carding for Prior Authorization: How It Works in 2026 — Linear Health](https://linear.health/blog/gold-carding-prior-authorization)
- [HB 3812 bill analysis — Texas Legislature Online](https://capitol.texas.gov/tlodocs/89R/analysis/html/HB03812E.htm)
- [CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F) — CMS.gov (via search summary)](https://www.cms.gov/initiatives/burden-reduction/overview/interoperability/policies-regulations/cms-interoperability-prior-authorization-final-rule-cms-0057-f)
- [CMS-0057-F Final Rule: 4 FHIR APIs Due by 2027 — Health Samurai](https://www.health-samurai.io/articles/understanding-the-cms-0057-f-interoperability-and-prior-authorization-final-rule)
- [CMS-0057-F: Interoperability and Prior Authorization Final Rule — Firely](https://fire.ly/regulations/cms-0057-f-interoperability-and-prior-authorization-final-rule/)
- [CMS-0057-F decoded: Must-have APIs vs. nice-to-have IGs for 2026-2027 — Firely](https://fire.ly/blog/cms-0057-f-decoded-must-have-apis-vs-nice-to-have-igs-for-2026-2027/)
- [Value-Based Care and Its Impact on Prior Authorization — PriorAuthTraining.org](https://www.priorauthtraining.org/understanding-value-based-care-and-its-impact-on-prior-authorization/)
- [ACO REACH Model — CMS.gov](https://www.cms.gov/priorities/innovation/innovation-models/aco-reach)
- [ACO REACH Brings Next Era of Medicare Payment Models — AJMC](https://www.ajmc.com/view/aco-reach-brings-next-era-of-medicare-payment-models)
- [Real Time Prescription Benefit — Surescripts](https://surescripts.com/what-we-do/real-time-prescription-benefit)
- [Price transparency at the point of prescribing with real-time prescription benefits — PMC/NCBI (peer-reviewed study)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11419340/)
- [UnitedHealthcare cuts back prior authorization requirements — Healthcare Dive](https://www.healthcaredive.com/news/unitedhealthcare-prior-authorization-changes-provider-reactions/646399/)
- [UnitedHealth and Cigna Reduce Prior Authorization Requirements for Several Plans — HRS](https://www.hrsonline.org/news/unitedhealthgroup-cignahealthcare-reduce-prior-authorization-requirements/)
- [Insurers Pledge to Improve Prior Authorization — FixPriorAuth.org](https://fixpriorauth.org/insurers-pledge-improve-prior-authorization)
- [UnitedHealthcare, Aetna, Cigna tout progress to standardize prior authorization — Fierce Healthcare](https://www.fiercehealthcare.com/payers/unitedhealthcare-aetna-tout-progress-standardize-prior-authorization-part-industry-wide)
- [H.R.3514 — Improving Seniors' Timely Access to Care Act of 2025 — Congress.gov](https://www.congress.gov/bill/119th-congress/house-bill/3514)
- [S.1816 — Improving Seniors' Timely Access to Care Act of 2025 — Congress.gov](https://www.congress.gov/bill/119th-congress/senate-bill/1816/text)
- [Congress reintroduces Improving Seniors' Timely Access to Care Act — AHA News](https://www.aha.org/news/headline/2024-06-12-congress-reintroduces-improving-seniors-timely-access-care-act-streamline-prior-authorization-under)
- [Boost older adults' access to care by fixing prior authorization — American Medical Association](https://www.ama-assn.org/practice-management/prior-authorization/boost-older-adults-access-care-fixing-prior-authorization)
