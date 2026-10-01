export type LegalSection = {
  id: string;
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type LegalDocument = {
  title: string;
  intro: string;
  updated: string;
  sections: readonly LegalSection[];
  disclaimer: string;
};

export const PRIVACY: LegalDocument = {
  title: "Privacy notice",
  updated: "24 September 2026",
  intro:
    "This notice explains what Nexauth AI collects through this website and our product, why we collect it, and the choices you have. Protected health information handled on behalf of a covered entity is governed separately by our business associate agreement.",
  sections: [
    {
      id: "what-we-collect",
      heading: "What we collect",
      paragraphs: [
        "We try to collect as little as the job requires, and we keep website data and clinical data strictly apart.",
      ],
      bullets: [
        "Information you give us: the name, work email, organisation, phone number and message you submit through our contact form.",
        "Product data: account identifiers, role assignments and audit records generated when your team uses Nexauth AI.",
        "Protected health information: only the clinical documents your practice uploads in order to prepare an authorization or appeal, handled under our business associate agreement.",
        "Technical data: aggregate, non-identifying information about how this website is used, to understand which pages are worth improving.",
      ],
    },
    {
      id: "how-we-use-it",
      heading: "How we use it",
      paragraphs: [
        "Contact details are used to reply to you and to arrange a demo, nothing else. We do not sell personal information, and we do not share it with advertisers or data brokers.",
        "Protected health information is used solely to perform the authorization and appeal services your practice has engaged us for, and for the limited purposes permitted by our agreement with you. It is never used to train models shared across customers.",
      ],
    },
    {
      id: "retention",
      heading: "How long we keep it",
      paragraphs: [
        "Enquiry records are retained for as long as we have an active conversation with you and for a reasonable period afterwards. Product and clinical data are retained for the term set out in your agreement, then deleted or returned at your direction.",
      ],
    },
    {
      id: "your-choices",
      heading: "Your choices",
      paragraphs: [
        "You can ask us what we hold about you, ask us to correct it, or ask us to delete it. Write to us and we will respond within the timeframe the applicable law requires. Where a request conflicts with a legal retention obligation, we will say so plainly rather than quietly refusing.",
      ],
    },
    {
      id: "terms",
      heading: "Terms of service",
      paragraphs: [
        "Use of this website is provided as-is for informational purposes. Product terms, service levels, liability and data handling commitments are set out in the written agreement between Nexauth AI and your organisation, which takes precedence over anything described on this site.",
        "Nothing on this website is a guarantee of a coverage outcome. Authorization and appeal decisions are made by payers, not by Nexauth AI.",
      ],
    },
    {
      id: "contact",
      heading: "Contacting us",
      paragraphs: [
        "Questions about this notice, or about how we handle data, can go to hello@nexauth.ai and will reach a person, not a queue.",
      ],
    },
  ],
  disclaimer:
    "This page describes our practices in plain language. It is a summary for website visitors and does not replace the contractual terms agreed with customers.",
};

export const HIPAA: LegalDocument = {
  title: "HIPAA & security",
  updated: "24 September 2026",
  intro:
    "Nexauth AI operates as a business associate to the practices and health systems it serves. This page summarises the safeguards we maintain and what we commit to contractually.",
  sections: [
    {
      id: "baa",
      heading: "Business associate agreement",
      paragraphs: [
        "We sign a business associate agreement with every customer before any protected health information is transmitted to us — on every plan, including trials and pilots. The agreement sets out permitted uses, breach notification obligations, subcontractor flow-down terms and our duties on termination.",
        "If your compliance team needs to review our standard terms before a pilot, ask and we will send them.",
      ],
    },
    {
      id: "safeguards",
      heading: "Technical safeguards",
      paragraphs: [
        "Our controls are mapped to the HIPAA Security Rule and reviewed on a regular cycle.",
      ],
      bullets: [
        "TLS 1.2 or higher for all data in transit, AES-256 for data at rest.",
        "Key management separated from application-level access.",
        "Role-based access scoped to the minimum necessary, with SSO and SCIM available on system plans.",
        "Immutable audit logging of every access to a patient record, exportable on request.",
        "Data processed and stored in United States regions only.",
        "Segregated environments, with no production PHI in development or testing systems.",
      ],
    },
    {
      id: "organisational",
      heading: "Organisational safeguards",
      paragraphs: [
        "Every employee completes HIPAA training on joining and annually thereafter. Access to production systems is granted on a need-to-know basis, reviewed quarterly, and revoked the day someone changes role or leaves. Subcontractors that could encounter PHI are themselves bound by business associate agreements.",
        "We maintain an incident response plan with defined breach assessment and notification timelines, and we test it.",
      ],
    },
    {
      id: "ai-governance",
      heading: "How we govern the AI",
      paragraphs: [
        "Customer clinical data is not used to train models shared with other customers. Model outputs are treated as drafts: a qualified person on your team reviews and approves every request and every appeal before it is transmitted to a payer.",
        "Extracted values and quoted guidance link back to their source so a reviewer can verify rather than trust. Where the system is uncertain, it says so and flags the field instead of guessing.",
      ],
    },
    {
      id: "certifications",
      heading: "Assurance and audits",
      paragraphs: [
        "We run a SOC 2 Type II programme covering security and availability, and we will share our current report and penetration testing summary under NDA as part of your vendor review.",
      ],
    },
  ],
  disclaimer:
    "This summary is provided for prospective customers evaluating Nexauth AI. It does not itself create contractual obligations; those live in your business associate agreement and master services agreement.",
};
