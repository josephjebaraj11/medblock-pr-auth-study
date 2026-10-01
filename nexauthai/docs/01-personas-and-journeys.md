# 01 — Personas and Journeys

**Who uses NexAuthAI, what they are trying to do, and the ten journeys the prototype makes clickable.**

Three personas, one portal, ten journeys.

Traceability convention: every persona and journey notes its source. Anything the folder did not specify is marked **[Assumption]**.

---

## 1. The two sentences everything else hangs off

From the client's own requirements document:

> *"The doctor simply clicks **GET AUTHORIZATION**."*

> *"I would not design the system to make independent medical judgments."*

The first is the product promise. The second is the boundary. Every persona below is defined by which side of that boundary they sit on — and all of them live in one portal.

---

## 2. One portal

Before the personas, the thing they all share.

**There is exactly one application.** Every tenant on the platform and every persona inside it signs into the same portal at the same address. There is no separate build per customer, no separate app per role, and no separate operator console. A Keycloak token carries two things, and between them they decide everything:

| The token carries | It decides | Enforced by |
|---|---|---|
| `tenant_id` (realm-bound) | **Whose** data you see | Realm per tenant · `tenant_id` first in every key · PostgreSQL row-level security |
| Scopes | **What** you may do with it | API scope check per endpoint · `useSession().can()` in the UI |

Multi-tenancy and multi-persona are therefore the same mechanism seen from two angles, and neither is a deployment fork. A customer that requires its own infrastructure gets a dedicated or air-gapped deployment of this same codebase with its own realm and keys — a deployment option, not a different product.

One person can hold more than one persona. A lean practice routinely has a manager who is both Operations and Admin; the portal renders the **union** of their scopes. A lean persona set never forces extra headcount.

The prototype states this on the sign-in screen, in the header (a tenant chip next to a persona chip), and on **`/portal` — "How this portal works"**, which is in every persona's navigation.

Source: end-to-end flow §platform (*"One portal, shaped by role"*, Keycloak realm per tenant); Vision & Scope §7.

---

## 3. Personas

Three, from the client's own persona table: **Staff / Operations**, **Clinical Reviewer (licensed)**, and **Admin** — the Vision & Scope's *Tenant Admin* and *Master Admin* merged into one persona with two reaches (§3.3).

There is no separate ordering-physician seat: the physician's one action, *GET AUTHORIZATION*, is placed by Operations or arrives from the EHR, and anything clinical goes to the Clinical Reviewer. There is no payer seat: payers are counterparties reached through connectors, not tenants. There is no patient seat: patient access is a 2027 CMS obligation served through the practice, not a login.

### 3.1 Staff / Operations — *Dana Whitaker, Prior Authorization Coordinator*

| | |
|---|---|
| Source | Client requirements §4; Vision & Scope §5, §7; end-to-end flow §platform personas |
| Who | The practice's queue workers — billing and front desk combined |
| Scopes | `request:read` `request:create` `request:submit` `request:approve-submission` `queue:work` `policy:read` |
| Lands on | `/ops` |
| Clinical authority | **None.** Cannot attest evidence, cannot decide necessity. |

**What her day looks like today.** Twelve to fourteen hours a week per physician moving between the EHR, the clearinghouse, a dozen payer portals and phone queues. Forty percent of practices hire someone exclusively for this work.

**What NexAuthAI changes.** She stops working a queue of *everything* and starts working a queue of *exceptions*. The dashboard's organising claim is: if a case is not on your list, the agent is still working it.

**What she sees and does.** Status, submissions, document follow-up, administrative exceptions — plus releasing a held submission while a payer is still in Shadow mode, answering a payer's information request, and chasing an approval that will lapse before the procedure.

**What she must never see.** A case that silently failed. The source material is emphatic that a requirement check which cannot be answered routes to a person rather than defaulting to "not required" — because that default is how practices end up with unpaid claims.

**Her five statuses** (Vision & Scope §3C — these are the literal words the client asked for):
*No authorization required · Submitted–pending · Approved · Clinical review required · Expiring soon.*

---

### 3.2 Clinical Reviewer *(licensed)* — *Dr. Adaeze Okafor, Orthopaedic Surgeon*

| | |
|---|---|
| Source | Client requirements (*"I would not design the system to make independent medical judgments"*); end-to-end flow §cast and §platform personas |
| Who | A licensed clinician — MD, DO, NP, PA or licensed therapist as the practice designates |
| Scopes | `request:read` `clinical:attest` `clinical:decide` `appeal:approve` `appeal:file` `p2p:schedule` `queue:work` `policy:read` |
| Lands on | `/clinical` |
| Clinical authority | **Attests evidence; approves appeals; attends peer-to-peer.** Does not issue determinations — those are the payer's, and they arrive through a connector. |

