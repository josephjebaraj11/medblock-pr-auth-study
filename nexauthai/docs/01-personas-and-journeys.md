# 01 — Personas and Journeys

**Who uses NexAuthAI, what they are trying to do, and the ten journeys the prototype makes clickable.**

Traceability convention: every persona and journey notes its source. Anything the folder did not specify is marked **[Assumption]**.

---

## 1. The two sentences everything else hangs off

From the client's own requirements document:

> *"The doctor simply clicks **GET AUTHORIZATION**."*

> *"I would not design the system to make independent medical judgments."*

The first is the product promise. The second is the boundary. Every persona below is defined by which side of that boundary they sit on.

---

## 2. Personas

### 2.1 Provider / Clinic Staff — *Dana Whitaker, Prior Authorization Coordinator*

| | |
|---|---|
| Source | Client requirements §4; Vision & Scope §5, §7 |
| Tenant | Northside Orthopaedic & Spine (provider) |
| Scopes | `request:read` `request:create` `request:submit` `request:approve-submission` `queue:work` `policy:read` `connector:read` |
| Lands on | `/provider` |
| Clinical authority | **None.** Cannot attest evidence, cannot decide necessity. |

**What her day looks like today.** Twelve to fourteen hours a week per physician moving between the EHR, the clearinghouse, a dozen payer portals and phone queues. Forty percent of practices hire someone exclusively for this work.

**What NexAuthAI changes.** She stops working a queue of *everything* and starts working a queue of *exceptions*. The dashboard's organising claim is: if a case is not on your list, the agent is still working it.

**What she must never see.** A case that silently failed. The source material is emphatic that a requirement check which cannot be answered routes to a person rather than defaulting to "not required" — because that default is how practices end up with unpaid claims.

**Her five statuses** (Vision & Scope §3C — these are the literal words the client asked for):
*No authorization required · Submitted–pending · Approved · Clinical review required · Expiring soon.*

---

### 2.2 Ordering Physician — *Dr. Adaeze Okafor, Orthopaedic Surgeon*

| | |
|---|---|
| Source | Client requirements (the GET AUTHORIZATION thesis); end-to-end flow §cast |
| Scopes | `request:read:own` `request:create` `clinical:attest` `appeal:approve` `p2p:schedule` `policy:read` |
| Lands on | `/physician` |
| Clinical authority | **Attests evidence; approves appeals; attends peer-to-peer.** Does not issue determinations — that is the payer's reviewer. |

**What she wants.** To press one button and hear nothing further unless there is a genuinely clinical question. The folder is unambiguous that the differentiator is *the doctor doesn't care how the authorization gets obtained.*

**When she is pulled in.** Three moments, and only three:

1. **An evidence gap.** The agent found four weeks of conservative therapy against a six-week policy threshold. Whether concurrent pharmacologic management satisfies the criterion's intent is a clinical judgement, so it comes to her.
2. **A denial.** Every denial routes to a licensed human. She reviews the agent's drafted appeal and either approves it for filing or does not.
3. **A peer-to-peer.** Only a clinician can take that call.

**What the agent hands her.** Not a blank form — the findings pre-populated, each extracted fact linked to the document and span it came from, so she corrects rather than starts over.

---

### 2.3 Payer Intake Reviewer — *Marcus Reyes, UM Intake Specialist* **[Assumption]**

