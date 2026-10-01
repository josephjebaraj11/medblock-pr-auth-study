import { DemoForm } from "~/components/forms/DemoForm";
import { Accordion } from "~/components/ui/Accordion";
import { Badge } from "~/components/ui/Badge";
import { Icon } from "~/components/ui/Icon";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { CONTACT_DETAILS, CONTACT_HERO, DEMO_EXPECTATIONS } from "~/content/contact";
import { FAQS } from "~/content/home";
import { SITE } from "~/content/site";
import { seo } from "~/lib/seo";
import { breadcrumbs, contactPage, faqPage } from "~/lib/structured-data";

export function meta() {
  return seo({
    title: "Book a Prior Authorization Demo",
    description:
      "See Nexauth AI run against your own payer mix and authorization volume. 30 minutes, your forms, your numbers. No card required.",
    path: "/contact",
    jsonLd: [
      contactPage(),
      faqPage(),
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ]),
    ],
  });
}

export default function ContactRoute() {
  return (
    <>
      <Section
        tone="tint"
        spacing="loose"
        spacingTop="tight"
        containerSize="wide"
        aria-labelledby="contact-title"
      >
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Badge>{CONTACT_HERO.eyebrow}</Badge>
            <h1
              id="contact-title"
              className="type-display mt-6 text-display-sm sm:text-display-md"
            >
              {CONTACT_HERO.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-content-secondary">
              {CONTACT_HERO.body}
            </p>

            <dl className="mt-10 grid gap-5 sm:grid-cols-2">
              {CONTACT_DETAILS.map((detail) => (
                <div key={detail.label} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-content-brand shadow-soft ring-1 ring-line">
                    <Icon name={detail.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">
                      {detail.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-content">
                      {detail.label === "Email" ? (
                        <a
                          href={`mailto:${SITE.email}`}
                          className="text-content-brand underline underline-offset-4 hover:text-content-brand"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        detail.value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="mt-10 rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-line">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-content-muted">
                What a demo actually looks like
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {DEMO_EXPECTATIONS.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Icon
                      name="check-circle"
                      className="mt-0.5 h-5 w-5 shrink-0 text-accent-600"
                    />
                    <span className="text-sm leading-relaxed text-content-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-4xl bg-surface-raised p-6 shadow-lift ring-1 ring-line sm:p-9">
            <h2 className="text-2xl font-semibold">Send us a message</h2>
            <p className="mt-2 text-sm text-content-muted">{SITE.responseTime}</p>
            <div className="mt-8">
              <DemoForm />
            </div>
          </div>
        </div>
      </Section>

      <Section containerSize="wide" aria-labelledby="contact-faq-title">
        <SectionHeading id="contact-faq-title" eyebrow="FAQ" title="Frequently asked." />
        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion items={FAQS} />
        </div>
      </Section>
    </>
  );
}
