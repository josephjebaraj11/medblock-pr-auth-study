import { FAQS } from "~/content/home";
import { SITE } from "~/content/site";

/**
 * schema.org JSON-LD builders.
 *
 * Emitted through React Router's `meta` export using the `script:ld+json` key,
 * so each route ships only the graph that describes it. Node `@id`s are stable
 * URLs, which lets per-page nodes reference the site-wide Organization instead
 * of restating it.
 */

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

type JsonLd = Record<string, unknown>;

export function absolute(path: string): string {
  return `${SITE.url}${path === "/" ? "" : path}`;
}

/** Site-wide identity. Emitted once, from the root route. */
export function organizationGraph(): JsonLd {
  const organization: JsonLd = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    url: SITE.url,
    logo: absolute("/favicon.svg"),
    image: absolute(SITE.ogImage),
    description: SITE.description,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      addressCountry: SITE.address.country,
    },
  };

  // Omit `sameAs` entirely rather than shipping an empty array.
  if (SITE.sameAs.length > 0) organization.sameAs = SITE.sameAs;

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "en-US",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

/** The product page. Pricing mirrors the lowest published per-provider rate. */
export function softwareApplication(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    url: absolute("/prior-authorization-software"),
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Prior Authorization Automation",
    operatingSystem: "Web",
    description:
      "Automates prior authorization intake, payer form completion, submission, status tracking and evidence-backed appeals for medical practices.",
    offers: {
      "@type": "Offer",
      price: "199.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "199.00",
        priceCurrency: "USD",
        unitText: "per provider per month",
      },
      url: absolute("/pricing"),
    },
    publisher: { "@id": ORG_ID },
  };
}

/**
 * Built from the same `FAQS` data the page renders, so the markup can never
 * describe an answer a visitor cannot see — which is what Google requires.
 */
export function faqPage(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbs(trail: readonly Crumb[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

/** Marks a page as describing the organisation itself. */
export function aboutPage(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE.name}`,
    url: absolute("/about"),
    mainEntity: { "@id": ORG_ID },
  };
}

export function contactPage(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE.name}`,
    url: absolute("/contact"),
    mainEntity: { "@id": ORG_ID },
  };
}
