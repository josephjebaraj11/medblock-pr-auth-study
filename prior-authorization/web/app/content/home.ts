import type { IconName } from "~/content/icons";

export type Stat = {
  value: string;
  label: string;
  detail?: string;
};

export type Problem = {
  icon: IconName;
  title: string;
  body: string;
  stat: string;
  statLabel: string;
};

export type Step = {
  number: string;
  title: string;
  duration: string;
  body: string;
  icon: IconName;
};

export type Feature = {
  icon: IconName;
  title: string;
  body: string;
  tag?: string;
  highlight?: boolean;
};

export type Integration = {
  name: string;
  category: string;
};

export type Testimonial = {
  quote: string;
  role: string;
  practice: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  cadence: string;
  summary: string;
  features: readonly string[];
  ctaLabel: string;
  featured?: boolean;
};

export type Faq = {
  question: string;
  answer: string;
};

export const HERO = {
  eyebrow: "AI for prior authorization",
  title: "Insurers have algorithms. Now you do too.",
  body: "Nexauth AI reads the chart, fills the payer form, submits it, watches for a decision, and writes the evidence-backed appeal when the answer comes back wrong. Your staff reviews and signs off — that's the job now.",
  primaryCta: "Request a Demo",
  secondaryCta: "See how it works",
  note: "No card required · Guided pilot · BAA signed before any PHI moves",
  stats: [
    { value: "30s", label: "Median time to a submitted request" },
    { value: "15+", label: "Staff hours returned each week" },
    { value: "95%", label: "Less hands-on time per authorization" },
  ] as const satisfies readonly Stat[],
  /** The illustrative request rendered in the hero's product card. */
  sample: {
    patient: "Patient #A-4471",
    medication: "Semaglutide 1 mg",
    payer: "Regional Health Plan",
    status: "Ready to submit",
    checks: [
      "Chart parsed — 14 pages",
      "Diagnosis + prior therapy matched to policy",
      "Form fields auto-filled and verified",
    ],
    elapsed: "00:27",
  },
} as const;

export const PROBLEM = {
  eyebrow: "The problem",
  title: "Prior authorization is quietly bankrupting the front desk.",
  description:
    "It is the most expensive clerical process in American medicine, and it is growing. Every hour spent chasing an approval is an hour nobody spends on a patient.",
  items: [
    {
      icon: "clipboard-list",
      title: "The paperwork tax",
      body: "Physicians and their staff lose the better part of two working days a week to authorization forms, payer portals, faxes and hold music — work that generates no clinical value and no revenue.",
      stat: "13 hrs",
      statLabel: "per physician, every week",
    },
    {
      icon: "bot",
      title: "Denials at machine speed",
      body: "Utilization management is increasingly automated on the payer side. Requests are screened and rejected in seconds, while the rebuttal is still assembled by a human being with a highlighter.",
      stat: "1 in 3",
      statLabel: "requests denied on first pass",
    },
    {
      icon: "heart-pulse",
      title: "Patients wait, then give up",
      body: "A delay of a few days sounds administrative until it is your therapy that stalls. Care gets postponed, conditions progress, and a meaningful share of patients abandon treatment entirely.",
      stat: "78%",
      statLabel: "of physicians see patients abandon care",
    },
  ] as const satisfies readonly Problem[],
  source:
    "Burden figures reflect the American Medical Association's 2024 prior authorization physician survey.",
} as const;

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: "Four steps. Half a minute.",
  description:
    "Nexauth AI works the way your staff already does — it just does the slow parts instantly and never forgets to follow up.",
  steps: [
    {
      number: "01",
      title: "Drop in the chart",
      duration: "~5 seconds",
      body: "Upload a referral packet, a clinical note or a scanned fax. Nexauth AI reads it the way a nurse would: diagnosis codes, prior therapies, lab values, dates and prescriber details, all extracted and structured.",
      icon: "upload",
    },
    {
      number: "02",
      title: "Let the agent fill the form",
      duration: "~10 seconds",
      body: "It selects the right payer form for the plan and drug or procedure, then completes every field against the current coverage policy — flagging the criteria you still need to satisfy rather than guessing.",
      icon: "sparkles",
    },
    {
      number: "03",
      title: "Review and send",
      duration: "~15 seconds",
      body: "Your team sees a clean, side-by-side summary with every value traced back to its source page. Approve it and Nexauth AI submits through the payer's portal, fax line or FHIR endpoint.",
      icon: "send",
    },
    {
      number: "04",
      title: "Track, then fight back",
      duration: "Continuous",
      body: "Status is polled automatically. If a request is denied, Nexauth AI drafts a citation-backed appeal addressing the stated reason within minutes — so nothing sits in a pile waiting for someone to notice.",
      icon: "refresh-cw",
    },
  ] as const satisfies readonly Step[],
} as const;

