import { CtaBanner } from "~/components/sections/CtaBanner";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { Container } from "~/components/ui/Container";
import { Icon } from "~/components/ui/Icon";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import {
  AUDIENCES,
  CAPABILITIES,
  SECURITY,
  SOLUTIONS_HERO,
  WORKFLOW_NOTE,
} from "~/content/solutions";
import { seo } from "~/lib/seo";
import { breadcrumbs, softwareApplication } from "~/lib/structured-data";
import { cn } from "~/lib/utils";

export function meta() {
  return seo({
    title: "Prior Authorization Software: Intake to Appeal",
    description:
      "One workspace for the whole prior authorization lifecycle — chart intake, payer forms, status tracking and evidence-backed appeals. See the platform.",
    path: "/prior-authorization-software",
    jsonLd: [
      softwareApplication(),
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Prior authorization software", path: "/prior-authorization-software" },
      ]),
    ],
  });
}

export default function SolutionsRoute() {
  return (
    <>
      <Section tone="tint" spacing="loose" spacingTop="tight" aria-labelledby="solutions-title">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>{SOLUTIONS_HERO.eyebrow}</Badge>
          <h1
            id="solutions-title"
            className="type-display mt-6 text-display-sm sm:text-display-md"
          >
            {SOLUTIONS_HERO.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-content-secondary">
            {SOLUTIONS_HERO.body}
          </p>
        </div>

        <nav aria-label="Capabilities" className="mt-12">
          <ul className="flex flex-wrap justify-center gap-2">
            {CAPABILITIES.map((capability) => (
              <li key={capability.id}>
                <a
                  href={`#${capability.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-4 py-2 text-sm font-medium text-content-secondary shadow-soft ring-1 ring-line transition hover:text-content-brand hover:ring-brand-200"
                >
                  <Icon name={capability.icon} className="h-4 w-4 text-content-brand" />
                  {capability.eyebrow}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      <Section containerSize="wide" spacing="loose">
        <ul className="flex flex-col gap-20 sm:gap-24">
          {CAPABILITIES.map((capability, index) => (
            <li
              key={capability.id}
              id={capability.id}
              className="scroll-mt-28"
            >
              <Reveal
                className={cn(
                  "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
                  index % 2 === 1 && "lg:[&>*:first-child]:order-2",
                )}
              >
                <div>
                  <Badge tone="aqua">{capability.eyebrow}</Badge>
                  <h2 className="type-display mt-5 text-3xl sm:text-4xl">
                    {capability.title}
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-content-secondary">
                    {capability.body}
                  </p>
                </div>

                <Card className="bg-gradient-to-br from-surface-raised to-brand-50/60 dark:to-brand-950/40">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
                    <Icon name={capability.icon} className="h-6 w-6" />
                  </span>
                  <ul className="mt-6 flex flex-col gap-4">
                    {capability.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <Icon
                          name="check-circle"
                          className="mt-0.5 h-5 w-5 shrink-0 text-accent-600"
                        />
                        <span className="leading-relaxed text-content-secondary">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="dark" containerSize="narrow" aria-labelledby="workflow-note-title">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-accent-400">
            <Icon name="users" className="h-7 w-7" />
          </span>
          <h2
            id="workflow-note-title"
            className="type-display mt-6 text-3xl text-white sm:text-4xl"
          >
            {WORKFLOW_NOTE.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-300">
            {WORKFLOW_NOTE.body}
          </p>
        </div>
      </Section>

      <Section tone="tint" containerSize="wide" aria-labelledby="audiences-title">
        <SectionHeading
          id="audiences-title"
          eyebrow="Who it is for"
          title="Built for the people working the queue."
        />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((audience, index) => (
            <Reveal as="li" key={audience.title} delay={index * 90}>
              <Card interactive className="h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-tint-aqua text-tint-aqua-on">
                  <Icon name={audience.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{audience.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-content-secondary">
                  {audience.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section containerSize="wide" aria-labelledby="security-title">
        <SectionHeading
          id="security-title"
          eyebrow="Security"
          title="PHI handling that survives a security review."
          description="The controls your compliance team will ask about, documented and in place before your first upload."
        />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2">
          {SECURITY.map((item, index) => (
            <Reveal as="li" key={item.title} delay={index * 90}>
              <Card className="flex h-full gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tint-accent text-tint-accent-on">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-content-secondary">{item.body}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </ul>

        <Container size="narrow" className="mt-12 px-0">
          <p className="rounded-2xl bg-surface-inset px-6 py-5 text-center text-sm leading-relaxed text-content-secondary">
            Nexauth AI supports administrative workflow. It does not diagnose, does not
            prescribe, and does not replace clinical judgement.
          </p>
        </Container>
      </Section>

      <CtaBanner
        title="See it run against your payer mix."
        body="Bring a real denial and a real form. We will show you what the draft looks like in the first ten minutes."
      />
    </>
  );
}
