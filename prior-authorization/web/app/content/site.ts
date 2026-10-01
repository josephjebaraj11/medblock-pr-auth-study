import type { IconName } from "~/content/icons";

export type NavLink = {
  label: string;
  to: string;
};

export type FooterColumn = {
  title: string;
  links: readonly NavLink[];
};

export const SITE = {
  name: "Nexauth AI",
  tagline: "The shortest path to yes.",
  description:
    "Nexauth AI turns prior authorization from a week of paperwork into a 30-second workflow — drafting, submitting, tracking and appealing on your behalf.",
  url: "https://nexauth.ai",
  email: "hello@nexauth.ai",
  phone: "(888) 555-0142",
  location: "Boston, Massachusetts",
  hours: "Monday–Friday, 8am–7pm ET",
  responseTime: "We reply to every message within one business day.",
  demoCta: "Request a Demo",
  /** Only list profiles that actually exist — a dead `sameAs` is worse than none. */
  sameAs: [] as readonly string[],
  address: {
    locality: "Boston",
    region: "MA",
    country: "US",
  },
  /** 1200x630, referenced by Open Graph and Twitter cards. */
  ogImage: "/og-image.png",
} as const;

/**
 * Every indexable URL, in one place. The sitemap route generates from this, so
 * it cannot drift from the routes that actually exist.
 */
export type SitemapEntry = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
};

export const SITEMAP_ROUTES: readonly SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/prior-authorization-software", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/hipaa", changefreq: "yearly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

export const MAIN_NAV: readonly NavLink[] = [
  { label: "Platform", to: "/prior-authorization-software" },
  { label: "How it works", to: "/#how-it-works" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export const FOOTER_NAV: readonly FooterColumn[] = [
  {
    title: "Platform",
    links: [
      { label: "How it works", to: "/#how-it-works" },
      { label: "Capabilities", to: "/prior-authorization-software" },
      { label: "Appeal drafting", to: "/prior-authorization-software#appeals" },
      { label: "Integrations", to: "/#integrations" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Careers", to: "/contact" },
      { label: "Request a demo", to: "/contact" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Privacy notice", to: "/privacy" },
      { label: "HIPAA & security", to: "/hipaa" },
      { label: "Terms of service", to: "/privacy#terms" },
      { label: "Business associate agreement", to: "/hipaa#baa" },
    ],
  },
];

export type ComplianceBadge = {
  label: string;
  icon: IconName;
};

export const COMPLIANCE_BADGES: readonly ComplianceBadge[] = [
  { label: "HIPAA aligned", icon: "shield-check" },
  { label: "SOC 2 Type II program", icon: "lock" },
  { label: "BAA on every plan", icon: "file-text" },
  { label: "US data residency", icon: "map-pin" },
];