**Why this is a distinct persona on purpose.** So that only licensed people make, and are audited for, medical calls. It is the one persona carrying `canMakeClinicalDetermination`, and the UI uses that flag to decide whether to offer a clinical control at all.

**When she is pulled in.** Four moments, and only four:

1. **An evidence gap.** The agent found four weeks of conservative therapy against a six-week policy threshold. Whether concurrent pharmacologic management satisfies the criterion's intent is a clinical judgement, so it comes to her.
2. **A denial.** Every denial routes to a licensed human, unconditionally — it is the rule, not a configuration.
3. **An appeal.** The agent drafts it; she approves it, or it is not filed.
4. **A peer-to-peer.** Only a clinician can take that call.

**What the agent hands her.** Not a blank form — the findings pre-populated, each extracted fact linked to the document and span it came from, so she corrects rather than starts over.

---

### 3.3 Admin — *Priyanka Raghunathan, Platform Operations Lead*

| | |
|---|---|
| Source | Vision & Scope §7 (three-tier admin model); end-to-end flow §platform personas (Tenant Admin, Master Admin) |
| Scopes | `policy:read` `policy:write` `connector:read` `connector:write` `user:manage` `audit:read` `tenant:manage` `billing:manage` `platform:admin` |
| Lands on | `/admin` |
| Clinical authority | None. **Holds no PHI scope at all** — deliberately no `request:read`. |

**Tenant Admin and Master Admin are one persona with two reaches.** The source material splits them, and the distinction is real but it is a matter of *scope*, not of screens:

| Reach | Who | Sees |
|---|---|---|
| `tenant` | The practice's own administrator | One tenant: its users, thresholds, escalation routing, payer-matrix overrides, connections, billing, audit log |
| `platform` | The platform operator (us) | Every tenant, plus the shared connector registry and cross-tenant health |

Both use the same screens in the same portal. `User.adminScope` is the only thing that differs, and `adminService.listTenants(scope, tenantId)` returns one row or all of them accordingly. Neither reach can open a case — a platform admin can see that a tenant's exception rate is climbing, and cannot see a single case behind it.

**What this persona actually controls.** The three automation levers the folder insists must be configuration rather than a code change — the auto-submit threshold, the kill switch and the per-payer trust ramp — plus connections and field mappings, users and roles, the tenant list, billing, and the audit log. Every change writes a new versioned policy record into the audit log.

---

## 4. Permission matrix

| Capability | Staff / Operations | Clinical Reviewer | Admin |
|---|:-:|:-:|:-:|
| Create a request (GET AUTHORIZATION) | ✓ | | |
| See case detail (PHI) | ✓ | ✓ | |
| Submit to payer | ✓ | | |
| Release a held submission | ✓ | | |
| Answer a payer information request | ✓ | | |
| Request a date-span extension | ✓ | | |
| Update coverage, re-run eligibility | ✓ | | |
| **Attest clinical evidence** | | **✓** | |
| **Approve an appeal for filing** | | **✓** | |
| **Request / attend peer-to-peer** | | **✓** | |
| Browse all cases for clinical context | | ✓ | |
| Manage tenants | | | ✓ |
| Edit threshold, kill switch, trust ramp | | | ✓ |
| Manage connectors and mappings | | | ✓ |
| Manage users and roles | | | ✓ |
| Billing, invoices, usage | | | ✓ |
| Read the audit log | | | ✓ |
| Notification preferences (own) | ✓ | ✓ | ✓ |

**Nobody issues a determination.** Approve, deny and partially approve are the payer's acts. They arrive through a connector — a PAS `ClaimResponse`, an X12 278 response, a portal screen or a call outcome — and `paService.recordDecision` records them as coming from the payer, refusing any attempt to attribute one to a user of this portal. A denial always raises a task for the Clinical Reviewer.

Implementation note: these are scopes on the session, checked by `useSession().can()` in the UI and re-checked in the service layer. In production they are Keycloak realm roles mapped to token scopes, with the API checking the scope **and** `tenant_id` from the token, and PostgreSQL row-level security enforcing tenant again underneath.

---

## 5. Multi-tenancy

Four synthetic tenants ship in the prototype, visible on `/admin/tenants` to an admin with platform reach:

