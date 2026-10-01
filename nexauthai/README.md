# NexAuthAI

**AI-assisted prior authorization — a clickable, frontend-only prototype.**

The physician clicks one button. The agent confirms coverage, asks the payer whether authorization is even required, assembles exactly the packet that payer's policy asks for, submits it the cheapest way that payer supports, and writes the result back. Staff see only the exceptions.

The line it never crosses: **the agent does the paperwork; it never makes the medical judgment.**

**One portal.** Every tenant on the platform and every persona inside it signs into the same application at the same address — three personas (Staff / Operations, Clinical Reviewer, Admin), four tenants, no separate build per customer and no separate operator console. A token carries a tenant and a set of scopes; the tenant decides whose data you see, the scopes decide what you may do with it. Open **"How this portal works"** in any persona's sidebar to see it laid out.

---

## Run it

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. No backend, no database, no sign-in — pick a persona on the landing screen.

```bash
npm run build       # typecheck + production build
npm run typecheck   # tsc only
```

Requires Node ≥ 20.19.

---

## ⚠️ Synthetic data only

Every patient, MRN, member ID, NPI, payer, clinical note and medical policy in this prototype is **invented**. No real PHI appears anywhere, and none ever should. The payer medical criteria are shaped to resemble real imaging policies but reproduce no actual payer's policy.

State lives in memory. **Reloading the page resets the demo.**

---

## 6-minute demo script

Three parts: one authorization from order to outcome, the clinical boundary and an appeal, then the admin side — tenants, billing and notifications. Timings are generous — the prototype simulates realistic API latency on purpose, so electronic responses take ~1s, portals ~15s and phone calls minutes.

---

### Part 1 — Order → payer outcome *(3 min)*

**① Sign in as Staff / Operations** → **"Staff / Operations"** on the landing screen.

Before you click it, read the blue panel above the cards: **one portal, every tenant, every persona.** That claim is what the rest of the demo is standing on.

The dashboard opens on *what needs a person*, not on everything. Note **"How cases were resolved"** on the right — the channel mix is the waterfall made visible. Electronic is cheap and fast; each step down costs more.

**② New request** → sidebar **New request**.

| Step | Do this | What to point out |
|---|---|---|
| 1 · Patient | Click **Owen Brooks** | 15 synthetic patients |
| 2 · Coverage | **Run eligibility check (270/271)** → **Continue** | Real X12 transaction reference, and the latency is real |
| 3 · Service | Leave **72148 — MRI lumbar spine** and **M54.16** → **Continue** | CPT + ICD-10. Note the urgency toggle: 72h expedited vs 7 days standard, per CMS-0057-F |
| 4 · PA required? | **Check requirement** | The payer capability chips — Meridian supports the full Da Vinci stack. **This answer is evidenced**: source CRD, with a reference number |
| 5 · Documentation | Scroll the **DTR questionnaire** → **Continue** | Fields marked *pre-filled from the chart* came from structured data via CQL. The rest need extraction or a human |
| 6 · Attachments | **Run AI assessment** | Only documents the matched rule asked for. PA is a HIPAA *payment* disclosure — the whole chart never travels |

**③ The AI panel** — this is the centre of the product.

- Click **"Show how this score is made up."** Confidence is six named weighted components, not a bare number.
- **Extracted clinical facts** — each one names the document and the span it came from. A reviewer *checks* the agent rather than trusting it.
- **Payer criteria match** — per criterion: met, not met, or unclear.
- **Drafted medical-necessity letter** — click *Read draft*. It cites only extracted facts, and **it cannot be sent until a human approves it.**
- **Automation gate** — kill switch, then trust mode, then threshold, in that order.

> Say out loud: *there is no "deny" button here, and there is no code path that produces one — in any persona.*

**④ Submit to payer.** Watch the waterfall run. The outcome screen shows which channel resolved it and every attempt, including failures. The determination comes back through a connector and is recorded as the **payer's** act, not anyone's in this portal.

---

### Part 2 — The clinical boundary, and an appeal *(2 min)*

**⑤ Sign in as Clinical Reviewer** → sign-out icon (top right) → **Clinical Reviewer**.

You are now Dr. Adaeze Okafor. The sidebar is different — no *New request*, no *Billing* — because her token carries different scopes, not because she was sent to a different app. The queue holds exactly four kinds of thing, and all four are medical judgements.

- **An evidence gap** — open **NA-1047** (Sofia Marino). The agent found four weeks of conservative therapy against a six-week policy threshold. Whether concurrent medication satisfies the criterion's *intent* is a clinical judgement, so it stopped and asked. Click **Attest evidence & return to agent.**