const FEATURE_ITEMS: readonly Feature[] = [
    {
      icon: "file-search",
      title: "Clinical document understanding",
      body: "Scanned faxes, handwritten notes and 40-page referral packets get parsed into structured clinical facts, each one linked back to the page it came from.",
      tag: "AI powered",
    },
    {
      icon: "clipboard-list",
      title: "Payer-aware form engine",
      body: "A maintained library of plan-specific forms and coverage criteria, so the request that leaves your office already matches what that payer asks for.",
    },
    {
      icon: "scale",
      title: "Evidence-backed appeals",
      body: "When a denial arrives, Nexauth AI retrieves the governing clinical guidance, quotes it accurately, and answers the payer's stated reason point by point.",
      tag: "Signature feature",
      highlight: true,
    },
    {
      icon: "radar",
      title: "Live status tracking",
      body: "Every open request in one queue, with automatic status checks, deadline countdowns and alerts before a timely-filing window closes.",
    },
    {
      icon: "bar-chart",
      title: "Denial intelligence",
      body: "See which payers deny what, which criteria trip you up most, and which appeal arguments actually overturn decisions across your book of business.",
    },
    {
      icon: "shield-check",
      title: "Built for PHI from day one",
      body: "Encryption in transit and at rest, least-privilege access, full audit logging, US-only data residency and a signed BAA before your first upload.",
    },
];

export const FEATURES = {
  eyebrow: "Capabilities",
  title: "Everything the approval actually requires.",
  description:
    "One workspace for the whole lifecycle — intake to decision to appeal — with an audit trail your compliance team can defend.",
  items: FEATURE_ITEMS,
} as const;

export const DIFFERENTIATOR = {
  eyebrow: "The difference",
  title: "Appeals that cite real guidelines — not generic language.",
  description:
    "Most appeal templates restate the request louder. Nexauth AI builds an argument: it finds the governing clinical guidance, quotes the passage that applies to this patient, and rebuts the specific reason the payer gave.",
  points: [
    "Retrieves current specialty-society guidance and labelling at the moment of drafting",
    "Quotes the recommendation verbatim, with the issuing body and publication year",
    "Answers the payer's stated denial reason directly, criterion by criterion",
    "Pulls the patient's documented history and failed prior therapies from the chart",
    "Formats as a signature-ready letter with prescriber, NPI and member identifiers",
    "Delivers a reviewable draft in under a minute, with every citation linked",
  ],
  sample: {
    title: "Draft appeal",
    subtitle: "Denial reason: step therapy not documented",
    retrieval: [
      { label: "Specialty society standard of care", year: "2025" },
      { label: "FDA-approved labelling", year: "current" },
      { label: "Plan medical policy", year: "rev. 2025" },
    ],
    excerpt:
      "The determination cites an absence of documented step therapy. The record establishes two prior agents trialled at therapeutic doses for 14 and 19 weeks respectively, both discontinued for documented intolerance — a sequence the plan's own policy accepts in lieu of the standard step requirement.",
    footnote: "Every quoted passage links to its source before you sign.",
  },
} as const;

export const METRICS = {
  eyebrow: "By the numbers",
  title: "The arithmetic is not subtle.",
  description:
    "What a single physician's authorization volume costs a practice today, and what changes when the busywork is automated.",
  items: [
    {
      value: "~2,000",
      label: "Authorization requests per physician each year",
      detail: "Roughly 39 every week, before appeals.",
    },
    {
      value: "15+",
      label: "Staff hours given back weekly",
      detail: "Redeployed to scheduling, intake and patient follow-up.",
    },
    {
      value: "$15K",
      label: "Annual administrative cost avoided per provider",
      detail: "Based on loaded staff time at typical practice rates.",
    },
    {
      value: "95%",
      label: "Reduction in hands-on minutes per request",
      detail: "From a half-hour of portal work to a 30-second review.",
    },
  ] as const satisfies readonly Stat[],
  source:
    "Volume and burden figures from the American Medical Association's 2024 prior authorization physician survey; savings modelled on practice staffing costs.",
} as const;

export const INTEGRATIONS = {
  eyebrow: "Integrations",
  title: "It meets your stack where it already is.",
  description:
    "Nexauth AI connects through the standards payers and EHRs actually use — and falls back to fax when a plan still insists on it.",
  items: [
    { name: "Epic", category: "EHR" },
    { name: "Oracle Health", category: "EHR" },
    { name: "athenahealth", category: "EHR" },
    { name: "eClinicalWorks", category: "EHR" },
    { name: "NextGen", category: "EHR" },
    { name: "Veradigm", category: "EHR" },
    { name: "HL7 FHIR R4", category: "Standard" },
    { name: "Da Vinci CRD / DTR / PAS", category: "Standard" },
    { name: "X12 278", category: "Standard" },
    { name: "NCPDP SCRIPT", category: "Standard" },
    { name: "CDS Hooks", category: "Standard" },
    { name: "Secure digital fax", category: "Fallback" },
  ] as const satisfies readonly Integration[],
  note: "Ready for the CMS interoperability and prior authorization API requirements as payers bring their endpoints online.",
} as const;