| Tenant | Tier | Deployment | Realm | Primary EHR |
|---|---|---|---|---|
| Northside Orthopaedic & Spine | growth | multi-tenant | `nexauth-northside` | Epic |
| Harbor Point Imaging | scale | multi-tenant | `nexauth-harbor` | athenahealth |
| Cascade Valley Rehab | starter | multi-tenant (onboarding) | `nexauth-cascade` | eClinicalWorks |
| Stillwater Health Network | enterprise | **dedicated** | `nexauth-stillwater` | Oracle Health |

Three independent mechanisms isolate them, and none of them is a second portal:

1. **Realm.** One Keycloak realm per tenant. A token issued by one realm is not accepted by another, so cross-tenant access fails before any application code runs.
2. **Scope.** The API checks the scope the endpoint requires. A missing scope is a 403, whichever tenant you belong to.
3. **Row-level security.** Postgres filters by `tenant_id` taken from the token, so a query that forgets its tenant returns nothing rather than someone else's rows.

Every entity in `src/types/core.ts` carries `tenantId` for exactly this reason: a service call that forgets to scope by tenant is visible in the prototype rather than in production.

Source: Vision & Scope §7; end-to-end flow §identity; blueprint v2 ADR-007.

---

## 6. Notifications — email and web push

Staff do not sit and watch a queue. The same domain events that move a case fan out to a notification service, which delivers on three channels:

| Channel | What it is | Preference |
|---|---|---|
| **In-app** | The bell and the notification centre | Always on — it *is* the queue |
| **Email** | Transactional, to the user's address | Opt-out per event type |
| **Web push** | Browser service worker, delivered with the dashboard closed | Opt-out per event type, and requires a browser permission grant |

**One payload rule, identical on all three.** A notification carries an ID and an event type and nothing else — no patient name, no diagnosis, no procedure code, no payer rationale. The message says a case needs attention and links back into the app, where access is re-checked on arrival. An inbox and a lock screen are the two places PHI must never sit, so the rule is enforced in the fixtures themselves (`src/mocks/workflow.ts`) rather than left to convention.

**Turning a channel off suppresses delivery only.** The domain event still fires, the in-app row still appears, and the audit entry is still written — a preference can never make something vanish from the record.

Events are role-scoped: a clinical-review request only ever reaches the Clinical Reviewer, a held submission only reaches Operations, a connection failure or an invoice only reaches Admin. `/notifications` shows each persona only the events it can receive.

Source: end-to-end flow §notifications.

---

## 7. Billing and payment

One Stripe customer per tenant. The model is the documented one — a **subscription, not a price per authorization**:

| Component | Type | Shape |
|---|---|---|
| **Onboarding** | One-time | Tiered by complexity — ~$3.5K (Starter) to ~$20K (Enterprise+) |
| **Annual license** | Recurring | Tiered by physician count — ~$15K/yr to ~$175K/yr; the per-physician rate falls with scale |
| **Managed services + cloud** | Recurring, **flat** | ~$3,000 per customer per month — hosting, platform, baseline run cost |
| **Net-new integration** | One-time, hourly | Custom EHR / payer / portal / voice work at $50/hr; once a connector is reusable, later customers do not re-pay its build |
| **Pass-through usage** | Recurring, variable | Clearinghouse/EDI transactions, portal sessions, voice minutes, model tokens, fax pages — itemised per channel or folded into the flat fee, per tenant |

The **$4-per-PA** figure in the market model is a TAM/SAM sizing device, never the billing mechanism.

**Why the pass-through table matters.** Every usage record names the case that caused the spend, so an invoice line — *"612 voice minutes"* — can be audited down to the exact cases behind it. That also prices the waterfall honestly: an electronic check costs a fraction of a cent, a portal session cents, a voice call dollars. Cheapest-channel-first is a margin decision as well as a speed one.

**What never reaches this application.** The payment instrument. Stripe holds it; the portal reads back a brand and a last four and a `pm_…` reference. Settling an invoice is a Stripe payment intent against the stored method, and the act is written to the audit log (`invoice.paid`) like any other.

`/admin/billing` shows the plan, the tier table, the invoices with expandable lines, the pass-through mode switch, and a sample of the metering behind this period's variable lines. Admin holds no PHI scope, so a usage row names a case *number* and goes no further.

Source: end-to-end flow §billing; `ClearAuth_AI_Onboarding_Costs_Breaktup.html`; the PRICE models.

---

## 8. The ten journeys

Each is clickable in the prototype. The demo script in `README.md` walks J1 and J7.

### J1 — Happy path, electronic

> An order arrives — from the EHR as `order-sign`, or Operations places it → eligibility active → CRD says PA required → DTR questionnaire auto-fills → packet complete → confidence 0.93 clears the 0.85 threshold → PAS `Claim/$submit` → approved → auth number and valid dates written back.

