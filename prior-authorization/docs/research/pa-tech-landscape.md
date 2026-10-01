# How Vendors Are Automating Prior Authorization

*A CTO briefing on the current state of AI/automation tooling for healthcare Prior Authorization (PA).*

## What is Prior Authorization, and why does it matter to engineering teams?

**Prior Authorization (PA)** is the process where a healthcare provider (a doctor's office or hospital) has to ask a health insurance company (the "payer") for permission *before* delivering a treatment, test, or medication — or the payer may refuse to pay for it later. It is one of the most hated, most manual workflows in US healthcare: doctors report completing dozens of these per week, each one often taking hours of phone calls, faxes, and portal data entry. It is also a workflow with real patient-safety stakes — a delayed PA can mean a delayed surgery, denied medication, or a patient stuck in an emergency room waiting for a decision.

Because it is document-heavy, rules-heavy, and repetitive, PA has become one of the top target use cases for applying large language models (**LLMs** — AI models trained to read and generate natural language, like GPT or Claude) and **AI agents** (software that can autonomously chain together steps — read a document, call an API, make a decision — rather than following one fixed script) in healthcare. Every major cloud vendor, several well-funded health-tech startups, and even no-code automation tools now offer some flavor of "PA automation."

This document breaks down what each vendor is actually offering, what it's built from, how (or whether) it handles patient data privacy law, and how mature each option really is — separating vendor marketing claims from what a CTO should independently verify.

### The PA workflow, in five stages

Every solution in this document maps onto some subset of these stages:

1. **Intake** – A treatment/procedure request comes in (from a doctor's office, a fax, a form, an EHR order).
2. **Eligibility check** – Confirming the patient's insurance plan actually covers this, and that the plan is active (an **eligibility check** is basically "does this patient have valid insurance and does their plan cover this category of service").
3. **Clinical criteria matching** – Checking the specific treatment against the payer's medical necessity rules (**clinical criteria matching** means: does this specific case meet the payer's written rules for approving this drug/procedure — e.g., "this MRI is only approved if physical therapy was tried first").
4. **Submission** – Actually sending the structured request to the payer, through a portal, fax, EDI transaction, or API.
5. **Appeals** – If denied, gathering more evidence and re-submitting or escalating.

---

## Microsoft

**Product:** [Prior Authorization Multi-Agent Solution Accelerator](https://github.com/microsoft/Prior-Authorization-Multi-Agent-Solution-Accelerator) — a Microsoft Foundry "solution template" (a pre-built reference app you deploy into your own Azure account with one command). Announced via a Microsoft Tech Community blog post (April 2026).

**Workflow stages covered:** eligibility (indirectly, via provider/coverage checks) → clinical criteria matching → decision/recommendation. This is a **payer-side reviewer**, not a provider-side submission tool — it's built to help a health plan's utilization-management staff evaluate incoming PA requests faster, not to help a clinic submit them.

**Architecture (plain-language):**
- A **FastAPI** backend acts as a "dispatcher" that hands a PA case off to four separate AI agents, each running in its own container.
- **Compliance Agent** — checks the paperwork is complete (a 10-item checklist) and flags billing-code bundling issues.
- **Clinical Reviewer Agent** — reads the clinical notes, pulls out structured facts (diagnosis codes, etc.), and can search medical literature for supporting evidence.
- **Coverage Agent** — looks up the government coverage-policy database (CMS) and checks the provider's credentials, then maps the payer's coverage rules against the clinical evidence, scoring each rule as "met / not met / insufficient info."
- **Synthesis Agent** — combines all three other agents' findings through a "three-gate" rubric (Provider → Codes → Medical Necessity) and produces a final recommendation with a confidence score and a written justification.
- The four agents run **Compliance + Clinical in parallel**, then **Coverage**, then **Synthesis** sequentially — a mix of parallel and sequential **agent orchestration** (the pattern of coordinating multiple AI agents so they hand off work to each other correctly).
- A **Next.js** web front-end shows progress live to a human reviewer.

**Specific technologies:** Microsoft Foundry (Azure's platform for hosting and managing AI agents), the **Microsoft Agent Framework (MAF)** for orchestration, **Azure OpenAI GPT-5.4** as the underlying LLM, Azure Container Apps (to run each agent as its own containerized service), Azure Container Registry, Application Insights for monitoring, and five **MCP** healthcare-data servers (MCP = Model Context Protocol, a standard way for an AI agent to call external tools/data sources) exposing the NPI provider registry, ICD-10 diagnosis codes, CMS coverage policy, clinical trials data, and PubMed medical literature.

**Compliance/security:** Uses "keyless" authentication (Azure's `DefaultAzureCredential` — no API keys stored in code) and Azure managed identities scoped to minimal permissions. The README is explicit that **HIPAA compliance for production use requires the customer to have a signed Business Associate Agreement (BAA) with Microsoft** — the accelerator itself is not a compliance product, it's a starting point you must harden.

**Open source:** Yes — the full accelerator is open source on GitHub: [microsoft/Prior-Authorization-Multi-Agent-Solution-Accelerator](https://github.com/microsoft/Prior-Authorization-Multi-Agent-Solution-Accelerator). A related, separate Microsoft sample is [Azure-Samples/autoauth-solution-accelerator](https://github.com/Azure-Samples/autoauth-solution-accelerator), also for streamlining PA on Azure AI.

**Limitations/caveats (stated by Microsoft itself):** The README explicitly calls this a **"proof of concept," an "AI-assisted triage tool"** that requires human clinical review before any final decision — it "does not provide medical advice." The bundled coverage data only covers Medicare rules (LCDs/NCDs); commercial insurance plans are not included out of the box. Agent containers currently run as root due to a Foundry platform constraint. In Microsoft's own synthetic-data testing, the pipeline completed a review in under ~2–5 minutes — a vendor-reported number from demo data, not an independently verified production benchmark.

---

## Google Cloud

**Product:** [Claims Acceleration Suite](https://cloud.google.com/solutions/claims-acceleration-suite) (launched 2023, since folded into Google Cloud's broader healthcare/Gemini Enterprise offerings), built in partnership with **Myndshft** (PA workflow software) and **Pegasystems** (business process/workflow automation).

**Workflow stages covered:** intake (converting incoming faxes/documents into structured data) → eligibility and cost estimation → submission → status monitoring. Google's own materials frame this primarily as speeding up the **payer's and provider's exchange of paperwork**, not as an end-to-end clinical-decision engine.

**Architecture (plain-language):**
- **Document AI** — Google's OCR/document-understanding service — extracts text and fields from unstructured PA request documents (faxes, scanned forms, PDFs).
- **Claims Data Activator** — the piece that takes that extracted, messy data and turns it into clean, structured records that downstream systems (and staff) can act on.
- **Cloud Healthcare API** with a **FHIR store** — FHIR (Fast Healthcare Interoperability Resources) is the industry-standard data format for exchanging patient records; this is where structured patient/clinical data lives so it's shareable between systems.
- **Vertex AI / MedLM** — Google Cloud's general AI platform and its healthcare-tuned LLM family (**MedLM** is Google's medical-domain language model, and the suite has also been shown paired with **Gemini**), used for tasks like summarizing clinical notes or checking documentation against criteria.
- Partner software from **Myndshft** handles the actual PA submission workflow (checking missing information, calculating patient out-of-pocket cost, tracking status with payers), and **Pegasystems** contributes case-management/workflow orchestration on top.
- **Accenture's Solutions.AI for Processing** has also been named as an implementation/integration partner in some of Google's joint announcements.

**Compliance/security:** The **Cloud Healthcare API is a HIPAA-eligible ("covered") service** under Google Cloud's standard Business Associate Agreement (BAA) — but Google is clear in its own documentation that using a HIPAA-eligible service does **not** automatically make a customer's deployment HIPAA compliant: the customer must sign the BAA, restrict PHI to eligible services, and configure encryption (including customer-managed encryption keys), IAM access control, and audit logging themselves. This is a shared-responsibility model, the same pattern seen across all major clouds.

**Open source:** No open-source repo was found for the Claims Acceleration Suite itself — it is presented as a managed/partner solution rather than a downloadable reference architecture, which is a meaningful contrast to Microsoft's and AWS's GitHub-first approach.

**Limitations:** Public detail on the Claims Acceleration Suite's internal architecture is thinner than Microsoft's or AWS's — Google's own solution page for this product returned mostly marketing copy rather than deep technical documentation during this research, and independent verification of specific performance claims (e.g., time saved) was not found. Treat Google's claims here as **vendor marketing**, not independently benchmarked results, more so than the other two hyperscalers, where more technical detail was publicly available.

---

## AWS

AWS has published multiple, increasingly specific PA reference architectures rather than one single named product — reflecting AWS's general pattern of shipping composable services and reference code rather than an all-in-one packaged PA product.

**1. [Prior authorization with AI agents (Bedrock AgentCore)](https://aws.amazon.com/blogs/industries/transform-healthcare-prior-authorization-with-ai-agents/)**

- **Workflow stages covered:** the full pipeline — order detection → eligibility verification → clinical documentation assembly → payer-specific form submission → status monitoring.
- **Architecture:** **AWS HealthLake** (a managed FHIR-compliant data store for structured patient records) holds clinical data; **Amazon S3** stores unstructured documents (scanned notes, images) with automatic classification; **AWS HealthScribe** transcribes patient-clinician conversations into clinical notes; **Amazon Connect/Lex** (contact-center and conversational-AI services) can trigger the PA workflow from a scheduling call; **Amazon Bedrock AgentCore** (AWS's managed runtime for hosting and orchestrating AI agents) coordinates four specialized agents: an **Orchestrator** (detects that a PA is needed), an **Eligibility Verification agent**, a **Document Processing agent**, and a **Prior Authorization agent** that fills out and submits the actual payer forms — through electronic or, where required, manual channels.
- **Claimed result:** AWS states this pipeline can complete authorization "in under 10 minutes" — a **vendor claim** dependent on payer-side integration quality, not an independently verified figure.
- **Open source:** [aws-samples/aws-priorauthorization-fhir-api](https://github.com/aws-samples/aws-priorauthorization-fhir-api) — a sample FHIR validation API deployed with AWS SAM, Cognito (auth), and CloudFormation.

**2. [Prior authorization using Strands Agents](https://aws.amazon.com/blogs/industries/prior-authorization-for-medical-claims-using-strands-agents/)**

- **Strands Agents** is AWS's own **open-source SDK for building AI agents** (three building blocks: pick a model, define tools the agent can call, write a system prompt describing its job — then the SDK runs a loop where the agent plans, calls tools, and iterates until done).
- **Workflow stages covered:** document retrieval → CPT procedure-code validation → coverage determination against payer guidelines → patient cost calculation → denial-reason analysis to support appeals.
- **Specific models used:** **Anthropic Claude 3.5 Sonnet** (via Amazon Bedrock) and Meta's Llama models, selectable through Bedrock.
- **Architecture:** ingests **FHIR bundles** (structured patient/encounter data), fetches current billing guidance (the published example uses Washington State Medicaid rules as its single demo source of truth), checks CPT codes against those rules, and generates an approval decision plus rationale, running on **AWS Lambda** (serverless compute).
- **Open source:** part of the [amazon-bedrock-agents-healthcare-lifesciences](https://github.com/aws-samples) sample family, with a `run_prior_auth.py` orchestration script and sample FHIR data bundles.
- **Stated limitation:** AWS itself notes the guideline-fetching approach is tied to a single payer source in the demo, and that "how the agent accesses guidance documents will vary case-by-case" for other payers — i.e., this is a **pattern to adapt**, not a plug-and-play multi-payer product.

**3. [Architecting HIPAA-compliant AI agents on AWS](https://aws.amazon.com/blogs/publicsector/architecting-hipaa-compliant-ai-agents-to-safeguard-health-data-with-aws/)** — AWS's most detailed public writing on securing an agentic PA-like workflow.

- Organizes security into **four trust zones**: the customer-facing app, an API boundary (auth + input/output filtering), the agent platform itself (Bedrock + AgentCore hosting the models/tools/memory), and an observability/audit layer.
- Concrete controls named: **Bedrock AgentCore Gateway with Cedar policies** (a policy language restricting exactly which tools/data an agent can touch, enforced at the tool, field, and record level), multi-factor authentication before any PHI access, **customer-managed AWS KMS encryption** for agent "memory" with automatic 30-day expiry, **VPC endpoints/AWS PrivateLink** so PHI traffic never touches the public internet, **Amazon S3 Object Lock** for tamper-proof 6-year audit log retention (matching HIPAA's audit trail expectations), a three-layer input/output content filter (**AWS WAF**, **Amazon Comprehend** NLP, and **Amazon Bedrock Guardrails**), and **Amazon Macie** scanning to keep stray PHI out of the AI's knowledge base.
- Critically, it documents an explicit **human-in-the-loop gate**: in the walked-through example, a caseworker provides patient/procedure details, the agent gathers eligibility and history data (only returning minimum-necessary fields), and the agent's *proposed* authorization decision **pauses for explicit human approval before it executes** — AWS frames this as closing the gap between what an agent is technically permitted to *access* versus what it should be allowed to *decide*.

**Overall AWS assessment:** This is the most security/compliance-detailed public material among the three hyperscalers, but all three AWS pieces are **reference architectures and open-source samples**, not shipped, supported products — a distinction worth keeping in mind when evaluating "AWS's PA solution" versus "a named product you can buy."

---

## n8n (no-code/low-code workflow automation)

**n8n** is a general-purpose, open-source workflow-automation tool (similar in spirit to Zapier, but self-hostable) — not a healthcare product. It's included here because it has become a popular way for smaller clinics and consultants to *build their own* PA automations, cheaply and quickly, and that comes with real risk.

**What the workflow does (from an example template inspected on GitHub):** a Gmail trigger watches for incoming "Prior Authorization" emails, pulls the attachment, runs it through an AI-powered PDF-extraction node ("PDF Vector Extract," using an LLM in "smart" mode against a defined data schema) to pull out patient info, insurance details, and procedure/diagnosis codes. It then branches on an "Emergency Triage" step: emergency cases go down a **fast-track auto-approval path**, while standard cases go through fuller validation (coverage check, cost thresholds, documentation completeness). Decisions are logged to Google Sheets and posted to Slack, with a "Requires Review?" branch routing uncertain cases to a human via Slack.

**Workflow stages covered:** intake, a rules-based/LLM-based eligibility and documentation check, and a basic clinical-criteria-style validation — assembled from generic no-code building blocks rather than a healthcare-purpose-built engine.

**Compliance/security:** n8n itself has **no built-in HIPAA certification**. Community and vendor guidance is consistent: n8n can be part of a HIPAA-aligned setup **only** if self-hosted with strong controls (private network isolation, role-based access, MFA, encryption, minimal data retention, audit logging) **and** if every third-party service the workflow touches (Gmail, Slack, Google Sheets, the LLM API, etc.) also has its own signed BAA — which most default consumer integrations (like a personal Gmail account) do not have. As of 2026, n8n's own hosted Cloud offering does not support PHI workflows because it has no BAA available for that tier; only self-hosted or Enterprise-BAA setups are viable for real patient data.

**The cautionary case study:** A post in the "AI Automation Society" Skool community, titled *"Prior authorization n8n template that delayed emergency patient care,"* describes a medical group handling roughly 150 PA requests per month (each normally taking 2–3 hours of manual staff work) that built an n8n automation using a Gmail trigger and AI-based document extraction to pull patient, insurance, and procedure/diagnosis information automatically.

**Important honesty note:** the full post is behind Skool's login wall, and repeated attempts (direct fetch and multiple targeted web searches) could not retrieve the specific narrative of what went wrong, why the emergency case was delayed, or what the community concluded as the root cause and fix. **No further detail could be independently verified — this section should not be treated as a full incident report, only as a title and partial setup description that a no-code PA automation was linked, by its own author's account, to a real emergency-care delay.** The one substantive, verifiable lesson from what *is* visible: this is exactly the class of failure mode a CTO should expect from stitching together generic consumer-facing tools (personal Gmail, Slack, spreadsheet logging) with an emergency-triage branch and no described clinical safety review, human-in-the-loop gate, or compliance hardening — in sharp contrast to AWS's explicit human-approval-before-execution pattern above.

**Open source:** n8n itself is open source ([n8n-io/n8n](https://github.com/n8n-io/n8n)). The specific PA template inspected is published at [khanhduyvt0101/workflows – insurance-pre-authorization.json](https://github.com/khanhduyvt0101/workflows/blob/main/n8n-workflows/insurance-pre-authorization.json), a community-authored (not vendor-authored, not clinically validated) JSON workflow definition.

---

## Other notable vendors/platforms

| Vendor | What it does | Notes |
|---|---|---|
| **Cohere Health** | A payer-facing "clinical intelligence" platform (**Cohere Unify**) covering utilization management, prior auth, payment integrity, and appeals from one connected system. Recently integrated with **Microsoft Dragon Copilot** for "ambient" PA — capturing PA needs directly from the clinician's dictated visit note. | Vendor claims **85% of PAs approved in real time**. Cohere states explicitly that **AI never denies care** — only a human clinical reviewer can issue a denial, a deliberate human-in-the-loop design choice. This is a **shipped, productized SaaS platform** used by real health plans, a materially different maturity level than the cloud reference architectures above. |
| **Availity** (AuthAI) | A payer-connectivity platform (already the transaction "clearinghouse" connecting 170+ insurance plans) offering **AuthAI**, which returns authorization *recommendations* in under 90 seconds. | Explicitly positioned as a **recommendation engine, not a decisioning engine** — it does not auto-approve or auto-deny. Built toward compliance with the **CMS-0057 federal rule** requiring electronic prior authorization support by January 2027. Vendor-reported: 80% of requests processed via its Intelligent Utilization Management product are "touchless." |
| **Rialtic** (merging with Exponential AI) | A "payment accuracy" platform for payers, working across pre-pay editing, prior authorization, and post-pay audit on top of a payer's existing claims systems. Announced a 2026 merger with Exponential AI, combining Rialtic's editing platform with Exponential's real-time decision-agent product ("Enso"). | Describes itself as "governance-native" — pairing AI agents with mandatory human supervision. A payer-side infrastructure product, not provider-facing. |
| **Infinitus Systems** | Voice AI agents that make the actual **phone calls** to insurance companies to follow up on PA status, benefit verification, and claims — navigating phone menus and hold queues, then writing structured results back to the provider's system. | Distinct niche: automating the phone channel specifically, which is still how a large share of real-world PA follow-up happens. Vendor-reported 98% call success rate; used by a large share of major health systems and pharma companies per vendor claims. |
| **Notable Health** | An AI automation platform for healthcare back-office work generally, with a specific **Authorizations** product: scans work queues, checks payer portals for requirements, extracts data from the EHR, and submits the request. | Vendor-reported: 91% of submitted PAs succeed, ~15 minutes saved per successful submission; one cited hospital system saw a 55% cut in authorization-related billing write-offs. |
| **Epic** (EHR vendor) | Building real-time PA checks directly into its EHR workflows via **Coverage Requirements Discovery (CRD)**, an industry-standard API, live with insurers including UnitedHealthcare, Aetna, and Network Health at several health systems, with 16 more payers in testing. Leverages Epic's **Cosmos** research dataset (hundreds of millions of patient records) for broader AI features. | Notable because Epic sits at the EHR layer that most other vendors have to integrate *with* — its native, in-workflow approach is architecturally different from a bolt-on agent platform. AI is described as an emerging "operating layer" around this integration, not yet the core of the PA product itself. |
| **athenahealth** (with partner **Develop Health**) | Native **Authorization Management**/"Express Authorizations" in athenaOne, plus a 2026 point-of-care integration with Develop Health for end-to-end automated eligibility + PA. | Vendor-reported: 45% reduction in time spent on PA, ~650 staff hours/month saved at one organization, 70% of PAs auto-approved through the network, 35% fewer claim holds. |
| **Olive AI** (cautionary tale — defunct) | Was a well-funded ($900M+ raised) healthcare "robotic process automation" (RPA) company that included prior-authorization automation among its offerings, before shutting down in October 2023. | Widely reported reasons: over-promised AI capability that was in practice closer to shallow RPA scripting without deep workflow integration; attempting to learn payer rules "by brute force" from approval/denial outcomes proved not to generalize reliably; poor customer support and unfocused, capital-fueled growth outran real product-market fit. **A second cautionary tale**, at the opposite end from the n8n case: this one is about an well-capitalized, venture-backed vendor over-claiming AI sophistication rather than an under-engineered no-code template — both failure modes are worth guarding against. |

---

## Synthesis

### Common patterns across vendors
- **Agent orchestration + LLM + a rules/criteria engine, everywhere.** Every serious solution (Microsoft, AWS, Cohere, Rialtic) is built the same way underneath: one or more LLM-driven "agents" handle unstructured reasoning (reading notes, drafting justifications), wrapped around a much more rigid rules/lookup layer (CMS coverage policy, payer-specific criteria, CPT/ICD code tables) that the LLM is not trusted to know from memory alone.
- **FHIR is the common data language.** Microsoft, Google, and AWS all lean on FHIR-formatted patient data as the interoperability layer connecting EHRs to their AI pipelines.
- **HIPAA is a shared-responsibility story everywhere.** All three hyperscalers say essentially the same thing: our platform *can* be HIPAA compliant, but only after the customer signs a BAA and correctly configures encryption, access control, and audit logging — the cloud does not make an application compliant by itself.
- **Human-in-the-loop is treated as necessary, not optional, by the credible players.** Microsoft's accelerator, AWS's HIPAA architecture, Cohere Health, and Availity all explicitly build in a human approval/review gate before a final decision — several vendors state outright that AI should never be the one to *deny* care.

### Key differences
- **Reference architecture/template vs. productized SaaS.** Microsoft's and AWS's offerings are open-source accelerators and blog-post architectures you deploy and operate yourself — closer to "here's how you'd build this" than "here's a product you buy." Cohere Health, Availity, Notable Health, and athenahealth are shipped, supported SaaS products already used by real payers/providers. Google's Claims Acceleration Suite sits in between — a named, partnered offering, but with much less public technical depth than Microsoft's or AWS's material.
- **Cloud lock-in varies.** Microsoft's and AWS's accelerators are tied tightly to their respective clouds' agent-hosting services (Foundry/Container Apps vs. Bedrock AgentCore). n8n, by contrast, is cloud-agnostic and self-hostable — but that flexibility is exactly what let the Skool case study's team assemble a fragile automation without any platform-level compliance guardrails.
- **Where in the workflow each vendor focuses** differs meaningfully: Infinitus focuses narrowly on the phone-call channel; Epic focuses on in-EHR, real-time coverage checks at order time; Rialtic/Availity focus on the payer's claims-accuracy side; Cohere and Notable aim at the full intake-to-decision pipeline.
- **Level of human-in-the-loop enforcement** ranges from architecturally mandatory (AWS's documented approval gate, Cohere's "AI never denies") to essentially undocumented (the n8n community template's "fast-track auto-approval" path for emergencies, which had no described human check before the reported incident).

### Relative maturity

| Vendor / Platform | PA stage(s) covered | Core tech | HIPAA handling | Maturity | Open source? |
|---|---|---|---|---|---|
| **Microsoft** (PA Multi-Agent Accelerator) | Clinical criteria matching, decision recommendation (payer side) | Azure OpenAI GPT-5.4, Microsoft Agent Framework, Foundry Hosted Agents, MCP data servers | Keyless auth, managed identity; explicit "customer needs a BAA for production" disclaimer | Reference architecture / proof-of-concept (vendor's own words) | Yes — full GitHub repo |
| **Google Cloud** (Claims Acceleration Suite) | Intake, eligibility, submission, status tracking | Document AI, Claims Data Activator, Healthcare API/FHIR store, Vertex AI/MedLM/Gemini, partners Myndshft & Pegasystems | Healthcare API is BAA-eligible; customer must configure CMEK/IAM/audit logs | Named commercial offering, but thin public technical detail; partner-dependent | No public repo found |
| **AWS** (3 blog architectures + Strands Agents) | Full pipeline across the 3 posts: intake → eligibility → clinical matching → submission → appeals-support | Bedrock AgentCore, Strands Agents SDK, Claude 3.5 Sonnet/Llama via Bedrock, HealthLake, HealthScribe, Lambda | Most detailed public HIPAA architecture of the three clouds: Cedar policies, KMS, PrivateLink, Object Lock, Guardrails, human-approval gate | Reference architectures + open-source samples, not a shipped product | Yes — multiple GitHub sample repos |
| **n8n** (community PA template) | Intake, basic eligibility/documentation checks, emergency triage routing | Generic no-code workflow engine + a generic "smart" LLM extraction node + Gmail/Slack/Sheets | No built-in HIPAA support; compliance possible only via self-hosting + BAAs on every connected service, easy to get wrong | **Risky / unvetted** — a community-shared template, not a validated clinical product; tied to a reported real-world care-delay incident (details unverified) | Yes — workflow JSON on GitHub, template author is a private individual |
| **Cohere Health** | Intake through decision + appeals (full pipeline) | Proprietary "Cohere Unify" platform; integrates with Microsoft Dragon Copilot for ambient capture | Not independently detailed here, but positions itself as enterprise health-plan software with human-only denial authority | Production-grade, in-market SaaS used by health plans | No |
| **Availity (AuthAI)** | Eligibility through submission, recommendation only | Proprietary "analytical AI" (rules-based/transparent, not described as generative-LLM-based) | Not independently detailed here | Production-grade, in-market, building toward CMS-0057 regulatory deadline | No |
| **Infinitus** | Eligibility/status follow-up via live phone calls | Proprietary voice AI agents | Not independently detailed here | Production-grade, in-market at scale (vendor claims major health-system usage) | No |
| **Notable Health** | Intake through submission | Proprietary automation/AI platform | Not independently detailed here | Production-grade, in-market | No |
| **Epic** | Eligibility/coverage check at order time (in-EHR) | Coverage Requirements Discovery (CRD) API; Cosmos dataset for broader AI | EHR vendor with its own long-standing compliance program (not detailed here) | Production-grade, live at multiple health systems | No |
| **Olive AI** | Was intake through submission (RPA-based) | Robotic process automation, not confirmed to be deep AI | N/A — company is defunct | **Failed** — shut down Oct 2023; cautionary tale about overclaiming AI sophistication | N/A |

---

## Sources & Methodology

**Sources fetched or searched directly:**
- [Microsoft: Automate Prior Authorization with AI Agents — Foundry Template (Tech Community blog)](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/automate-prior-authorization-with-ai-agents---now-available-as-a-foundry-templat/4513432)
- [Microsoft GitHub repo: Prior-Authorization-Multi-Agent-Solution-Accelerator](https://github.com/microsoft/Prior-Authorization-Multi-Agent-Solution-Accelerator)
- [Google Cloud: Claims Acceleration Suite](https://cloud.google.com/solutions/claims-acceleration-suite)
- [AWS: Transform healthcare prior authorization with AI agents](https://aws.amazon.com/blogs/industries/transform-healthcare-prior-authorization-with-ai-agents/)
- [AWS: Prior authorization for medical claims using Strands Agents](https://aws.amazon.com/blogs/industries/prior-authorization-for-medical-claims-using-strands-agents/)
- [AWS: Architecting HIPAA-compliant AI agents to safeguard health data with AWS](https://aws.amazon.com/blogs/publicsector/architecting-hipaa-compliant-ai-agents-to-safeguard-health-data-with-aws/)
- [AWS sample repo: aws-priorauthorization-fhir-api](https://github.com/aws-samples/aws-priorauthorization-fhir-api)
- [n8n workflow template JSON: insurance-pre-authorization.json (khanhduyvt0101/workflows)](https://github.com/khanhduyvt0101/workflows/blob/main/n8n-workflows/insurance-pre-authorization.json)
- [Skool "AI Automation Society" post: "Prior authorization n8n template that delayed emergency patient care"](https://www.skool.com/ai-automation-society/prior-authorization-n8n-template-that-delayed-emergency-patient-care-2) (partially accessible only — see note below)
- [Cohere Health — Solutions for Providers](https://www.coherehealth.com/solutions/providers) and [Cohere Health / Microsoft Dragon Copilot announcement](https://www.coherehealth.com/news/ai-powered-ambient-prior-authorization-provider-experience)
- [Rialtic and Exponential AI merger announcement](https://www.rialtic.io/press/rialtic-and-exponential)
- [Availity: AI-Powered Prior Authorization](https://www.availity.com/intelligentum/)
- [Infinitus: Prior authorization follow-up automation](https://www.infinitus.ai/solutions/prior-authorization/)
- [Notable Health: Prior Authorization Automation](https://www.notablehealth.com/solutions/intelligent-authorizations)
- [Epic Payer Platform coverage — Fierce Healthcare / Modern Healthcare / Digital Health News reporting](https://www.fiercehealthcare.com/health-tech/epic-expands-ai-ambitions-agent-platform-cosmos-powered-predictions-and-deeper-workflow)
- [athenahealth Authorization Management / Develop Health integration coverage](https://www.develophealth.ai/blog/prior-authorization-athenahealth)
- Olive AI shutdown coverage (Dataconomy, Medium/independent analysis, Sunset, Startup Obituary)
- [Google Cloud Healthcare API HIPAA/BAA guidance (accountablehq.com)](https://www.accountablehq.com/post/is-google-health-api-hipaa-compliant-baa-pha-and-security-explained) and [n8n HIPAA compliance guidance (accountablehq.com, hipaavault.com)](https://www.accountablehq.com/post/is-n8n-hipaa-compliant-baa-self-hosting-best-practices)

**Methodology:** Vendor architecture, technology, and workflow-coverage claims in this document are drawn directly from official vendor blog posts, GitHub repositories, and cloud documentation (fetched or searched as listed above) — not from memory or assumption. Where a claim is a specific number (e.g., "under 10 minutes," "85% approved in real time," "98% call success"), it is explicitly flagged as a **vendor-reported claim**, since none of these performance figures could be independently reproduced or verified as part of this research. Maturity ratings ("proof-of-concept" vs. "reference architecture" vs. "production-grade SaaS") are this document's own synthesis, based on concrete signals: whether the vendor ships a supported, purchasable product versus a self-deployed open-source template or a single blog-post walkthrough, and whether the vendor's own documentation uses hedging language like "proof of concept" or "accelerator." The **n8n Skool incident** is reported here based only on the title and the small visible excerpt of that community post — the full post sits behind a login wall, and repeated direct-fetch attempts and multiple targeted web searches could not surface further independently accessible detail (no news coverage, repost, or discussion thread with the full narrative was found). Accordingly, this document does **not** claim to know the specific cause, severity, or resolution of that incident, and it should be read as a title-level cautionary signal about unvetted no-code deployment in clinical workflows — not a verified incident report.
