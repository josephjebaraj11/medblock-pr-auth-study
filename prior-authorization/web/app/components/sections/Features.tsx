import { Badge } from "~/components/ui/Badge";
import { Card } from "~/components/ui/Card";
import { Icon } from "~/components/ui/Icon";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { FEATURES } from "~/content/home";
import { cn } from "~/lib/utils";

export function Features() {
  return (
    <Section id="features" tone="tint" aria-labelledby="features-title" containerSize="wide">
      <SectionHeading
        id="features-title"
        eyebrow={FEATURES.eyebrow}
        title={FEATURES.title}
        description={FEATURES.description}
      />

      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.items.map((feature, index) => (
          <Reveal as="li" key={feature.title} delay={index * 80}>
            <Card
              interactive
              className={cn(
                "flex h-full flex-col",
                feature.highlight && "ring-2 ring-accent-500/50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl",
                    feature.highlight
                      ? "bg-accent-600 text-white"
                      : "bg-tint-brand text-tint-brand-on",
                  )}
                >
                  <Icon name={feature.icon} className="h-6 w-6" />
                </span>
                {feature.tag ? (
                  <Badge tone={feature.highlight ? "accent" : "aqua"}>{feature.tag}</Badge>
                ) : null}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 leading-relaxed text-content-secondary">{feature.body}</p>
            </Card>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
