import { redirect } from "react-router";

import { SITE } from "~/content/site";
import { withBase } from "~/lib/base-url";

const DESTINATION = "/prior-authorization-software";

/**
 * `/solutions` was renamed to `/prior-authorization-software`, which is what
 * people actually search for. A static host cannot return a 301, so this page
 * is prerendered as a meta refresh — search engines treat an instant one as a
 * permanent redirect — with a canonical tag pointing at the new slug.
 */
export function meta() {
  return [
    { title: "Redirecting…" },
    { "http-equiv": "refresh", content: `0; url=${withBase(DESTINATION)}` },
    { name: "robots", content: "noindex, follow" },
    { tagName: "link", rel: "canonical", href: `${SITE.url}${DESTINATION}` },
  ];
}

// In-app navigation never needs the meta refresh; `basename` is applied here.
export async function clientLoader() {
  throw redirect(DESTINATION);
}

export default function SolutionsRedirect() {
  return (
    <p className="p-8 text-center">
      This page moved to <a href={withBase(DESTINATION)}>{DESTINATION}</a>.
    </p>
  );
}
