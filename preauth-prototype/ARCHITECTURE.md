# Architecture — prior authorisation on a clinical data platform we build ourselves

A proposal, not a description. The prototype in this folder demonstrates the workflow; this
document is the argument for what sits underneath it, and what it costs to build rather than buy.

Companion reading: `ONE-PAGER.md` (the thesis in a page), `OPEN-QUESTIONS.md` (what is still
undecided), and the in-app **Platform Core** and **Build Plan** screens, which are this document
made clickable.

---

## 1 · The decision, in one paragraph

Build the clinical data platform first and make prior authorisation the first workflow that runs on
it. A standalone pre-auth agent demos in six weeks and does not compound: the second workflow
re-solves identity, retrieval, terminology, forms and audit from zero. The platform is the
Medblocks-shaped layer — source catalog, authorization, connection state, retrieval, storage, data
out, tenancy — plus three services prior auth forces into it that a patient-access platform does not
have: terminology, a form/CQL engine, and a versioned policy store. **We build it.** Twelve
components, five of which are genuinely ours and seven of which are mostly assembly over bought
parts. Forty weeks to a second tenant onboarding without a code branch.

The test for whether a capability belongs in the core: *could you delete the entire agent layer and
still have something a customer would pay for?* If yes, you built a platform.

---

## 2 · The layers

```
 01  CHANNELS            EHR-embedded app (SMART launch) · provider portal ·
                         payer reviewer view · patient notifications
                              │  SMART launch · CDS Hooks · HTTPS
 02  WORKFLOW             Orchestrator + seven specialist agents + human gates
     (prior auth)         Intake → Eligibility → Evidence → Policy → Packet →
                          Submission → Denial & Appeal
                              │  platform APIs only — every read audited
 ─────────────────────────────────────────────────────────────────────────────
 03  PLATFORM CORE        cc-01 Source catalog & connector registry
     ** we build this **  cc-02 Authorization & token service
                          cc-03 Connection state machine
                          cc-04 Retrieval engine
                          cc-05 Clinical store — raw + derived
                          cc-06 Data out — query, events, export
                          cc-07 Platform shell — tenancy, keys, audit
                          cc-08 Terminology service          ┐ the three prior
                          cc-09 Form & template engine       │ auth forces into
                          cc-10 Policy & rules store         ┘ the core
 ─────────────────────────────────────────────────────────────────────────────
                              │  FHIR · X12 · portal automation
 04  EDGE                 cc-11 Payer edge (PAS · X12 278 · portal)
                          cc-12 EHR write-back & document ingestion
 05  EXTERNAL             Provider EHRs · payers · clearinghouses · TEFCA/QHIN
```

The horizontal rules are the two contracts that matter. Above the first, nothing knows what a FHIR
Bundle looks like. Below the second, nothing knows what a prior authorisation is.

---

## 3 · The seam — what the workflow may ask the core

This is the whole architecture in one interface. If an agent needs something that is not expressible
here, either the interface is wrong or the capability was misplaced.

```ts
interface PlatformCore {
  // cc-05 + cc-08 — clinical questions, not resource fetches
  query(t: TenantCtx, q: ClinicalQuery): Promise<Evidence[]>;
  //   "any conservative therapy episode for patient X in the last 180 days"
  //   resolves through value sets, across every connected source, with provenance
  //   per item — and returns an explicit NOT_FOUND rather than an empty array,
  //   because "this does not exist" is an answer with evidentiary weight.

  // cc-08 — a criterion is a value set, not a string
  expand(t: TenantCtx, valueSet: VsRef): Promise<Coding[]>;
  translate(t: TenantCtx, from: Coding, toSystem: string): Promise<Coding[]>;

  // cc-10 — versioned, effective-dated policy
  policyInForce(t: TenantCtx, payer: Id, code: Coding, onDate: Date): Promise<Policy>;

  // cc-09 — render and prefill; never infer
  prefill(t: TenantCtx, q: QuestionnaireRef, subject: Id): Promise<{
    response: QuestionnaireResponse;
    unanswerable: ItemRef[];       // returned empty and flagged, deliberately
    provenance: Record<ItemRef, EvidenceRef>;
  }>;

  // cc-11 — one call, three transports, chosen from the catalog
  submit(t: TenantCtx, packet: Packet): Promise<SubmissionRef>;
  onDecision(t: TenantCtx, cb: (d: Decision) => void): Unsubscribe;

  // cc-06 + cc-07 — every read above is already written here
  audit(t: TenantCtx, entry: AuditEntry): Promise<void>;
}
```

