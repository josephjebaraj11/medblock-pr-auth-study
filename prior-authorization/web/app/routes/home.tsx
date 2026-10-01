import { CtaBanner } from "~/components/sections/CtaBanner";
import { Differentiator } from "~/components/sections/Differentiator";
import { Faq } from "~/components/sections/Faq";
import { Features } from "~/components/sections/Features";
import { Hero } from "~/components/sections/Hero";
import { HowItWorks } from "~/components/sections/HowItWorks";
import { Integrations } from "~/components/sections/Integrations";
import { Metrics } from "~/components/sections/Metrics";
import { Pricing } from "~/components/sections/Pricing";
import { Problem } from "~/components/sections/Problem";
import { Testimonials } from "~/components/sections/Testimonials";
import { TrustBar } from "~/components/sections/TrustBar";
import { SITE } from "~/content/site";
import { seo } from "~/lib/seo";
import { faqPage } from "~/lib/structured-data";

export function meta() {
  return seo({
    title: `Prior Authorization Automation Software | ${SITE.name}`,
    description:
      "Nexauth AI drafts, submits, tracks and appeals prior authorizations in about 30 seconds. Practices recover 15+ staff hours a week. Book a demo.",
    path: "/",
    jsonLd: [faqPage()],
  });
}

export default function HomeRoute() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Problem />
      <HowItWorks />
      <Features />
      <Differentiator />
      <Metrics />
      <Integrations />
      <Testimonials />
      <Pricing />
      <Faq />
      <CtaBanner />
    </>
  );
}
