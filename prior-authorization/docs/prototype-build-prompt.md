# Prompt: research the study folder → clickable prototype + solution blueprint

Paste the prompt below into Claude (or another agent with file access) with the `medblock-pr-auth-study/` folder attached or connected. Edit the bracketed parts. The prompt is written so it can be re-run whenever the folder changes.

---

```text
You are a senior healthcare product architect and front-end engineer. Your job has three parts:
research the folder I've connected, build a clickable frontend-only prototype, and write a
comprehensive solution document explaining how we will build the real product.

## Context
- Folder: medblock-pr-auth-study/ (prior-authorization research, client discovery pack,
  architecture blueprints, an existing marketing site in prior-authorization/web/).
- Product: [ClearAuth AI] — an AI agent that obtains prior authorizations for physician
  practices, with [VICE] (unpaid-claim follow-up) as the second agent on the same platform.
- Audience for the outputs: [founders, the client practice, and the engineering team].

## Part 1 — Research and analyse (do this first, before designing anything)
1. List the whole folder recursively. Skip node_modules, .git, build output and vendored repos
   (e.g. docs/output-video-3/sources/), but note that they exist.
2. Read every document that carries requirements or decisions, converting as needed
   (PDF → text, DOCX → text, HTML → text, XLSX → sheets; render image-only PDFs and screenshots
   and look at them). At minimum: README, docs/*.md, docs/research/*.md, everything in the
   discovery folder (requirements, vision & scope, roadmap, walkthrough, onboarding costs,
   pricing models, Ideas/, Prior_Auth/ blueprints), the top-level study HTML pages, and
   prior-authorization/web/ (stack, tailwind tokens, brand).
3. Produce, for yourself, a synthesis with:
   - settled decisions (and which file each comes from),
   - contradictions between files (naming, pricing, tools, sequencing, numbers) with a
     recommended resolution for each,
   - personas, journeys, statuses, states, entities and integrations mentioned anywhere,
   - which statistics are vendor-reported or unverified.
   Cite file names. Do not invent client facts; mark assumptions as assumptions.

## Part 2 — Clickable frontend-only prototype
Build ONE self-contained HTML file (inline CSS + vanilla JS, no build step, no backend,
in-memory state only, synthetic data clearly labelled) that a non-technical stakeholder can click
through. Requirements:
- Multiple users: a "Signed in as" switcher for every persona found in Part 1 — at least
  Ordering physician, Operations staff, Clinical reviewer (licensed), Tenant admin,
  Platform operator (no PHI). Navigation, screens and allowed actions change with the role.
- A live simulation of the core flow: physician places an order and clicks GET AUTHORIZATION;
  the agent visibly moves the case through intake → eligibility → PA required? → packet →
  decision/confidence gate → submission waterfall (electronic → portal → voice → human) →
  outcome → EHR write-back. Seed patients so each branch is reachable: no auth required,
  clinical review, shadow-mode approval, portal failure → voice, payer pend → resupply,
  denial → appeal / peer-to-peer, expiring approval, inactive coverage, duplicate prevention.
- Case detail drawer: stage tracker, outcome banner (auth #, valid dates, reference), agent
  findings (facts and gaps only, never medical judgment), channel attempts, packet documents,
  call transcript, write-once activity timeline with reference numbers, role-gated actions.
- Admin: threshold slider, kill switch, per-payer trust ramp (Shadow → Supervised → Wider)
  that changes how new orders behave, versioned rule-change log, payer requirement matrix,
  connections with state + test/reconnect, users & roles, audit log, billing.
- Platform operator: tenants (no PHI), connector registry, onboarding with registry match.
- Blueprint pages inside the prototype: Architecture (layers), Data model (entities with
  fields, PHI/config/secret tags, and a button showing the live JSON the prototype uses),
  Case lifecycle (state machine + transition table), Roles & permissions matrix, Build plan.
- Notifications bell (role-scoped, no PHI in the text). Optional preview of [VICE].
- Design: reuse the tokens and fonts in prior-authorization/web/tailwind.config.ts; light and
  dark themes via CSS variables; works at 390px wide with no horizontal page scroll; status
  shown as pills; accessible focus states; no lorem ipsum.
- Before delivering, click through every role and every branch in a headless browser, fix
  console errors, and check phone width and dark mode.

## Part 3 — Comprehensive solution document (Markdown, renders on GitHub)
Write docs/[clearauth]-solution-blueprint.md covering, in this order:
1. One-page recommendation.
2. What the folder decided + contradictions table with resolutions (from Part 1).
3. Problem, goals, measurable pilot success criteria (baseline against the practice's own data).
4. MVP scope in/out.
5. Users and permission matrix (and how roles map to identity-provider scopes).
6. Key journeys (numbered, each reproducible in the prototype).
7. Functional requirements by module (numbered FR-x).
8. Architecture: logical diagram (Mermaid), design rules, request-path sequence diagram,
   deployment.
9. Data model: ER diagram (Mermaid), entity table with sensitivity, core PostgreSQL DDL with
   tenant isolation (RLS), idempotency, write-once audit, outbox; case state machine
   (Mermaid stateDiagram); FHIR resource mapping.
10. API and events: business API endpoint table, domain events (no PHI in payloads),
    a typed connector contract.
11. Agent design: roles/tools/limits, model choice and PHI boundary, an explainable confidence
    score, evaluation plan.
12. Integration plan by phase, with realistic difficulty and enrollment caveats.
13. Security, privacy, HIPAA checklist.
14. Technology stack and build/buy/open-source table.
15. Frontend: map each prototype screen to a production route and components; how to build
    against mocks (e.g. MSW) from the same API contract.
16. Delivery plan: phases with weeks, deliverables and exit criteria; team/PODs; a Sprint 0
    checklist.
17. Testing and acceptance criteria.
18. Risk register.
19. Decisions needed (owner + recommendation).
20. Appendices: how to demo the prototype, glossary, list of sources read.

## Rules
- The agent never makes medical-necessity decisions; every denial routes to a licensed human.
  Reflect this in the UI, data model and document.
- Electronic first, portal second, voice third, human last.
- Prefer the folder's own decisions; where you go beyond them, say so.
- Label vendor or unverified statistics as such.
- Deliver: the HTML prototype (and publish it as a shareable page if your environment
  supports it), the Markdown blueprint, and a short summary listing the contradictions
  and decisions that need an owner. Save outputs to:
  prior-authorization/prototype/ and prior-authorization/docs/.
```

---

**Tips**
- To focus the run, add one line under Context, e.g. "Only ClearAuth; skip VICE" or "Our launch EHR is athenahealth".
- To iterate on the prototype only, say: "Skip Part 3; update prototype/clearauth-prototype.html with …".
- When the discovery answers come in (the 25 questions), add them to the folder and re-run. The contradictions table and the decisions list will update.
