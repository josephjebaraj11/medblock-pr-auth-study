import type { IconName } from "~/content/icons";

export type ContactDetail = {
  icon: IconName;
  label: string;
  value: string;
};

export const CONTACT_HERO = {
  eyebrow: "Get in touch",
  title: "Let's talk about your queue.",
  body: "Ready for a walkthrough, comparing vendors, or just want to know whether this works with your EHR — either way, a real person reads this.",
} as const;

export const CONTACT_DETAILS: readonly ContactDetail[] = [
  { icon: "mail", label: "Email", value: "hello@nexauth.ai" },
  { icon: "map-pin", label: "Where we are", value: "Boston, Massachusetts" },
  { icon: "clock", label: "Hours", value: "Monday–Friday, 8am–7pm ET" },
  { icon: "message-square", label: "Response time", value: "Within one business day" },
];

export const INTEREST_OPTIONS = [
  "Booking a demo",
  "Pricing and plans",
  "EHR integration questions",
  "Security or compliance review",
  "Partnerships",
  "Careers",
  "Something else",
] as const;

export const DEMO_EXPECTATIONS: readonly string[] = [
  "A 30-minute walkthrough against your own payer mix",
  "An honest answer on whether your EHR is a day-one or a month-one integration",
  "A pilot scope you can run with a handful of providers",
  "No sales sequence — one follow-up, then it is your move",
];
