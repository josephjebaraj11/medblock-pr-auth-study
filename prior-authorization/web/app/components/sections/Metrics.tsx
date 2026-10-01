import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { METRICS } from "~/content/home";

export function Metrics() {
  return (
    <Section id="results" aria-labelledby="metrics-title" containerSize="wide">
      <SectionHeading
        id="metrics-title"
        eyebrow={METRICS.eyebrow}
        title={METRICS.title}
        description={METRICS.description}
      />

      <dl className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.items.map((item, index) => (
          <Reveal key={item.label} delay={index * 90}>
            <div className="h-full rounded-3xl bg-gradient-to-b from-brand-50 to-surface p-6 ring-1 ring-brand-100 dark:from-brand-950/50 dark:ring-brand-900/60">
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span className="block text-4xl font-semibold tracking-tight text-brand-800 dark:text-brand-200">
                  {item.value}
                </span>
                <span className="mt-3 block font-medium leading-snug text-content">
                  {item.label}
                </span>
                {item.detail ? (
                  <span className="mt-2 block text-sm leading-relaxed text-content-muted">
                    {item.detail}
                  </span>
                ) : null}
              </dd>
            </div>
          </Reveal>
        ))}
      </dl>

      <p className="mt-8 text-center text-sm text-content-muted">{METRICS.source}</p>
    </Section>
  );
}
