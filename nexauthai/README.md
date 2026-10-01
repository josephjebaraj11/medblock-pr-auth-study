# NexAuthAI

**AI-assisted prior authorization — a clickable, frontend-only prototype.**

The physician clicks one button. The agent confirms coverage, asks the payer whether authorization is even required, assembles exactly the packet that payer's policy asks for, submits it the cheapest way that payer supports, and writes the result back. Staff see only the exceptions.

The line it never crosses: **the agent does the paperwork; it never makes the medical judgment.**

---

## Run it

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. No backend, no database, no sign-in — pick a role on the landing screen.

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

## 5-minute demo script

Two journeys: one authorization from provider submission to payer approval, then an appeal on a denied case. Timings are generous — the prototype simulates realistic API latency on purpose, so electronic responses take ~1s, portals ~15s and phone calls minutes.

---

### Part 1 — Provider submission → payer approval *(3 min)*

**① Sign in as Provider / Clinic Staff** → **"Provider / Clinic Staff"** on the landing screen.

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

> Say out loud: *there is no "deny" button here, and there is no code path that produces one.*

**④ Submit to payer.** Watch the waterfall run. The outcome screen shows which channel resolved it and every attempt, including failures.

**⑤ Switch to the payer side** → sign-out icon (top right) → **Payer Clinical Reviewer**.

You are now Dr. Ingrid Halvorsen, a medical director at Meridian. Open any case in the queue.

- The **AI criteria match** appears here too — as an *aid*, not a determination.
- Scroll to **Issue determination**. Choose **Approve**, write a rationale, and record it.

> The determination is recorded against her name. Try the same as **Payer Intake Reviewer** and the form is replaced by *"Only a licensed clinical reviewer may issue a determination."* That is enforced in the service layer, not just hidden in the UI.

---

### Part 2 — Appeal on a denied case *(2 min)*

**⑥ Sign in as Ordering Physician** → sign-out → **Ordering Physician**.

**⑦ Clinical review** → sidebar. Two kinds of case reach a clinician, and only these two:

- **An evidence gap** — open **NA-1047** (Sofia Marino). The agent found four weeks of conservative therapy against a six-week policy threshold. Whether concurrent medication satisfies the criterion's *intent* is a clinical judgement, so it stopped and asked. Click **Attest evidence & return to agent.**

- **A denial** — go to **My orders**, open a denied case (e.g. **NA-1048**).

**⑧ The denial.** A red banner: *"Every denial goes to a licensed human."* The payer's reason codes are structured — CARC 50 — with the rationale and the appeal deadline.

Open the **AI assist** tab: the agent has drafted an appeal citing the evidence that was omitted.

**⑨ Approve & file appeal.** Note what happens: the appeal is filed **with Dr. Okafor's approval recorded against it**. Open the **Audit** tab and you will see two entries — `appeal.approved` by a user, then `appeal.filed` by an agent. The human decision and the mechanical action are separate records.

---

### If you have two more minutes

| Role | Look at | Why it matters |
|---|---|---|
| **Platform Admin** → Connectors | **athenahealth** is `refresh-failed`; **Atlas Mutual Portal** is `failed` with `ui_changed` | A connection that worked yesterday can quietly stop working today. Click **Test connection** — it calls the adapter's real `test()` method |
| Admin → Connectors → Epic → **Field mapping** | SNOMED → ICD-10, local order codes → CPT, and an `unmapped` row | Terminology translation happens at the adapter edge, never in the core |
| Admin → **Payers & rules** | Flip a payer's trust mode, or engage the kill switch | Autonomy is configuration, never a code change — and every change writes a new audited policy version |
| Admin → **Audit log** | *"Hash chain intact — all N entries verify"* | Append-only. There is no edit or delete control, here or in the API |
| **Patient** | Owen Brooks' view | Status and timeline only, in plain language. No clinical detail, no criteria, no rationale |
| Any role → **Notifications** | *"One authorization case is waiting on a clinical judgement"* | Deliberately vague. No patient name, no diagnosis, no CPT — no PHI in a payload, ever |

---

## Role walkthrough

