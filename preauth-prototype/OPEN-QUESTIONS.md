# Open questions and assumptions

For the review call. Grouped by who has to answer them. The ones marked **blocking**
change the architecture, not just the roadmap.

---

## A. Strategy and market

1. **Who is the customer — provider organisations or payers?** *(blocking)*
   The prototype is built provider-side: the queue belongs to a pre-auth coordinator.
   The same platform could be sold payer-side, where the product is a CRD/DTR/PAS
   facade to meet the January 2027 deadline. These are different companies with
   different sales motions. Building both at once is how this goes wrong.
2. **If provider-side: is the wedge a health system, a specialty group, or an RCM /
   billing company?** RCM companies have the volume and the pain but squeeze on price;
   health systems pay more and take eighteen months to say yes.
3. **Is CMS-0057-F a tailwind or the whole thesis?** If plans only expose these APIs
   because they are compelled to, the quality and coverage of those endpoints in 2027
   will be uneven, and the legacy tier stays load-bearing for years. What does the
   product look like if half of the payer surface is still portal-and-fax in 2028?
4. **Is India / NHCX in scope later?** This build is US-only by decision. The platform
   layer is largely portable; the integration and rules layers are not.
5. **What is the first workflow after pre-auth?** The platform-first argument only pays
   off if there is a credible second workflow. Referral management, quality measure
   abstraction and risk adjustment all reuse the same layer-03 services — which one is
   real?

## B. Product and workflow

6. **Where exactly does the human gate sit — and can a customer move it?** The prototype
   makes it categorical. Every buyer will ask for an auto-submit threshold on "easy"
   cases. Is that a configuration we ship, a thing we refuse, or a thing we ship with a
   floor (e.g. never for medical-benefit drugs or surgery)?
7. **Who is allowed to approve what?** A coordinator can approve a packet; the prototype
   requires a clinician to sign an appeal. Where is the line for a clinical assertion,
   and does it vary by service line?
8. **What happens when the agent is confidently wrong?** The prototype shows gaps and
   partial matches honestly. It does not show a case where the policy agent cites the
   right document for the wrong reason. That failure mode needs a designed answer
   before a pilot, not after.
9. **Is the coordinator's job made better or made monitored?** Every event is logged,
   including overrides. That protects the coordinator in an appeal and is also a
   surveillance surface. Worth deciding deliberately rather than by default.
10. **Does the patient notification channel need its own consent flow?** Assumed
    consent-gated in the prototype; not modelled.

## C. Technical

11. **openEHR *and* FHIR, or FHIR alone?** *(blocking)*
    The prototype shows a repository speaking both. openEHR buys a genuinely
    longitudinal, archetype-governed record; it also buys a second modelling discipline,
    a smaller hiring pool, and a mapping layer. FHIR alone is faster to ship and worse
    at longitudinal structure. This decision propagates into everything.
12. **How do payer policies get into the rules store?** *(blocking)*
    The prototype treats criteria as structured, versioned data. In reality they arrive
    as PDFs, and they change. Options: manual curation (accurate, expensive, does not
    scale), LLM extraction with human review (scales, needs a QA process), or take only
    what DTR gives you (clean, but covers a fraction of payers today). This is the
    least glamorous and highest-leverage question on the list.
13. **Policy versioning.** A case must be judged against the policy in force on its
    date of service. Assumed in the prototype, not designed.
14. **What is the model boundary?** Which steps are deterministic, which call a model,
    and what is the fallback when the model is unavailable or returns something
    unparseable? The prototype implies deterministic orchestration with model calls
    inside individual agent steps — that needs to be a real decision.
15. **How is confidence calibrated?** Currently hand-authored constants. Real
    calibration needs a labelled set of historical determinations from a customer, which
    means the first customer is also the first training partner. Contractually messy.
16. **Terminology licensing.** SNOMED CT and CPT are licensed content. Who holds the
    licence, and what does it cost at our scale?
17. **Token boundary and multi-tenancy.** An EHR's token stays in the trust boundary
    that issued it. Combined with per-tenant key separation, this shapes the deployment
    model — single shared origin, or per-tenant isolation?
18. **Patient matching across sources.** Duplicates are a clinical safety problem.
    Probabilistic matching with what threshold, and who adjudicates a near-match?
19. **Portal automation.** Brittle, breaks on every payer UI change, and is the only
    route to a large share of payers today. Build it, buy it, or refuse the segment?
20. **Latency budget on CDS Hooks.** The invocation round trip has roughly five seconds.
    Any evidence gathering at hook time has to be prefetched or asynchronous. The
    prototype elides this by starting the run after the hook.

## D. Compliance, safety and commercial

21. **Is any part of this a regulated medical device?** The agents do not diagnose or
    recommend treatment; they assemble documentation against payer criteria. That is
    probably outside device regulation — but "probably" needs a written opinion, and the
    answer may differ if the system ever suggests an alternative therapy (which CRD
    itself can return).
22. **What do we log per agent step, and for how long?** The one-pager says model and
    prompt version. That has storage, cost and discovery implications.
23. **Agent memory across customers.** Cross-case learning is the compounding asset and
    the sharpest governance risk — one organisation's outcomes must never inform
    another's without an explicit agreement. Where is that boundary enforced?
24. **How is this priced?** Per case, per seat, per authorised dollar, or a share of
    approvals recovered? Outcome-based pricing is attractive and requires a baseline we
    do not yet have.
25. **BAAs and the data footprint.** Every connected source is a relationship with its
    own paperwork. Who signs what, and what is the cold-start cost per customer?

---

## Assumptions baked into the prototype

Stated so they can be argued with.

- The provider organisation already has authorised connections to the relevant sources.
  Establishing and maintaining those is assumed, and it is the slowest part in reality.
- Payer policies exist as structured, versioned criteria. See question 12.
- The order is the trigger. Cases originating from scheduling, referrals or retro
  authorisation requests are not modelled.
- One authorisation per order. Bundled and episode-based authorisations are not modelled.
- Eligibility is stable between check and submission.
- The payer's pend reason is specific enough to turn into a task. In the prototype it
  names a criterion; in practice many are far vaguer, which is a large part of the problem.
- Appeal outcomes are out of scope. The denial scenario deliberately stops at "appeal
  filed, peer-to-peer scheduled" — no honest demo should simulate a conversation between
  two physicians.
- Outcome targets on the Overview screen are illustrative. Real baselines would come from
  the customer's own last twelve months of determinations; the variance between
  organisations on every one of those metrics is larger than the improvement claimed.
