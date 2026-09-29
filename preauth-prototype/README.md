# Agentic Prior Authorization — clickable prototype

A front-end-only, fully mocked prototype of an agentic prior-authorization workflow
running **on top of** a Medblocks-style clinical data platform. Built to explain the
vision in a review call, not to be deployed.

**Market:** US payers (Da Vinci CRD / DTR / PAS, X12 278, CMS-0057-F).
**Nothing here is real.** No network calls, no auth, no backend. Every patient,
payer, policy, authorization number and metric is fabricated.

---

## How to run

```bash
# open the file directly — that is the whole install step
xdg-open preauth-prototype/index.html      # linux
open preauth-prototype/index.html          # macOS
```

Or serve it, if you prefer a URL to share on a call:

```bash
cd preauth-prototype && python3 -m http.server 8000
# → http://localhost:8000
```

One self-contained HTML file. No `npm install`, no build, no CDN, no fonts fetched —
it works with the wifi off, which is the point on a screen-share.

### Controls

| | |
|---|---|
| Left nav | seven screens, in demo order |
| `THEME` button, bottom left | light / dark / follow system |
| `Esc` | closes the detail side panel |
| `1× 2× 4×` (Live Demo) | playback speed of the agent run |
| `SKIP` | jump to the end of the current phase |
| `RESET` | return the case to the queue |

### Deep links — worth knowing before you present

The URL hash jumps to any screen, and on the Live Demo to any **stage** of any
scenario with the activity log pre-played. Bookmark the ones you need in case the
room is short on time:

```
#overview  #arch  #agents  #flow  #journey  #demo  #integr

#demo/approved/review     packet review, clean case
#demo/approved/result     approval + auth number
#demo/pended/review       the case with a real evidence gap
#demo/pended/result       the pend, with the reason parsed into a task
#demo/pended/result2      approved after the more-info loop
#demo/denied/result       the denial
#demo/denied/letter       the drafted appeal letter
```

---

## Screen-by-screen demo script

Total: about 18 minutes at a comfortable pace. The Live Demo is the only part you
should never cut.

### 01 · Overview — *2 min*
Open on the amber box: everything is fabricated, the outcome numbers are targets not
measurements. Say it out loud once; it buys you credibility for the next fifteen minutes.

Then land two points:
- **The problem starts before the delay.** Nobody could ask "does this even need prior
  auth?" in a machine-readable way until CRD. It lived in a coordinator's head.
- **Platform first, then workflows.** Scroll to the red/green comparison. The standalone
  agent demos in six weeks and does not compound; the second workflow costs as much as
  the first. Prior auth is the right *first* workflow because it exercises nearly the
  whole platform.

### 02 · Architecture — *3 min*
Five bands. Point at band 03 and say: **that is the platform, and none of it is
specific to prior authorization.** Band 02 is this workflow.

Click **two** components, no more:
- *Clinical data repository* — "this is why evidence gathering is a query, not an
  integration project."
- *Payer & clearinghouse connectors* — "three payer tiers, one interface upward. When a
  legacy payer finally ships a PAS endpoint, nothing in the agent layer is touched."

Close on the note at the bottom: *could you delete the entire agent layer and still have
something a customer would pay for?*

### 03 · Agents — *2 min*
Seven cards. Do not read them all. Read the **escalation** line on two:
- *Clinical Evidence Agent* — "it never silently substitutes a weaker document."
- *Denial & Appeal Agent* — "escalates: always."

Then the two boxes at the bottom: there are two hard gates, and neither is governed by a
confidence threshold. Confidence decides how much arrives pre-filled — never whether a
person is involved.

### 04 · Process Flow — *2 min*
Time runs downward, four lanes. Three things to point at:
- **Step 3** is the new part. Everything below it merely got faster.
- **Step 10** is the human gate and it never moves.
- **Steps 14–15**, the more-info loop and the appeal, are where the staff hours actually go.

Click step 14 to show the failure note — the event bus is what makes the loop cheap,
because nobody has to remember to check a portal.

### 05 · Customer Journey — *2 min*
Three tabs. Spend your time on the **coordinator**, click through to the **patient** for
thirty seconds. The line to say on the patient tab: *this is the only column where the
benefit is clinical rather than operational, and the only one a regulator will ask about.*