| | |
|---|---|
| Source | **None in the client or consulting material.** Modelled on the payer-side patterns in `pa-tech-landscape.md` (Microsoft's UM accelerator) and `pa-competitors.md` (Cohere Health, Anterior). |
| Tenant | Meridian Health Plan (payer) |
| Scopes | `request:read` `queue:work` `queue:assign` `policy:read` |
| Lands on | `/payer/queue` |
| Clinical authority | **None.** Checks completeness and triages. Explicitly cannot decide. |

**Why this persona exists at all.** The brief asks for payer-side roles. The source folder is entirely provider-side — this is gap **G1** in `00-source-analysis.md`, and it is the largest design gap in the project. Everything here is inference.

**What he does.** Receives submissions over PAS, X12 278 and the portal. Confirms the packet is workable — member matched, codes present, documents attached — and routes to the right clinical reviewer. He is the reason a medical director does not spend their day on paperwork triage.

**The clock.** Expedited requests run a 72-hour window; standard runs 7 calendar days. Both start at receipt, and both are visible on every row of his queue.

---

### 2.4 Payer Clinical Reviewer / Medical Director — *Dr. Ingrid Halvorsen* **[Assumption]**

| | |
|---|---|
| Source | **None in the client or consulting material.** Same basis as 2.3. |
| Scopes | `request:read` `queue:work` `clinical:decide` `appeal:approve` `p2p:schedule` `policy:read` |
| Lands on | `/payer/clinical` |
| Clinical authority | **The only role that can approve, deny or partially approve.** |

**The rule this persona encodes.** `pa-best-solution.md` §3 quotes Cohere Health's position outright: *AI never denies care — only a human clinician can issue a denial.* The counter-example in the same research is UnitedHealth's nH Predict, where denial rates roughly doubled and ~90% of appeals were allegedly reversed.

So in NexAuthAI this is not a UI convention. `paService.recordDecision` **throws** if a denial or partial approval arrives without a named reviewer holding this role. There is no code path that records one otherwise.

**What she sees.** The AI criteria match — each criterion marked met, not met or unclear, with a confidence figure and the evidence behind it. It is an aid. The determination form records the outcome against her name.

---

### 2.5 Patient — *Owen Brooks* **[Assumption]**

| | |
|---|---|
| Source | end-to-end flow §patient journey (indirect beneficiary); `pa-integrations.md` §5 (CMS Patient Access API, 1 Jan 2027) |
| Scopes | `patient:read:self` |
| Lands on | `/patient` |
| Clinical authority | None. Read-only. |

**Deliberately narrow.** The folder says the platform is provider-facing and that the patient *benefits* rather than operates it. From 2027 the Patient Access API must expose PA status and history to a patient's own app — which is the obligation this screen anticipates.

So the portal shows status and a timeline, in plain language, and nothing else. No criteria, no payer rationale, no documents, no clinical detail, no actions. "Your insurer asked for an extra document. Your clinic is sending it — you do not need to do anything."

---

### 2.6 Platform Admin — *Priyanka Raghunathan, Platform Operations Lead*

| | |
|---|---|
| Source | Vision & Scope §7 (three-tier admin model) |
| Scopes | `policy:write` `connector:read` `connector:write` `user:manage` `audit:read` |
| Lands on | `/admin` |
| Clinical authority | None. |

**The Vision & Scope splits this in two**, and the distinction matters commercially:

- **Tenant Admin** — the practice's own administrator. Users, thresholds, escalation routing, payer-matrix overrides, their tenant's audit log.
- **Master Admin** — the platform operator. Tenants, the shared connector registry, cross-tenant health. **Never PHI.**

The prototype collapses them into one switchable role for demo convenience, and the Users screen shows both scope sets separately. In production they are distinct realms.

**What this role actually controls.** The three automation levers the folder insists must be configuration rather than a code change: the auto-submit threshold, the kill switch, and the per-payer trust ramp. Every change writes a new versioned policy record into the audit log.

---

## 3. Permission matrix

| Capability | Clinic staff | Physician | Payer intake | Payer clinical | Patient | Admin |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Create a request | ✓ | ✓ | | | | |
| See case detail (PHI) | ✓ | own | ✓ | ✓ | own status only | |
| Submit to payer | ✓ | | | | | |
| Release a held submission | ✓ | | | | | |
| Attest clinical evidence | | ✓ | | | | |
| **Approve / deny / partially approve** | | | | **✓** | | |
| Approve an appeal for filing | | ✓ | | ✓ | | |
| Request / schedule peer-to-peer | | ✓ | | ✓ | | |
| Triage and assign | | | ✓ | | | |
| Edit threshold, kill switch, trust ramp | | | | | | ✓ |
| Manage connectors and mappings | | | | | | ✓ |
| Read the audit log | | | | | | ✓ |

Implementation note: these are scopes on the session, checked by `useSession().can()` in the UI and re-checked in the service layer. In production they are Keycloak realm roles mapped to token scopes, with the API checking the scope **and** `tenant_id` from the token, and PostgreSQL row-level security enforcing tenant again underneath.

---

## 4. The ten journeys

Each is clickable in the prototype. The demo script in `README.md` walks J1 and J7.

### J1 — Happy path, electronic

> Physician orders an MRI → eligibility active → CRD says PA required → DTR questionnaire auto-fills → packet complete → confidence 0.93 clears the 0.85 threshold → PAS `Claim/$submit` → approved → auth number and valid dates written back.

**Where:** `/provider/new`. Pick Owen Brooks, CPT 72148, Meridian. **Source:** client requirements §1–4; `pa-integrations.md` §7.

The point of this journey is how little happens. Nobody is notified, no task is raised, no human touches it.

---

### J2 — No authorization required

> Requirement check returns "not required" → source, date and reference number written to the chart → case closes. No portal, no call.

**Where:** `/provider/new` with CPT 97161 (physical therapy evaluation) and Meridian.

**Why it has its own journey.** Because the folder is insistent that this is a *positive, evidenced assertion* and never a silent default. The screen says so explicitly, and the audit log records the CRD reference that proves it.

---

### J3 — Clinical gap

> Packet missing two of the six required weeks of conservative therapy → `CLINICAL_REVIEW` → physician reviews the agent's findings, attaches the full therapy record and attests → case resumes at the decision gate → submits.

**Where:** case **NA-1047** (Sofia Marino), as Ordering Physician.

**Source:** the client's own example — *"CLINICAL REVIEW REQUIRED / Missing: 6 weeks conservative treatment documentation."* This is the journey the whole no-medical-judgment boundary exists for.

---

### J4 — Held by the automation gate

> Payer is in Shadow mode → submission held → staff release it → waterfall runs.

**Where:** case **NA-1065** (Kwame Mensah, Caldera), as Clinic Staff.

The gate is three checks in order: kill switch, then the payer's trust mode, then the confidence threshold. Any one of them holds the case. The audit entry names which one did.

---

### J5 — Portal fails, voice succeeds

> No electronic route → browser agent fails because the payer moved a control → voice agent navigates the IVR, holds, speaks to a representative, gets a reference number → transcript stored.

**Where:** any Atlas Mutual case. The Atlas portal connector is deliberately broken with `ui_changed` — visible on `/admin/connectors`.

**Source:** client requirements §3; `MockPortalRpaConnector`. This is the journey that demonstrates the waterfall is real rather than decorative: the failed attempt stays on the case.

---

### J6 — Pended, then resupplied

> Payer pends and asks for one document → agent fetches *that* document → resupplies through the same channel → review resumes **without restarting the request**.

**Where:** case **NA-1052** (Granite State Blue), as Clinic Staff.

**Source:** the client's own pattern, carried over from VICE — *"we need the operative report → retrieve it → submit it."* Under Da Vinci this is a CDex Task; where the payer has no CDex, it is a portal upload against the existing case.

---

### J7 — Denial → appeal

> Denial with CARC 50 → routes to a licensed human, always → agent drafts the appeal citing the omitted evidence → physician approves → filed with the additional documents attached.

**Where:** case **NA-1039** (Robert Hayes, Atlas Mutual), as Ordering Physician.

**The constraint made visible.** The appeal button only appears for a role holding `appeal:approve`, and `paService.fileAppeal` throws if the approving user is not a licensed reviewer.

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

**Where:** `/provider/new`, order 72148 for a patient who already has an open case.

**Source:** end-to-end flow §4. `paService.create` throws a `409 duplicate_request` naming the existing case number. The acceptance criterion in the source material is that the duplicate rate must be **zero**, not low.

---

## 5. What the journeys share

Four threads run through all ten, and they are the four commitments every document in the folder agrees on:

1. **Cost-ordered waterfall** — electronic → portal → voice → human, on every case, not as a special path.
2. **Minimum necessary** — only the documents the matched rule asked for ever leave the chart. Prior authorization is a HIPAA *payment* disclosure, so the treatment exception does not apply.
3. **No duplicate submission** — inquire before submit, plus an idempotency key.
4. **No medical judgment** — missing evidence and every denial escalate to a licensed person.

---

*Next: `02-data-models.md`.*
