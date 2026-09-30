# Agentic Prior Authorization — clickable prototype

A front-end-only React application: an agentic prior-authorization workflow running **on top of**
a clinical data platform we build ourselves, with mocked multi-tenant sign-in and role-based gates.
Built to explain the vision in a review call, not to be deployed.

Eleven screens in three groups: **the case** (the problem and the design), **the system, working**
(the clickable demo), and **the platform we build** — the twelve-component build sheet, a forty-week
plan, and a vendor-side operator console. See `ARCHITECTURE.md` for the proposal in prose.

**Market:** US payers (Da Vinci CRD / DTR / PAS, X12 278, CMS-0057-F).
**Nothing here is real.** No backend, no network calls, no authentication. Every patient, payer,
policy, user, authorization number and metric is fabricated.

---

## Run it

```bash
cd preauth-prototype
npm install
npm run dev          # → http://localhost:5173
```

```bash
npm run build && npm run preview     # production build, if you prefer to demo from dist/
```

Node 18+. No other prerequisites — no database, no API keys, no services to start.

---

## Signing in

There is no real authentication. The login screen offers three paths:

1. **Pick an organisation, then a user.** Any password works, or leave it blank.
2. **Launch from the EHR** — simulates a SMART on FHIR launch. The EHR supplies the user, the
   patient and the encounter, so there is no tenant picker, and you land directly on that patient's case.
3. **Sign in as the platform operator** — the vendor, not a customer. Cross-tenant connector
   registry and connection health, and no clinical content anywhere. A different set of screens.
4. Once inside, the **account menu** (top right) switches user or organisation without signing out.
   That is the fastest way to demonstrate the role gates.

### The three tenants

Each is a separate tenant: its own connections, payer contracts, policy pack, case queue, agent
memory and users. Nothing crosses. Switching organisation changes every number on every screen.

| Tenant | Shape | EHR | Capability notes |
|---|---|---|---|
| **Springfield Health Partners** | Integrated delivery network | Epic | Every connector on. 4,820 determinations in agent memory, 86% first-pass. The reference tenant. |
| **Lakeside Specialty Care** | Multi-specialty physician group | athenahealth | Heavy medical-benefit drug volume. **Portal automation off.** 71% first-pass — specialty drugs pend more. |
| **Cascade Valley Spine Institute** | Single-specialty surgical group | Oracle Health | **Network exchange not connected.** One degraded source. 310 determinations, 58% first-pass. The hardest tenant to serve. |

Plus a fourth organisation that is not a tenant: **Relay Health AI — platform operations**, the
vendor itself. No patients, no cases, no payer contracts, no agent memory.

### The five roles

| Role | Can | Cannot |
|---|---|---|
| **Pre-auth coordinator** | Work the queue, approve a packet for submission | Sign an appeal |
| **Clinician** | Everything a coordinator can, plus answer clinical questionnaire items and sign appeals | Manage connections or tenant configuration |
| **Platform administrator** | Manage connections, policy packs, thresholds, users; read the full audit log | **Approve a submission** — separation of duties, deliberately |
| **Observer** | Read cases and the audit trail | Anything else |
| **Platform operator** (vendor) | Run the connector registry and read connection health across every tenant | **Open a case, a patient or any clinical content, in any tenant** — the role holds no `case.view` permission at all |

Permissions are enforced in the UI, visibly. A blocked action renders the button disabled with the
reason next to it naming the user and their role — the gate is shown, not hidden.

---

## Screen-by-screen demo script

About 20 minutes. The Live Demo is the only part you should never cut.

### 00 · Sign in — *1 min*
Start on the login screen and read the mock-authentication box aloud. Pick **Springfield Health
Partners**, sign in as **Kofi Mbeki (coordinator)**.

Say: *three organisations on one platform, and the gates you are about to see are role-based, not
decorative.*

### 01 · Overview — *2 min*
The amber box first: everything is fabricated, the outcome numbers are targets not measurements.
Then the tenant banner — you are signed into Springfield, as a coordinator, and here is what that
role can and cannot do.

