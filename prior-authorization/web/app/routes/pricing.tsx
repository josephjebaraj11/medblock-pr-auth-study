import { CtaBanner } from "~/components/sections/CtaBanner";
import { Faq } from "~/components/sections/Faq";
import { Pricing } from "~/components/sections/Pricing";
import { seo } from "~/lib/seo";
import { breadcrumbs, faqPage } from "~/lib/structured-data";

export function meta() {
  return seo({
    title: "Prior Authorization Software Pricing",
    description:
      "Per-provider pricing with unlimited authorizations and appeals on every plan, plus a signed BAA. Pilots run 30 days with no commitment.",
    path: "/pricing",
    jsonLd: [
      faqPage(),
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
      ]),
    ],
  });
}

/**
 * Pricing gets its own indexable URL rather than living only as an anchor on
 * the home page — an anchor cannot rank, be cited, or be linked to directly.
 */
export default function PricingRoute() {
  return (
    <>
      <Pricing headingLevel="h1" spacingTop="tight" />
      <Faq />
      <CtaBanner
        title="See the numbers against your own volume."
        body="Thirty minutes with your payer mix will tell you more than any pricing page can."
      />
    </>
  );
}