**Where:** `/ops/new`. Pick Owen Brooks, CPT 72148, Meridian. **Source:** client requirements §1–4; `pa-integrations.md` §7.

The point of this journey is how little happens. Nobody is notified, no task is raised, no human touches it.

---

### J2 — No authorization required

> Requirement check returns "not required" → source, date and reference number written to the chart → case closes. No portal, no call.

**Where:** `/ops/new` with CPT 97161 (physical therapy evaluation) and Meridian.

**Why it has its own journey.** Because the folder is insistent that this is a *positive, evidenced assertion* and never a silent default. The screen says so explicitly, and the audit log records the CRD reference that proves it.

---

### J3 — Clinical gap

> Packet missing two of the six required weeks of conservative therapy → `CLINICAL_REVIEW` → the clinical reviewer reads the agent's findings, attaches the full therapy record and attests → case resumes at the decision gate → submits.

**Where:** case **NA-1047** (Sofia Marino), as Clinical Reviewer.

**Source:** the client's own example — *"CLINICAL REVIEW REQUIRED / Missing: 6 weeks conservative treatment documentation."* This is the journey the whole no-medical-judgment boundary exists for.

---

### J4 — Held by the automation gate

> Payer is in Shadow mode → submission held → Operations release it → waterfall runs.

**Where:** case **NA-1065** (Kwame Mensah, Caldera), as Staff / Operations.

The gate is three checks in order: kill switch, then the payer's trust mode, then the confidence threshold. Any one of them holds the case. The audit entry names which one did.

---

### J5 — Portal fails, voice succeeds

> No electronic route → browser agent fails because the payer moved a control → voice agent navigates the IVR, holds, speaks to a representative, gets a reference number → transcript stored.

**Where:** any Atlas Mutual case. The Atlas portal connector is deliberately broken with `ui_changed` — visible on `/admin/connectors`.

**Source:** client requirements §3; `MockPortalRpaConnector`. This is the journey that demonstrates the waterfall is real rather than decorative: the failed attempt stays on the case.

---

### J6 — Pended, then resupplied

> Payer pends and asks for one document → agent fetches *that* document → resupplies through the same channel → review resumes **without restarting the request**.

**Where:** case **NA-1052** (Granite State Blue), as Staff / Operations.

**Source:** the client's own pattern, carried over from VICE — *"we need the operative report → retrieve it → submit it."* Under Da Vinci this is a CDex Task; where the payer has no CDex, it is a portal upload against the existing case.

---

### J7 — Denial → appeal

> Denial with CARC 50 → routes to a licensed human, always → agent drafts the appeal citing the omitted evidence → the clinical reviewer approves → filed with the additional documents attached.

**Where:** case **NA-1039** (Robert Hayes, Atlas Mutual), as Clinical Reviewer.

**The constraint made visible.** The appeal button only appears for a persona holding `appeal:approve`, and `paService.fileAppeal` throws if the approving user is not a licensed reviewer.

---

### J8 — Approval that expires too early

> Expiry timer notices valid-to falls before the scheduled procedure date → "Expiring soon" → staff request a date-span extension.

**Where:** case **NA-1044** (Eleanor Whitmore) — approved, valid to 18 October, procedure booked for 22 October.

**Source:** Vision & Scope §3C and §2E. Note that "Expiring soon" is a *derived* flag, not a status — it is computed from two dates, so it cannot go stale.

---

### J9 — Coverage terminated

> Eligibility returns coverage terminated → administrative exception → staff update the member ID → case re-runs from eligibility.

**Where:** case **NA-1067** (Robert Hayes, coverage ended 31 August).

---

### J10 — Duplicate prevention

> Same patient and CPT ordered twice → inquire-before-submit plus the idempotency key → the existing case opens instead. No second authorization.

**Where:** `/ops/new`, order 72148 for a patient who already has an open case.

**Source:** end-to-end flow §4. `paService.create` throws a `409 duplicate_request` naming the existing case number. The acceptance criterion in the source material is that the duplicate rate must be **zero**, not low.

---

## 9. What the journeys share

Four threads run through all ten, and they are the four commitments every document in the folder agrees on:

1. **Cost-ordered waterfall** — electronic → portal → voice → human, on every case, not as a special path.
2. **Minimum necessary** — only the documents the matched rule asked for ever leave the chart. Prior authorization is a HIPAA *payment* disclosure, so the treatment exception does not apply.
3. **No duplicate submission** — inquire before submit, plus an idempotency key.
4. **No medical judgment** — missing evidence and every denial escalate to a licensed person.

---

*Next: `02-data-models.md`.*