Four properties are load-bearing:

1. **`TenantCtx` is the first argument of every call.** Not ambient, not a header read somewhere
   deeper. It carries the workspace id that `SET LOCAL app.workspace_id` is derived from, and the
   database enforces isolation beneath it.
2. **Agents never touch storage.** Every read goes through `query`, which writes an audit entry
   before returning. Agents are audited by construction rather than by discipline.
3. **`query` returns provenance per item.** A criterion verdict that cannot name the resource it
   came from is not a verdict, it is a guess with a confidence score attached.
4. **`submit` hides the transport.** The agent does not know whether the packet left by Da Vinci
   PAS, X12 278 or a supervised browser script. When a legacy payer publishes a PAS endpoint, one
   row in the source catalog changes and no agent code is touched.

---

## 4 · The twelve components

| # | Component | Call | Phase | Effort | Why that call |
|---|---|---|---|---|---|
| 01 | Source catalog & connector registry | **build** | P1 | ~1 wk | Two hundred lines and a cron job. Nothing to buy. |
| 02 | Authorization & token service | **build** on `openid-client` | P1–P2 | ~4 wks code | The four SMART patterns are standard; the two-directional token vault and the per-vendor quirk table are yours. |
| 03 | Connection state machine | **build** | P2 | ~1 wk | Six states and a transactional outbox. Small to write, expensive to omit. |
| 04 | Retrieval engine | **build** on BullMQ | P2 | ~3 wks | The queue is bought; the crawl, backoff and pagination semantics per vendor are the product. |
| 05 | Clinical store — raw + derived | **adopt then build** | P1 / P5 | ~1 wk + 6 wks | Adopt Medplum or HAPI for validation, search parameters and references. Write the derived layer. |
| 06 | Data out | **build**, buy webhooks | P3 | ~2 wks | Read API is yours; Svix is cheaper than owning dead-letter semantics. |
| 07 | Platform shell | **build**, buy identity | P3 | ~3 wks | RLS-backed tenancy is yours. Enterprise SSO is WorkOS. |
| 08 | Terminology service | **adopt** | P5 | ~3 wks + licensing | Never hand-roll SNOMED subsumption. Own the value-set versioning on top. |
| 09 | Form & template engine | **build** on `cql-execution` | W1 | ~4 wks | The renderer and the blank-item rule are what a reviewer judges you on. |
| 10 | Policy & rules store | **build** | W1 → forever | continuous | Nothing to buy. The second compounding asset after agent memory. |
| 11 | Payer edge | buy X12, build PAS, **decide** on portal | W1–W2 | ~6 wks | Not core: it changes per payer and per year, which is the property core must not have. |
| 12 | EHR write-back & document ingestion | build thin, buy OCR | W2 | ~3 wks/vendor | Thin per-vendor adapters over one internal interface. |

**The five that are actually the product:** source catalog, connection state, retrieval, derived
clinical models, policy store. Everything else is plumbing that is cheaper to rent.

---

## 5 · One authorisation, end to end

```
 order-sign in the EHR
   └─ CDS Hooks → workflow                              ~5s budget: prefetched or async
        ├─ core.policyInForce(payer, CPT 72148, today)      cc-10
        ├─ core.expand("conservative-therapy")              cc-08
        ├─ core.query("therapy episodes, 180d")             cc-05 + cc-04 + cc-01/02/03
        │     → 3 items with provenance, 1 NOT_FOUND
        ├─ core.prefill(payer questionnaire)                cc-09
        │     → 12 of 14 answered; 2 flagged unanswerable
        │
        ├─ ▸ HUMAN GATE — a named coordinator approves the packet
        │
        ├─ core.submit(packet)                              cc-11 → PAS | X12 | portal
        └─ core.onDecision(...)                             cc-11 ← Subscription | 277 | scrape
              └─ approved → core write-back to the chart    cc-12
                 pended   → more-info loop, re-query wider  cc-04
                 denied   → appeal packet, ▸ CLINICIAN SIGNATURE GATE
```

Two gates, neither governed by a confidence threshold. Confidence controls how much arrives
pre-filled, how loudly gaps are flagged, and queue ordering. It never controls whether a person is
involved.

---

## 6 · Multi-tenancy and identity

Three tiers, and the third is the one usually missing from a prototype:

