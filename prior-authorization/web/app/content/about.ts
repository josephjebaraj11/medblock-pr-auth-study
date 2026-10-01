import type { IconName } from "~/content/icons";
import type { Stat } from "~/content/home";

export type Value = {
  icon: IconName;
  title: string;
  body: string;
};

export type OriginChapter = {
  label: string;
  title: string;
  body: string;
};

export const ABOUT_HERO = {
  eyebrow: "About Nexauth AI",
  title: "Care should not wait on a fax machine.",
  body: "We build software for the gap between a clinician deciding what a patient needs and a payer agreeing to cover it. That gap costs American medicine billions of dollars and an enormous amount of goodwill every year. We think it is an engineering problem.",
} as const;

export const ABOUT_STATS: readonly Stat[] = [
  { value: "39", label: "Authorization requests per physician each week" },
  { value: "13 hrs", label: "Weekly staff time spent on those requests" },
  { value: "93%", label: "Of physicians report authorization delays care" },
  { value: "78%", label: "Report patients abandoning treatment as a result" },
];

export const MISSION = {
  eyebrow: "Our mission",
  title: "Put the clinic's attention back on patients.",
  body: [
    "Prior authorization began as a check on unnecessary spending. It has become a volume business: tens of requests per physician per week, each one a form, a portal login, a hold queue and a follow-up nobody has time for.",
    "The cost is not only financial. Physicians name it among the leading contributors to burnout, and practices routinely watch patients walk away from treatment their clinician already judged necessary while an approval sits in limbo.",
    "We are not trying to abolish the process — that is a policy fight, and a slow one. We are trying to make it cost a clinic thirty seconds instead of thirty minutes, and to make sure a wrong answer gets challenged properly every single time.",
  ],
} as const;

export const CRISIS = {
  eyebrow: "The crisis in numbers",
  title: "What prior authorization actually costs.",
  description:
    "Figures drawn from the American Medical Association's 2024 physician survey and published payer and regulatory reporting.",
  items: [
    { value: "89%", label: "Say prior authorization contributes to burnout" },
    { value: "78%", label: "Report patients abandoning recommended treatment" },
    { value: "73M", label: "Americans had a claim denied in a single year" },
    { value: "71%", label: "Of insurers use AI in utilization management" },
    { value: "88%", label: "Say the process raises overall cost of care" },
    { value: "61%", label: "Are concerned insurer AI is increasing denials" },
  ] as const satisfies readonly Stat[],
} as const;

export const ARMS_RACE = {
  eyebrow: "The asymmetry",
  title: "One side automated. The other side did not.",
  description:
    "Utilization review has been machine-assisted for years. The response to it is still assembled by hand, under time pressure, by people who would rather be with patients. That imbalance is the whole problem.",
  columns: [
    {
      side: "How review works now",
      tone: "problem" as const,
      points: [
        "Requests screened against policy rules in seconds",
        "Denials issued at a scale no clinic can match",
        "Appeal windows short enough to run out quietly",
        "Criteria that change without a changelog",
      ],
    },
    {
      side: "How Nexauth AI responds",
      tone: "solution" as const,
      points: [
        "Requests assembled to match the policy before they are sent",
        "Denials answered within minutes, not weeks",
        "Deadlines tracked automatically, with alerts before they close",
        "Policy library maintained so your forms stay current",
      ],
    },
  ],
} as const;

export const ORIGIN: readonly OriginChapter[] = [
  {
    label: "The problem",
    title: "A queue nobody owned",
    body: "We started by sitting with practice staff and counting. The authorization queue was never anyone's actual job — it was absorbed between other work, which is exactly why it never got faster.",
  },
  {
    label: "The tipping point",
    title: "A denial found too late",
    body: "In one pilot clinic, a denial sat unread long enough that the appeal window closed. The therapy was approved eventually, months later. Nothing about that failure was clinical.",
  },
  {
    label: "The insight",
    title: "The bottleneck is reading, not deciding",
    body: "Almost all of the time goes into reading a chart, matching it to a policy, and restating both in a payer's format. Clinicians were never the slow part. Transcription was.",
  },
  {
    label: "The solution",
    title: "An agent that does the reading",
    body: "So we built one that reads the chart, matches the policy, drafts the request and the rebuttal, and hands a clinician something to check rather than something to write.",
  },
];

export const VALUES: readonly Value[] = [
  {
    icon: "heart-pulse",
    title: "Patients before paperwork",
    body: "Every decision gets measured against one question: does this get a patient treated sooner? If not, it is not a priority.",
  },
  {
    icon: "zap",
    title: "Speed is a clinical feature",
    body: "A delay is not an inconvenience, it is a health outcome. We treat latency in this workflow the way you would treat it in a monitor.",
  },
  {
    icon: "lock",
    title: "Privacy is not a tier",
    body: "Encryption, least-privilege access, audit logging and a signed BAA come with every plan. Security is not something you upgrade into.",
  },
  {
    icon: "file-search",
    title: "Show your sources",
    body: "Nothing the model asserts goes out unsourced. Every extracted fact and quoted guideline links back to where it came from.",
  },
  {
    icon: "users",
    title: "Built with clinics, not at them",
    body: "Our roadmap comes from the people working the queue. They are the ones who know which fields payers actually reject.",
  },
  {
    icon: "trending-up",
    title: "Measured, not asserted",
    body: "We report on your authorization volume, your approval rates and your recovered hours — not on a benchmark you cannot verify.",
  },
];

export const TEAM = {
  eyebrow: "Our team",
  title: "Clinicians and engineers, in the same room.",
  body: "Nexauth AI is built by people who have worked both sides of this problem — revenue cycle and utilization management on one hand, applied machine learning and health data infrastructure on the other. Nurses review what the model drafts. Engineers sit in on payer calls. That is deliberate: this product breaks the moment it is built by people who have never watched a practice manager fight a fax machine at 6pm.",
} as const;

export const SOURCES: readonly string[] = [
  "American Medical Association, 2024 Prior Authorization Physician Survey — burden, delay and treatment-abandonment figures.",
  "Published payer transparency and regulatory reporting on claim denial volume.",
  "Industry surveys of utilization management automation among commercial insurers.",
  "CMS interoperability and prior authorization final rule, on payer API requirements and decision timeframes.",
];