Two points to land:
- **The problem starts before the delay.** Nobody could ask "does this even need prior auth?" in a
  machine-readable way until CRD.
- **Platform first, then workflows.** Scroll to the red/green comparison. The standalone agent demos
  in six weeks and does not compound.

### 02 · Architecture — *3 min*
Five bands. Point at band 03: **that is the platform, and none of it is specific to prior
authorization.** Band 02 is this workflow.

Click two components, no more — *Clinical data repository* ("this is why evidence gathering is a
query, not an integration project") and *Payer & clearinghouse connectors* ("three payer tiers, one
interface upward").

### 03 · Agents — *2 min*
Seven cards. Read the escalation line on two: *Clinical Evidence Agent* ("never silently substitutes
a weaker document") and *Denial & Appeal Agent* ("escalates: always"). Then the two boxes at the
bottom — two hard gates, neither governed by a confidence threshold.

### 04 · Process Flow — *2 min*
Time runs downward, four lanes. **Step 3** is the new part; **step 10** is the human gate and never
moves; **steps 14–15** are where the staff hours actually go. Click step 14 for the failure note.

### 05 · Customer Journey — *2 min*
Three tabs. Spend the time on the **coordinator**, then thirty seconds on the **patient** — the only
column where the benefit is clinical rather than operational.

### 06 · Live Demo — *7–8 min, the centrepiece*

**Run 1 — Dolores Vantree, MRI lumbar spine (approved).** ~2 min
Select the case, click *Run the agents*, let it play at 1×. Narrate the CRD card and C4 met on a
*negative finding*. At review, expand C1 to show the evidence quote and source reference; point at
the two blank questionnaire items — left visibly empty, never guessed.

**Now demonstrate the gate.** Before approving, open the account menu and become **Alma
Reyes-Whitfield (administrator)**. The Approve & Submit button is disabled, with the reason beside
it. Switch back to Kofi and approve. That is the "two hard gates" claim, clicked rather than asserted.

**Run 2 — infliximab (pended).** Switch organisation to **Lakeside Specialty Care**. Note the queue
is entirely different. Run at 2×. Stop on the red event: no TB screening exists anywhere. The gap is
flagged *before* submission; submit anyway, it pends for exactly that reason, then run the
more-info loop — the evidence agent widens to network exchange and finds a QuantiFERON at an
occupational health clinic nobody knew about.

**Run 3 — lumbar fusion (denied → appeal).** Switch to **Cascade Valley Spine Institute**, signed in
as Marta Nowicki, the scheduler. Run at 4×. Confidence 41%, the agent recommends *not* submitting,
the coordinator overrides to protect a booked surgical date, and it is denied. Click *Draft the
appeal*. Marta cannot sign it — become **Dr. Noor Abbasi** and sign. Read the C1 paragraph aloud,
where the agent concedes the criterion it cannot support.

Finish by expanding **Agent activity log**: *this is the audit trail, rendered.*

### 07 · Integrations — *1–2 min*
Scroll the table — rows disabled for the current tenant are marked. Stop at the three payer-tier
cards: the agents are identical across all three tiers; only the connector changes.

### 08 · Tenant & Access — *2 min*
The tenancy story in one screen: connections and their state, agent memory scoped to this tenant,
the permission matrix, and what does not cross. Use **Become** to switch role from the table.

### 09 · Platform Core — *4 min, the second centrepiece*
The answer to "what are we actually building?". Twelve components in three groups — the seven a
clinical data platform is made of, the three prior authorisation forces into the core, and the two
that must stay at the edge. Click **02 · Authorization & token service** ("most of the first month
goes here, and the hard part is registration, not code") and **05 · Clinical store** ("two layers:
the raw record you can show a regulator, and the derived one your product queries").

Then scroll to the two boxes at the bottom: the openEHR decision, and the honest caveat table —
*what people assume is hard* against *what is actually hard*.

### 10 · Build Plan — *2 min*
Forty weeks in two bands. Point at **P0**, drawn faded across the whole track because it never
exits: vendor registration is the critical path and no code shortens it. Then the build/adopt/buy
table — five rows marked *build* are the product, everything else is rented.

### 11 · Operator Console — *2 min, operator sign-in only*
Sign out and come back in as the platform operator. The navigation is different: there is no queue,
no patient, no case — not filtered, absent. Click **Open Springfield's case queue** and read the
blocked reason. Then the connector registry: the Raintree row is the commercial point — built for
one tenant, promoted to the registry, and the next customer who needs it pays nothing for the
original development.

---

## Deep links

The URL hash routes to any screen, and on the Live Demo to any **stage** of a scenario with the
activity log pre-played. A cross-tenant deep link is refused — the case is not reachable, not merely
hidden. So is a deep link to a case screen while signed in as the platform operator: `#ops` is
reachable only by that role, and `#demo/...` only by the others.

```
#overview  #arch  #agents  #flow  #journey  #demo  #integr  #tenant  #core  #plan  #ops

#demo/approved/review     packet review, clean case      (Springfield)
#demo/approved/result     approval + auth number         (Springfield)
#demo/pended/review       the case with an evidence gap  (Lakeside)
#demo/pended/result2      approved after the more-info loop (Lakeside)
#demo/denied/result       the denial                     (Cascade Valley)
#demo/denied/letter       the drafted appeal letter      (Cascade Valley)
```

---

## Project layout

```
preauth-prototype/
  src/
    main.jsx, App.jsx        routes, hash deep links, auth gate
    index.css                palette as CSS variables + Tailwind layers
    auth/
      AuthContext.jsx        mock session (localStorage), permission helper
      LoginScreen.jsx        tenant → user → sign in, plus SMART launch
    data/
      tenants.js             tenants, the vendor org, users, roles, permissions, case ownership
      *.json                 patients, payers, policies, evidence, cases,
                             agents, architecture, flow, journey, integrations,
                             scenarios (the scripted agent runs),
                             core (the twelve-component build sheet),
                             buildplan (phases, build/adopt/buy, risks),
                             ops (connector registry and connection health)
      index.js               lookups and tenant-scoped selectors
    components/              ui primitives, Shell, side Panel, ThemeToggle
    screens/                 the eleven screens — including PlatformCore, BuildPlan and Ops
    demo/
      engine.js              scripted playback: phases, speed, skip, deep-link jump
      Timeline.jsx           activity log + case facts rail
      ReviewPacket.jsx       criteria ↔ evidence, questionnaire, the approval gate
      Outcome.jsx            payer outcomes and the appeal letter
```

To change the story, edit `src/data/`. To change a scripted run, edit `scenarios.json`. Every screen
reads cases through `casesFor(tenantId)` rather than filtering a shared list, so tenant scoping is a
property of the data layer rather than something each screen has to remember.

---

## Mock data

| | |
|---|---|
| Tenants | 3, at different capability tiers, plus the vendor's own non-tenant org |
| Users | 12 across 5 roles |
| Platform components | 12, with a build/adopt/buy call and a phase on each |
| Connectors in the registry | 12 across EHR, payer, clearinghouse, network and document |
| Patients | 8 |
| Payers | 3, at deliberately different capability tiers |
| Policies | 3, with 4–5 structured medical-necessity criteria each |
| Clinical evidence | 20 items — notes, labs, imaging, medication history, negative-finding queries |
| Cases | 15 across 8 statuses, partitioned across the three tenants |
| Scripted events | 90 across the three scenarios (21s / 27s / 29s at 1×) |

---

## What this is not

No backend, no authentication, no persistence beyond `localStorage`, no network access. It does not
call an EHR, a payer, a terminology server or a model. Every "agent" is a scripted sequence of timed
events reading from local JSON, and every permission check is client-side — in production none of
these gates would be enforceable in the browser.

See `ARCHITECTURE.md` for the architecture proposal — the seam between the core and the workflow,
the twelve components, the three-tier tenancy model and the sequencing. `ONE-PAGER.md` has the
mocked-vs-real breakdown and `OPEN-QUESTIONS.md` what still has to be decided. The previous single-file version of this prototype is in git history at commit `45bb6a1`.
