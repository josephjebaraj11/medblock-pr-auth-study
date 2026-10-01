/**
 * Prefixes a root-relative path with the deploy base (`vite.config.ts` →
 * `base`). A bare "/favicon.svg" would 404 when the site is served from a
 * sub-path such as /prior-authorization/.
 *
 * React Router's `basename` already covers `<Link to>` and router redirects,
 * and Vite rebases imported assets and `url()` in CSS. This is for the paths
 * that neither sees: plain strings handed to `<link>`, `<a href>` or meta tags.
 */
export function withBase(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