### 06 · Live Demo — *6–7 min, the centrepiece*
A mock queue that looks like a real morning. Three cases carry the `DEMO` chip.

**Run 1 — Dolores Vantree, MRI lumbar spine (approved).** ~2 min
Click the case → *Run the agents*. Let the timeline play at 1×; it is readable at
speaking pace. Narrate two events as they land: the CRD card ("this is the question that
had no API"), and C4 met on a *negative finding* ("a negative is weaker evidence, so the
query itself is attached as proof of what was searched").
At the review screen: expand C1, show the evidence quote and the source reference.
Point at the two blank questionnaire items — *left visibly empty, never guessed.*
Click **Approve & Submit**. Approval, auth number, written back to the order.

**Run 2 — Aiden Okafor-Marsh, infliximab (pended).** ~2.5 min
Run at 2×. Stop on the red event: no TB screening exists anywhere in the connected
sources. At review the packet is 68% and the gap is flagged **before** anyone submits.
Submit anyway — the demo does this deliberately — and it pends for exactly the predicted
reason. Then click **Run the more-info loop**: the evidence agent widens to network
exchange and finds a QuantiFERON at an occupational health clinic nobody in the practice
knew about. Approved.
The line: *the document that decided this case was never in the ordering practice's EHR.*

**Run 3 — Rosalind Petrakis, lumbar fusion (denied → appeal).** ~2 min
Run at 4×. A legacy payer: no CRD, no PAS, browser automation and fax. Confidence 41%
and the agent **recommends not submitting**. The coordinator overrides to protect a
booked surgical date — and the recommendation, the override and its reason all land in
the audit log. Denied. Click **Draft the appeal**, then read one paragraph of the letter
aloud — ideally the C1 paragraph, where the agent *concedes* the criterion it cannot
support and argues the policy's exception clause instead.
The line: *a letter that overclaims is worse than one that concedes.*

Finish by expanding **Agent activity log** at the bottom: *this is the audit trail,
rendered. Same events, same order.*

### 07 · Integrations — *1–2 min*
Scroll the table, then stop at the three payer-tier cards at the bottom. The closing
argument: the agents are identical across all three tiers; only the connector changes.

---

## Mock data

| | |
|---|---|
| Patients | 8, with problems, medications, allergies, coverage |
| Payers | 3, at deliberately different capability tiers |
| Policies | 3, with 4–5 structured medical-necessity criteria each |
| Clinical evidence | 20 items — notes, labs, imaging, medication history, negative-finding queries |
| Cases | 11 across 8 statuses; 3 carry scripted agent runs |
| Scripted events | 90 across the three scenarios (21s / 27s / 29s at 1×) |

The three payer tiers are the most load-bearing piece of the mock data:

- **Meridian Health Plan** — full Da Vinci (CRD 2.2.1 + DTR + PAS + FHIR Subscription).
  The state CMS-0057-F describes. Auto-adjudicates clean packets.
- **Northstar Benefit Alliance** — CRD for discovery but no PAS endpoint. Submission
  falls back to X12 278 through a clearinghouse, with 277 polling.
- **Cascade Mutual Assurance** — no FHIR surface at all. Provider portal and fax. The
  tier the rule exists to remove, and the one you still have to support through 2027.

---

## Files

```
preauth-prototype/
  index.html          the whole prototype — data, views, demo engine
  README.md           this file
  ONE-PAGER.md        architecture summary · mocked vs. real
  OPEN-QUESTIONS.md   assumptions and open questions for the review
```

`index.html` is organised in four sections, in order: CSS · `DB` (all mock data) ·
view functions · demo engine and event handlers. To change the story, edit `DB`;
to change a scripted run, edit `DB.scenarios`.

---

## What this prototype is not

It has no backend, no authentication, no persistence and no network access. It does not
call an EHR, a payer, a terminology server or a model. Every "agent" is a scripted
sequence of timed events reading from local JSON. See `ONE-PAGER.md` for the line-by-line
mocked-vs-real breakdown, and `OPEN-QUESTIONS.md` for what still has to be decided.