- **A denial** — open **NA-1048**. A red banner: *"Every denial goes to a licensed human."* The payer's reason codes are structured — CARC 50 — with the rationale and the appeal deadline. Open the **AI assist** tab: the agent has drafted an appeal citing the evidence that was omitted.

**⑥ Approve & file appeal.** The appeal is filed **with Dr. Okafor's approval recorded against it**. Open the **Audit** tab and you will see two entries — `appeal.approved` by a user, then `appeal.filed` by an agent. The human decision and the mechanical action are separate records.

> Try the URL `/admin/billing` while signed in as her. You land back on her queue — scope-gated in the router, and re-checked in the service layer.

---

### Part 3 — Admin: tenants, billing, notifications *(1–2 min)*

**⑦ Sign in as Admin** → sign-out → **Admin**. One persona covers both the practice's own admin and the platform operator; the chip in the header says which reach this user has.

| Screen | Look at | Why it matters |
|---|---|---|
| **Tenants** | Four tenants, one of them on a **dedicated** deployment; realm, region and isolation per tenant | Multi-tenancy is a realm, a `tenant_id` and a row-level-security policy — never a second portal. Counts and rates only: admin holds **no PHI scope** |
| **Connectors** | **athenahealth** is `refresh-failed`; **Atlas Mutual Portal** is `failed` with `ui_changed`. Click **Test connection** | It calls the adapter's real `test()` method. A connection that worked yesterday can quietly stop working today |
| Connectors → Epic → **Field mapping** | SNOMED → ICD-10, local order codes → CPT, and an `unmapped` row | Terminology translation happens at the adapter edge, never in the core |
| **Payers & rules** | Flip a payer's trust mode, or engage the kill switch | Autonomy is configuration, never a code change — and every change writes a new audited policy version |
| **Users & roles** | Three personas and their scopes. **Georgia Bellweather holds two** | One person, two personas, the union of their scopes — a lean practice never needs extra headcount |
| **Billing** | Expand an invoice. Annual license + flat managed services + **itemised pass-through** — voice minutes, EDI transactions, model tokens. Click **Pay now** | A subscription, not a price per PA. Every pass-through line traces to usage, and every usage row names the case that caused it — the waterfall, priced. Stripe holds the instrument; the portal sees a last four |
| **Audit log** | *"Hash chain intact"* — and your `invoice.paid` entry at the top | Append-only. There is no edit or delete control, here or in the API |
| **Notifications** | Enable **web push**, then toggle **email** off for one event | Three channels, one payload rule: *"One authorization case is waiting on a clinical judgement"* — no patient name, no diagnosis, no CPT. Turning a channel off suppresses delivery only; the event, the in-app row and the audit entry still happen |
| **How this portal works** | The bottom of every sidebar | The whole single-portal argument on one page: realm → scope → RLS, the three personas, notifications, billing |

## Persona walkthrough

Three personas. One application, one navigation list, one route table — filtered by scopes.

| Persona | Lands on | Can do |
|---|---|---|
| **Staff / Operations** | `/ops` | Create requests, submit, release held submissions, respond to RFIs, request extensions, update coverage, work the exception queue |
| **Clinical Reviewer** *(licensed)* | `/clinical` | Attest clinical evidence, approve appeals, request peer-to-peer, browse cases for context. **The only persona that makes a medical judgement** |
| **Admin** | `/admin` | Tenants, connectors, field mappings, payer rules, automation policy, users, billing, audit. **No PHI scopes at all** — tenant reach or platform reach, same screens |

Every persona also gets `/notifications` (its own delivery preferences) and `/portal` (how the single portal works).

**Nobody issues a determination.** Approve, deny and partially approve are the payer's acts; they arrive through a connector and are recorded as the payer's. A denial always raises a task for the Clinical Reviewer — unconditionally, as a rule rather than a setting.

## All ten journeys

| # | Journey | Where |
|---|---|---|
| J1 | Happy path, electronic | `/ops/new` — Owen Brooks, 72148, Meridian |
| J2 | **No authorization required** (evidenced) | `/ops/new` — CPT 97161 with Meridian |
| J3 | Clinical gap → attest | **NA-1047** as Clinical Reviewer |
| J4 | Held by the automation gate | **NA-1065** as Staff / Operations (Caldera is in Shadow) |
| J5 | Portal fails → voice succeeds | Any Atlas Mutual case — the portal connector is deliberately broken |
| J6 | Pended → resupply one document | **NA-1052** as Staff / Operations |
| J7 | Denial → appeal | **NA-1039** / **NA-1048** as Clinical Reviewer |
| J8 | Approval expires before the service date | **NA-1044** as Staff / Operations |
| J9 | Coverage terminated | **NA-1067** as Staff / Operations |
| J10 | **Duplicate blocked** | `/ops/new` — order 72148 for a patient with an open case |

