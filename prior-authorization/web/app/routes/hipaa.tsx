import { LegalPage } from "~/components/sections/LegalPage";
import { HIPAA } from "~/content/legal";
import { seo } from "~/lib/seo";
import { breadcrumbs } from "~/lib/structured-data";

export function meta() {
  return seo({
    title: "HIPAA Compliance & PHI Security",
    description:
      "How Nexauth AI safeguards PHI as a business associate: encryption, least-privilege access, audit logging, US data residency and a BAA on every plan.",
    path: "/hipaa",
    jsonLd: [
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "HIPAA & security", path: "/hipaa" },
      ]),
    ],
  });
}

export default function HipaaRoute() {
  return <LegalPage document={HIPAA} />;
}
