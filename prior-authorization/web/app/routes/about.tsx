import { CtaBanner } from "~/components/sections/CtaBanner";
import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { Icon } from "~/components/ui/Icon";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import {
  ABOUT_HERO,
  ABOUT_STATS,
  ARMS_RACE,
  CRISIS,
  MISSION,
  ORIGIN,
  SOURCES,
  TEAM,
  VALUES,
} from "~/content/about";
import { seo } from "~/lib/seo";
import { aboutPage, breadcrumbs } from "~/lib/structured-data";
import { cn } from "~/lib/utils";

export function meta() {
  return seo({
    title: "About Nexauth AI: Why We Automate Prior Authorization",
    description:
      "Prior authorization costs practices two working days a week and delays patient care. Why we treat that as an engineering problem, with sourced figures.",
    path: "/about",
    jsonLd: [
      aboutPage(),
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    ],
  });
}

export default function AboutRoute() {
  return (
    <>
      <Section tone="tint" spacing="loose" spacingTop="tight" aria-labelledby="about-title">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>{ABOUT_HERO.eyebrow}</Badge>
          <h1
            id="about-title"
            className="type-display mt-6 text-display-sm sm:text-display-md"
          >
            {ABOUT_HERO.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-content-secondary">{ABOUT_HERO.body}</p>
        </div>

        <dl className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 80}>
              <div className="h-full rounded-3xl bg-surface-raised p-6 text-center shadow-soft ring-1 ring-line">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-3xl font-semibold text-brand-800 dark:text-brand-200">
                    {stat.value}
                  </span>
                  <span className="mt-2 block text-sm leading-snug text-content-secondary">
                    {stat.label}
                  </span>
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Section>

      <Section containerSize="narrow" aria-labelledby="mission-title">
        <SectionHeading
          id="mission-title"
          eyebrow={MISSION.eyebrow}
          title={MISSION.title}
          align="left"
        />
        <div className="mt-8 flex flex-col gap-5">
          {MISSION.body.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-relaxed text-content-secondary">
              {paragraph}
            </p>
          ))}
        </div>
      </Section>

      <Section tone="dark" containerSize="wide" aria-labelledby="crisis-title">
        <SectionHeading
          id="crisis-title"
          eyebrow={CRISIS.eyebrow}
          title={CRISIS.title}
          description={CRISIS.description}
          tone="dark"
        />
        <dl className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CRISIS.items.map((item, index) => (
            <Reveal key={item.label} delay={index * 70}>
              <div className="h-full rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10">
                <dt className="sr-only">{item.label}</dt>
                <dd>
                  <span className="block text-4xl font-semibold text-aqua-300">
                    {item.value}
                  </span>
                  <span className="mt-3 block leading-snug text-ink-300">
                    {item.label}
                  </span>
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Section>

      <Section tone="tint" containerSize="wide" aria-labelledby="arms-race-title">
        <SectionHeading
          id="arms-race-title"
          eyebrow={ARMS_RACE.eyebrow}
          title={ARMS_RACE.title}
          description={ARMS_RACE.description}
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {ARMS_RACE.columns.map((column, index) => (
            <Reveal key={column.side} delay={index * 120}>
              <Card
                className={cn(
                  "h-full",
                  column.tone === "solution" && "ring-2 ring-accent-500/40",
                )}
              >
                <h3 className="flex items-center gap-3 text-lg font-semibold">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      column.tone === "problem"
                        ? "bg-tint-signal text-tint-signal-on"
                        : "bg-tint-accent text-tint-accent-on",
                    )}
                  >
                    <Icon
                      name={column.tone === "problem" ? "trending-down" : "trending-up"}
                      className="h-5 w-5"
                    />
                  </span>
                  {column.side}
                </h3>
                <ul className="mt-6 flex flex-col gap-4">
                  {column.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span
                        className={cn(
                          "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                          column.tone === "problem" ? "bg-signal-500" : "bg-accent-600",
                        )}
                      />
                      <span className="leading-relaxed text-content-secondary">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section containerSize="wide" aria-labelledby="origin-title">
        <SectionHeading
          id="origin-title"
          eyebrow="How we got here"
          title="Built out of somebody else's bad Thursday."
        />
        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ORIGIN.map((chapter, index) => (
            <Reveal as="li" key={chapter.label} delay={index * 90}>
              <div className="h-full border-t-2 border-brand-200 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-content-brand">
                  {chapter.label}
                </p>
                <h3 className="mt-3 text-lg font-semibold">{chapter.title}</h3>
                <p className="mt-3 leading-relaxed text-content-secondary">{chapter.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section tone="mint" containerSize="wide" aria-labelledby="values-title">
        <SectionHeading
          id="values-title"
          eyebrow="What we believe"
          title="Six things we will not trade away."
        />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value, index) => (
            <Reveal as="li" key={value.title} delay={index * 70}>
              <Card className="h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-tint-brand text-tint-brand-on">
                  <Icon name={value.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{value.title}</h3>
                <p className="mt-3 leading-relaxed text-content-secondary">{value.body}</p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section containerSize="narrow" aria-labelledby="team-title">
        <SectionHeading
          id="team-title"
          eyebrow={TEAM.eyebrow}
          title={TEAM.title}
          align="left"
        />
        <p className="mt-8 text-lg leading-relaxed text-content-secondary">{TEAM.body}</p>

        <div className="mt-12 rounded-3xl bg-surface-inset p-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-content-muted">
            Sources
          </h2>
          <ol className="mt-4 flex flex-col gap-3">
            {SOURCES.map((source, index) => (
              <li key={source} className="flex gap-3 text-sm leading-relaxed text-content-secondary">
                <span className="font-mono text-xs text-content-muted">{index + 1}.</span>
                {source}
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <CtaBanner
        title="Take your week back."
        body="Thirty minutes with your own numbers will tell you more than any case study we could write."
      />
    </>
  );
}