---

## What's in the data

28 prior-authorization requests across every status · 15 patients · **4 tenants** (three multi-tenant, one dedicated) · 5 payers (spanning all four capability tiers and both CMS-0057-F categories) · 3 EHRs plus a generic FHIR and an HL7 v2 fallback · 11 connector types, 9 configured instances · 6 payer policies · 2 DTR questionnaires · **4 billing accounts, 3 invoices and the usage behind them** · 12 notifiable event types with per-user email and web-push preferences · a hash-chained audit log.

---

## Project structure

```
nexauthai/
├── README.md
├── docs/
│   ├── 00-source-analysis.md        # What the source folder says, and what it leaves open
│   ├── 01-personas-and-journeys.md  # One portal, three personas, ten journeys
│   ├── 02-data-models.md            # 24 entities, FHIR R4 + X12 278 mappings, ER diagram
│   ├── 03-architecture.md           # Production architecture, security, AI design, CMS-0057-F
│   ├── 04-build-plan.md             # MVP → v1 → scale, team, risks, metrics
│   ├── 05-connector-architecture.md # The adapter layer, Medblocks-style
│   └── NexAuthAI-Solution.md        # Everything, in one document
└── src/
    ├── types/        # The canonical model
    ├── mocks/        # Synthetic fixtures + the in-memory store
    ├── services/     # Fake service layer — simulated latency, the API seam
    ├── connectors/   # Adapter contract + mock EHR/payer/clearinghouse/portal/voice adapters
    ├── components/   # Shared UI
    ├── pages/        # ops/ · clinical/ · admin/ · shared/
    └── routes/       # Scope-gated routing
```

### The seam

`src/services/*` is where a real API goes. Every call returns a promise and takes a simulated round trip, so the UI is built against latency from the start. Swapping these for `fetch` against a real `/v1` endpoint should not require touching a single component.

`src/connectors/*` implements the production adapter contract. The submission waterfall genuinely routes through these mocks — testing a connection on the admin screen calls the adapter's own `test()` method, and a broken portal connector really does fall through to voice.

---

## Verification

Typechecks and builds clean. A Playwright script (`smoke.mjs`) drives all three personas and every journey:

```bash
npm run dev          # in one terminal
node smoke.mjs       # in another
```

**67/67 checks pass, zero console errors.** Covers every persona's main flow, all ten journeys, the case-detail tabs, scope gating in both directions (Operations blocked from admin, Clinical blocked from billing), the tenants screen, connector test/reconnect, policy changes, billing — invoice expansion, payment, pass-through mode — notification preferences and web-push enablement, the "How this portal works" page from every persona, audit-chain verification, mobile layout at 390px (no horizontal scroll) and dark theme.

---

## Accessibility and responsiveness

Semantic landmarks and a skip link · one visible focus treatment throughout · labelled form controls with `aria-describedby` hints · `role="meter"` on confidence bars · ARIA tabs · live regions on loading states · WCAG 2.1 AA contrast on all token pairings · wide tables scroll inside their own container so the page never scrolls sideways · light and dark themes via CSS variables · `prefers-reduced-motion` respected.

---

## Reading order

1. **[`docs/00-source-analysis.md`](docs/00-source-analysis.md)** — start here. What the source material actually says, the contradictions in it, and the eight gaps. Everything else rests on this.
2. **[`docs/NexAuthAI-Solution.md`](docs/NexAuthAI-Solution.md)** — the whole proposal in one document.
3. The numbered docs for depth on personas, data, architecture, plan and connectors.

Two things to know before reading any of it: **the personas were reduced to the three the client's own table names** — Staff/Operations, Clinical Reviewer and Admin, with Tenant Admin and Master Admin merged into one persona with two reaches — and **all 107 discovery questions are unanswered**, so every concrete value here is a placeholder.

The payer-side and patient-side screens that earlier drafts carried have been removed: payers are counterparties reached through connectors, not tenants, and patient access is a 2027 CMS obligation served through the practice rather than a seat in this portal. `docs/00-source-analysis.md` gap **G1** records why they were ever modelled.
