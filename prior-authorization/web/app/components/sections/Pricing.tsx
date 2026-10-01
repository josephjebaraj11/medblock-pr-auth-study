import { Check } from "lucide-react";

import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { PRICING } from "~/content/home";
import { cn } from "~/lib/utils";

type PricingProps = {
  /** `h1` when this section is the page's primary heading (the /pricing route). */
  headingLevel?: "h1" | "h2";
  spacingTop?: "tight" | "compact" | "default" | "loose";
};

export function Pricing({ headingLevel = "h2", spacingTop }: PricingProps) {
  return (
    <Section
      id="pricing"
      tone="tint"
      aria-labelledby="pricing-title"
      containerSize="wide"
      spacingTop={spacingTop}
    >
      <SectionHeading
        id="pricing-title"
        level={headingLevel}
        eyebrow={PRICING.eyebrow}
        title={PRICING.title}
        description={PRICING.description}
      />

      <ul className="mt-14 grid items-start gap-6 lg:grid-cols-3">
        {PRICING.plans.map((plan, index) => (
          <Reveal as="li" key={plan.name} delay={index * 100}>
            <div
              className={cn(
                "flex h-full flex-col rounded-3xl p-7 transition-shadow",
                plan.featured
                  // In light mode the dark panel is what makes this plan stand out. In dark
// mode that reads as recessed, so a brand tint and ring carry it instead.
                  ? "on-dark bg-surface-inverse text-ink-300 shadow-lift ring-1 ring-white/10 dark:bg-brand-950 dark:ring-brand-600/60"
                  : "bg-surface-raised shadow-soft ring-1 ring-line",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3
                  className={cn(
                    "text-lg font-semibold",
                    plan.featured && "text-white",
                  )}
                >
                  {plan.name}
                </h3>
                {plan.featured ? <Badge tone="inverse">Most chosen</Badge> : null}
              </div>

              <p
                className={cn(
                  "mt-4 text-sm leading-relaxed",
                  plan.featured ? "text-ink-400" : "text-content-secondary",
                )}
              >
                {plan.summary}
              </p>

              <p className="mt-6 flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-4xl font-semibold tracking-tight",
                    plan.featured ? "text-white" : "text-content",
                  )}
                >
                  {plan.price}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    plan.featured ? "text-ink-400" : "text-content-muted",
                  )}
                >
                  {plan.cadence}
                </span>
              </p>

              <Button
                to="/contact"
                variant={plan.featured ? "primary" : "secondary"}
                size="lg"
                className="mt-6 w-full"
              >
                {plan.ctaLabel}
              </Button>

              <ul className="mt-7 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
                        plan.featured
                          ? "bg-accent-500 text-ink-950"
                          : "bg-tint-accent text-tint-accent-on",
                      )}
                    >
                      <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    <span className={plan.featured ? "text-ink-300" : "text-content-secondary"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </ul>

      <p className="mt-10 text-center text-sm text-content-muted">{PRICING.note}</p>
    </Section>
  );
}
