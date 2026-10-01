import { SITE } from "~/content/site";

export type MetaDescriptor =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: "link"; rel: string; href: string }
  | { "script:ld+json": Record<string, unknown> };

type SeoInput = {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "/about". */
  path: string;
  /** schema.org graphs for this route, from `~/lib/structured-data`. */
  jsonLd?: ReadonlyArray<Record<string, unknown>>;
};

/**
 * Builds the per-route meta tags (title, description, canonical, Open Graph and
 * Twitter cards) from one small input, so every route stays consistent.
 */
export function seo({ title, description, path, jsonLd }: SeoInput): MetaDescriptor[] {
  const fullTitle = path === "/" ? title : `${title} | ${SITE.name}`;
  const url = `${SITE.url}${path === "/" ? "" : path}`;
  const image = `${SITE.url}${SITE.ogImage}`;

  const descriptors: MetaDescriptor[] = [
    { title: fullTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE.name },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: `${SITE.name} — ${SITE.tagline}` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  for (const graph of jsonLd ?? []) {
    descriptors.push({ "script:ld+json": graph });
  }

  return descriptors;
}
