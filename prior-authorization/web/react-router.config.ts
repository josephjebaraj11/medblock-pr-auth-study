import { cp, readdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { Config } from "@react-router/dev/config";

/**
 * Sub-path the site is served from. GitHub Pages project sites live at
 * /<repo>/; set BASE_PATH=/ (the default) for a custom domain or local dev.
 */
export const BASE_PATH = process.env.BASE_PATH ?? "/";

const CLIENT_DIR = "build/client";

export default {
  // Statically rendered: there is no server on GitHub Pages, so every route is
  // rendered to an HTML file at build time and hydrated in the browser.
  ssr: false,
  // Links, redirects and client navigation are all rooted here.
  basename: BASE_PATH,
  // Every URL that should exist as a file. Anything missing falls through to
  // 404.html, which renders the catch-all route client-side.
  prerender: [
    "/",
    "/prior-authorization-software",
    "/solutions",
    "/pricing",
    "/about",
    "/contact",
    "/privacy",
    "/hipaa",
    "/sitemap.xml",
  ],
  async buildEnd() {
    // Prerendered HTML is written under the basename (build/client/repo/…),
    // but a Pages project site already serves the artifact at that prefix.
    // Flatten it so build/client is exactly what gets published.
    const nested = BASE_PATH.replace(/^\/|\/$/g, "");
    if (nested) {
      await cp(join(CLIENT_DIR, nested), CLIENT_DIR, { recursive: true });
      await rm(join(CLIENT_DIR, nested), { recursive: true, force: true });
    }

    // GitHub Pages 301s /about to /about/ when a page is about/index.html, but
    // serves about.html at /about with no redirect. Canonical tags and internal
    // links have no trailing slash, so emit the flat form.
    await flattenIndexFiles(CLIENT_DIR, CLIENT_DIR);

    // GitHub Pages serves 404.html — with a real 404 status — for any URL
    // without a file. The SPA shell hydrates at whatever URL was requested,
    // so the catch-all route renders the right page.
    await rename(join(CLIENT_DIR, "__spa-fallback.html"), join(CLIENT_DIR, "404.html"));
  },
} satisfies Config;

/** Rewrites every nested `<path>/index.html` as `<path>.html`. */
async function flattenIndexFiles(dir: string, root: string): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await flattenIndexFiles(path, root);
      // The rename below leaves the directory behind; drop it if that page was
      // all it held.
      if ((await readdir(path)).length === 0) await rm(path, { recursive: true });
    } else if (entry.name === "index.html" && dirname(path) !== root) {
      await rename(path, `${dirname(path)}.html`);
    }
  }
}
