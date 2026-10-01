# Prior Authorization

Research and design documentation for applying Agentic AI to healthcare Prior Authorization (PA) workflows.

## Overview

Prior Authorization is a document-heavy, rule-driven process where providers must justify and request approval from payers before delivering certain treatments. This repository captures the problem statement, a proposed multi-agent architecture, market and vendor research, and a recommended solution for automating PA with AI agents.

## Contents

### Design proposal

- [docs/prior-authorization-study.md](docs/prior-authorization-study.md) — Problem statement, proposed agent architecture (Clinical, Coverage, Compliance, Decision, Submission, Follow-Up agents), technical layers (foundation models, RAG, tool calling, human-in-the-loop), expected business benefits, and a recommended solution grounded in industry best practices.

### Research reports

Five CTO-facing research reports in [docs/research/](docs/research/). Each is self-contained and ends with a Sources & Methodology section.

| Report | What it covers |
|---|---|
| [pa-tech-landscape.md](docs/research/pa-tech-landscape.md) | How vendors automate PA — Microsoft, Google, AWS, and n8n, plus Cohere Health, Availity, Epic, athenahealth, Infinitus, Notable Health, and the defunct Olive AI. Architectures, tech stacks, HIPAA handling, open-source repos, and known failures. |
| [pa-competitors.md](docs/research/pa-competitors.md) | Who is actually deploying PA automation — payers, PBMs, health systems, and startups — with published results, funding, and market position. Vendor claims are labeled separately from independently verified findings. |
| [pa-alternatives.md](docs/research/pa-alternatives.md) | Whether real alternatives to PA exist — gold-carding, value-based/risk-sharing care, real-time benefit checks, and CMS rule changes. Conclusion: the industry narrows and automates PA rather than replacing it. |
| [pa-integrations.md](docs/research/pa-integrations.md) | The integration layer — HL7 FHIR, the Da Vinci implementation guides (CRD, DTR, PAS, CDex), CDS Hooks, legacy X12 278 and NCPDP standards, the CMS-0057-F API mandate, and EHR vendor implementations. |
| [pa-best-solution.md](docs/research/pa-best-solution.md) | The recommended solution, synthesized from the four reports above — architecture, build-vs-buy guidance, phased rollout, HIPAA checklist, and failure modes to avoid. |

### Visual companions

Interactive HTML pages with flowcharts, architecture diagrams, and swimlane/sequence diagrams for each report, in [docs/research/html/](docs/research/html/). Open [index.html](docs/research/html/index.html) in a browser to browse them all.

| Page | Diagrams |
|---|---|
| [index.html](docs/research/html/index.html) | Landing page linking all five visual companions |
| [pa-tech-landscape.html](docs/research/html/pa-tech-landscape.html) | Workflow-stage coverage matrix, Microsoft's multi-agent architecture, AWS's Bedrock pipeline, the n8n cautionary flow, and a maturity/openness matrix |
| [pa-competitors.html](docs/research/html/pa-competitors.html) | Market ecosystem map, regulatory timeline, a real three-party FHIR swimlane, and the evidence-credibility tiers |
| [pa-alternatives.html](docs/research/html/pa-alternatives.html) | What each alternative actually achieves, the CMS-0057-F timeline, and a reach-vs-impact matrix |
| [pa-integrations.html](docs/research/html/pa-integrations.html) | EHR/clearinghouse/payer swimlane, the CRD → DTR → PAS → CDex flow, and medical vs. pharmacy PA pipelines |
| [pa-best-solution.html](docs/research/html/pa-best-solution.html) | Recommended end-to-end architecture, agent swimlane, rollout phases, and the two failure modes |

Diagrams are rendered with [Mermaid](https://mermaid.js.org/) (loaded from a CDN, so viewing requires an internet connection). Every diagram is click-to-enlarge, with zoom and pan in a modal — that behavior lives in the shared [diagrams.js](docs/research/html/diagrams.js).

## Repository structure

```
README.md
docs/
├── prior-authorization-study.md        # Problem statement + proposed architecture
└── research/
    ├── pa-tech-landscape.md            # Vendor landscape
    ├── pa-competitors.md               # Market deployments and results
    ├── pa-alternatives.md              # Alternatives to PA
    ├── pa-integrations.md              # FHIR / EHR / standards
    ├── pa-best-solution.md             # Recommended solution
    └── html/                           # Visual companions
        ├── index.html
        ├── pa-tech-landscape.html
        ├── pa-competitors.html
        ├── pa-alternatives.html
        ├── pa-integrations.html
        ├── pa-best-solution.html
        └── diagrams.js                 # Mermaid setup + enlarge/zoom modal
```

## Status

This is currently a documentation-only repository for research and planning. No implementation exists yet.

Research was conducted via live web sources; each report documents its own sources and methodology, and distinguishes vendor-reported claims from independently verified findings.
