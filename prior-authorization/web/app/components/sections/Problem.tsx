import { Card } from "~/components/ui/Card";
import { Icon } from "~/components/ui/Icon";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { PROBLEM } from "~/content/home";

export function Problem() {
  return (
    <Section id="problem" tone="tint" aria-labelledby="problem-title" containerSize="wide">
      <SectionHeading
        id="problem-title"
        eyebrow={PROBLEM.eyebrow}
        title={PROBLEM.title}
        description={PROBLEM.description}
      />

      <ul className="mt-14 grid gap-6 md:grid-cols-3">
        {PROBLEM.items.map((item, index) => (
          <Reveal as="li" key={item.title} delay={index * 100}>
            <Card className="flex h-full flex-col">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tint-signal text-tint-signal-on">
                <Icon name={item.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-content-secondary">{item.body}</p>
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-3xl font-semibold text-content">{item.stat}</p>
                <p className="mt-1 text-sm text-content-muted">{item.statLabel}</p>
              </div>
            </Card>
          </Reveal>
        ))}
      </ul>

      <p className="mt-8 text-center text-sm text-content-muted">{PROBLEM.source}</p>
    </Section>
  );
}
