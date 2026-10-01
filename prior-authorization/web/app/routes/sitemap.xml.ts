import { SITE, SITEMAP_ROUTES } from "~/content/site";

/**
 * Generated from `SITEMAP_ROUTES` at request time rather than maintained as a
 * static file, so it cannot fall out of sync with the routes that exist.
 */
export function loader() {
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = SITEMAP_ROUTES.map(({ path, changefreq, priority }) => {
    const loc = `${SITE.url}${path === "/" ? "/" : path}`;
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
