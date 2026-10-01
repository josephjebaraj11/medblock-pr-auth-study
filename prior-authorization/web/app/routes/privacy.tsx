import { LegalPage } from "~/components/sections/LegalPage";
import { PRIVACY } from "~/content/legal";
import { seo } from "~/lib/seo";
import { breadcrumbs } from "~/lib/structured-data";

export function meta() {
  return seo({
    title: "Privacy Notice",
    description:
      "What Nexauth AI collects through this website and our product, why we collect it, how long we keep it, and the choices you have.",
    path: "/privacy",
    jsonLd: [
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Privacy notice", path: "/privacy" },
      ]),
    ],
  });
}

export default function PrivacyRoute() {
  return <LegalPage document={PRIVACY} />;
}