export const TESTIMONIALS = {
  eyebrow: "From the front desk",
  title: "What changes in the first month.",
  description:
    "Composite accounts from pilot practices, shared with permission and attributed by role.",
  items: [
    {
      quote:
        "We used to run a Thursday backlog session just for authorizations. That meeting no longer exists. The queue clears itself and my team only touches the ones that need judgment.",
      role: "Practice administrator",
      practice: "Four-site endocrinology group",
    },
    {
      quote:
        "The appeal drafts are the part I did not expect. They read like something a clinician wrote, they cite the actual guideline, and I can see where every sentence came from before I sign it.",
      role: "Lead nurse practitioner",
      practice: "Independent rheumatology practice",
    },
    {
      quote:
        "Nothing falls through any more. Deadlines are tracked, statuses update themselves, and I stopped finding two-week-old denials at the bottom of the fax tray.",
      role: "Revenue cycle manager",
      practice: "Regional multispecialty network",
    },
  ] as const satisfies readonly Testimonial[],
} as const;

const PRICING_PLANS: readonly PricingPlan[] = [
    {
      name: "Practice",
      price: "$249",
      cadence: "per provider / month",
      summary: "For independent practices that want the paperwork to stop.",
      features: [
        "Unlimited authorizations and appeals",
        "Document parsing and form auto-fill",
        "Status tracking with deadline alerts",
        "Secure digital fax submission",
        "Email support, next business day",
      ],
      ctaLabel: "Start a pilot",
    },
    {
      name: "Group",
      price: "$199",
      cadence: "per provider / month",
      summary: "For multi-site groups standardising across locations.",
      features: [
        "Everything in Practice",
        "EHR integration via FHIR or HL7",
        "Denial analytics across all sites",
        "Shared work queues and routing rules",
        "Named onboarding lead, priority support",
      ],
      ctaLabel: "Request a Demo",
      featured: true,
    },
    {
      name: "Health system",
      price: "Custom",
      cadence: "annual agreement",
      summary: "For systems with their own security review and payer contracts.",
      features: [
        "Everything in Group",
        "SSO, SCIM and custom role model",
        "Private deployment options",
        "Payer-specific policy tuning",
        "Quarterly business review and SLA",
      ],
      ctaLabel: "Talk to us",
    },
];

export const PRICING = {
  eyebrow: "Pricing",
  title: "Priced per provider. No per-request penalties.",
  description:
    "You should not pay more for working harder. Every plan includes unlimited authorizations, unlimited appeals and a signed BAA.",
  plans: PRICING_PLANS,
  note: "Illustrative list pricing. Pilots run for 30 days with no commitment.",
} as const;

export const FAQS: readonly Faq[] = [
  {
    question: "How is Nexauth AI priced?",
    answer:
      "Per provider, per month, with unlimited authorizations and appeals on every plan. There is no charge per request and no surcharge for appeals, because pricing that punishes volume punishes the practices that need help most. Pilots run 30 days with no commitment.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most practices send their first live request the same week. Fax-based submission and document upload work immediately after your BAA is signed. A full EHR integration typically takes two to four weeks depending on your vendor and IT review.",
  },
  {
    question: "How do you handle protected health information?",
    answer:
      "PHI is encrypted in transit and at rest, stored in US regions only, and reachable only by the roles you grant. Every access is logged, we sign a business associate agreement before any patient data moves, and your data is never used to train shared models.",
  },
  {
    question: "Does it work with our EHR?",
    answer:
      "Nexauth AI integrates with the major ambulatory and enterprise EHRs over HL7 FHIR and the Da Vinci implementation guides, and supports X12 278 and NCPDP for payers that require them. If your system is not on the list, document upload and secure fax work on day one while we scope the connection.",
  },
  {
    question: "Who is accountable for what the AI writes?",
    answer:
      "You are, and the product is built to respect that. Nothing is submitted without a human approving it. Every extracted value and every quoted guideline links to its source so a clinician can verify the draft in seconds rather than trusting it blindly.",
  },
  {
    question: "Can we try it before committing?",
    answer:
      "Yes. Pilots start with a subset of your providers and your real authorization volume, so you measure the difference on your own numbers rather than ours. No card is required to begin.",
  },
];

export const CTA = {
  title: "Give your staff their week back.",
  body: "See Nexauth AI run against your own authorization volume. Thirty minutes, your forms, your payers, your numbers.",
  primaryCta: "Request a Demo",
  secondaryCta: "Explore the platform",
  note: "No card required · Guided pilot · HIPAA-aligned from day one",
} as const;