| Role | Lands on | Can do |
|---|---|---|
| **Provider / Clinic Staff** | `/provider` | Create requests, submit, release held submissions, respond to RFIs, request extensions, work the exception queue |
| **Ordering Physician** | `/physician` | See own orders, attest clinical evidence, approve appeals, request peer-to-peer |
| **Payer Intake Reviewer** | `/payer/queue` | Completeness check, triage to clinical review. **Cannot decide** |
| **Payer Clinical Reviewer** | `/payer/clinical` | **The only role that can approve, deny or partially approve** |
| **Patient** | `/patient` | Read-only status and timeline |
| **Platform Admin** | `/admin` | Connectors, field mappings, payer rules, automation policy, users, audit. **No PHI scopes at all** |

---

## All ten journeys

| # | Journey | Where |
|---|---|---|
| J1 | Happy path, electronic | `/provider/new` — Owen Brooks, 72148, Meridian |
| J2 | **No authorization required** (evidenced) | `/provider/new` — CPT 97161 with Meridian |
| J3 | Clinical gap → attest | **NA-1047** as Ordering Physician |
| J4 | Held by the automation gate | **NA-1065** as Clinic Staff (Caldera is in Shadow) |
| J5 | Portal fails → voice succeeds | Any Atlas Mutual case — the portal connector is deliberately broken |
| J6 | Pended → resupply one document | **NA-1052** as Clinic Staff |
| J7 | Denial → appeal | **NA-1039** / **NA-1048** as Ordering Physician |
| J8 | Approval expires before the service date | **NA-1044** as Clinic Staff |
| J9 | Coverage terminated | **NA-1067** as Clinic Staff |
| J10 | **Duplicate blocked** | `/provider/new` — order 72148 for a patient with an open case |

---

## What's in the data

28 prior-authorization requests across every status · 15 patients · 5 payers (spanning all four capability tiers and both CMS-0057-F categories) · 3 EHRs plus a generic FHIR and an HL7 v2 fallback · 11 connector types, 9 configured instances · 6 payer policies · 2 DTR questionnaires · a hash-chained audit log.

---

## Project structure

```
nexauthai/
├── README.md
├── docs/
│   ├── 00-source-analysis.md        # What the source folder says, and what it leaves open
│   ├── 01-personas-and-journeys.md  # Six roles, ten journeys
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
    ├── pages/        # Grouped by role
    └── routes/       # Scope-gated routing
```

### The seam

`src/services/*` is where a real API goes. Every call returns a promise and takes a simulated round trip, so the UI is built against latency from the start. Swapping these for `fetch` against a real `/v1` endpoint should not require touching a single component.

`src/connectors/*` implements the production adapter contract. The submission waterfall genuinely routes through these mocks — testing a connection on the admin screen calls the adapter's own `test()` method, and a broken portal connector really does fall through to voice.

---

## Verification

Typechecks and builds clean. A Playwright script (`smoke.mjs`) drives all six roles and every journey:

```bash
npm run dev          # in one terminal
node smoke.mjs       # in another
```

**45/45 checks pass, zero console errors.** Covers every role's main flow, all ten journeys, the case-detail tabs, connector test/reconnect, policy changes, audit-chain verification, mobile layout at 390px (no horizontal scroll) and dark theme.

---

## Accessibility and responsiveness

Semantic landmarks and a skip link · one visible focus treatment throughout · labelled form controls with `aria-describedby` hints · `role="meter"` on confidence bars · ARIA tabs · live regions on loading states · WCAG 2.1 AA contrast on all token pairings · wide tables scroll inside their own container so the page never scrolls sideways · light and dark themes via CSS variables · `prefers-reduced-motion` respected.

---

## Reading order

1. **[`docs/00-source-analysis.md`](docs/00-source-analysis.md)** — start here. What the source material actually says, the contradictions in it, and the eight gaps. Everything else rests on this.
2. **[`docs/NexAuthAI-Solution.md`](docs/NexAuthAI-Solution.md)** — the whole proposal in one document.
3. The numbered docs for depth on personas, data, architecture, plan and connectors.

Two things to know before reading any of it: **the payer-side roles are an assumption** — the source folder is entirely provider-side — and **all 107 discovery questions are unanswered**, so every concrete value here is a placeholder.