| Tier | Who | Sees | Never sees |
|---|---|---|---|
| **Platform operator** (vendor) | us | Connector registry, connection health and pull telemetry across every tenant | Any patient, case, packet or clinical content — the role holds no `case.view` permission at all |
| **Tenant administrator** | the customer's own admin | Their connections, policy packs, thresholds, users, full audit log | Another tenant's anything. Cannot approve a submission — separation of duties |
| **End user** | coordinator, clinician, observer | Their role's queue and exceptions | Configuration, other roles' actions, anything cross-tenant |

The platform operator is modelled as a **separate organisation**, not a fourth tenant with extra
rights. It has no patients, no cases, no payer contracts and no agent memory. Modelling it as a
customer-with-privileges is the mistake that eventually produces a cross-tenant read nobody
intended. Sign in as the platform operator in the prototype to see the boundary refuse.

Enforcement, in production:

- `workspace_id` on every table, Postgres row-level security, `SET LOCAL app.workspace_id` once per
  request from the API key. A forgotten `WHERE` clause then leaks nothing.
- Separate credentials and a separate database role for platform operations — not a flag on a user
  row, and certainly not a check in React as it is here.
- **An EHR's token never leaves the trust boundary that issued it.** Proxy the read and re-tokenize.
  This shapes the whole deployment model and is much cheaper to design for than to retrofit.
- **Agent memory stops at the tenant.** Cross-case learning inside one customer is the compounding
  asset; across customers it is the sharpest governance risk in the product. The default until a
  contract says otherwise is no aggregation at all.

Two edges the prototype does not model and a real build must: a SMART launch arrives with the
launching EHR as the tenant (needs a mapping table), and a clinician practising at two organisations
needs two identities with two queues (common).

---

## 7 · Sequencing

| | Phase | Exit criterion |
|---|---|---|
| **P0** | Paperwork — day one, in parallel, forever | Never exits. Only has to have started. |
| **P1** | One source, end to end · wks 1–4 | A real Bundle from a real server, in your own Postgres. |
| **P2** | Make it survive · wks 5–8 | A pull survives a token rotation and a 429 storm unattended. |
| **P3** | Make it usable · wks 9–12 | Support answers "broken or empty?" without a database client. |
| **P4** | Make it plural · wks 13–16 | Adding a source is configuration and waiting, not new code. |
| **P5** | Make it mean something · wks 13–20 | "Six weeks of conservative therapy" answers as a query. |
| **W1** | Pre-auth vertical slice · wks 17–24 | A named coordinator approves a packet; a payer returns an auth number. |
| **W2** | The other two payer tiers · wks 25–32 | Moving a payer from tier 3 to tier 1 changes one catalog row. |
| **W3** | Appeals, memory, tenant two · wks 33–40 | Tenant two onboards in days, with no code branch. |

**P0 is the critical path and it is not engineering.** Production app registration with each EHR
vendor takes weeks to months, runs on someone else's calendar, and no code shortens it. Add the UMLS
licence (SNOMED), the AMA licence (CPT), and a BAA with every subprocessor that touches PHI. If P0
starts in week thirteen, P4 is where the schedule discovers it, and by then engineering cannot fix
it.

---

## 8 · The decisions this document does not make

Stated so they are argued rather than defaulted into. Full list in `OPEN-QUESTIONS.md`.

- **openEHR CDR, or FHIR alone?** The recommendation here is FHIR R4 as the wire and raw shape, with
  the derived layer modelled using openEHR archetype discipline, and the CDR deferred. Deferring is
  recoverable; adopting and reversing is not.
- **How do payer policies get into the store?** Manual curation is accurate and does not scale; LLM
  extraction scales and needs a QA process that is itself a product; DTR-only is clean and covers
  too few payers today. The realistic answer is all three — top fifty by volume curated, tail
  extracted and reviewed — and it is an operations function with permanent headcount.
- **Is the human gate configurable?** It is categorical in this build. Every buyer will ask for an
  auto-submit threshold. Ship it, refuse it, or ship it with a floor — decide before a pilot.
- **Is the administrator genuinely barred from approving?** Separation of duties says yes. In a
  four-person practice the administrator *is* the coordinator, and they will push back hard.
- **Provider-side or payer-side?** The same core could be sold to plans as a CRD/DTR/PAS facade
  against the 1 January 2027 CMS-0057-F deadline. Different company, different sales motion.
  Building both at once is how this goes wrong.
- **What is the second workflow?** The platform-first argument only pays off if one is real.
  Referral management, quality measure abstraction and risk adjustment all reuse layer 03 —
  which one?
