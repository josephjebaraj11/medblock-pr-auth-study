import { Quote } from "lucide-react";

import { Card } from "~/components/ui/Card";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { TESTIMONIALS } from "~/content/home";

export function Testimonials() {
  return (
    <Section id="stories" aria-labelledby="testimonials-title" containerSize="wide">
      <SectionHeading
        id="testimonials-title"
        eyebrow={TESTIMONIALS.eyebrow}
        title={TESTIMONIALS.title}
        description={TESTIMONIALS.description}
      />

      <ul className="mt-14 grid gap-6 lg:grid-cols-3">
        {TESTIMONIALS.items.map((item, index) => (
          <Reveal as="li" key={item.quote} delay={index * 100}>
            <Card className="flex h-full flex-col">
              <Quote
                aria-hidden="true"
                className="h-8 w-8 text-brand-200 dark:text-brand-800"
                strokeWidth={1.5}
              />
              <blockquote className="mt-4 flex-1">
                <p className="type-display text-lg font-normal leading-relaxed text-content-secondary">
                  {item.quote}
                </p>
              </blockquote>
              <footer className="mt-6 border-t border-line pt-5">
                <p className="font-semibold text-content">{item.role}</p>
                <p className="text-sm text-content-muted">{item.practice}</p>
              </footer>
            </Card>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
