import { ArrowRight } from "lucide-react";

import { PulseRings } from "~/components/backgrounds/PulseRings";

import { Button } from "~/components/ui/Button";
import { Container } from "~/components/ui/Container";
import { Reveal } from "~/components/ui/Reveal";
import { CTA } from "~/content/home";

type CtaBannerProps = {
  title?: string;
  body?: string;
};

export function CtaBanner({ title = CTA.title, body = CTA.body }: CtaBannerProps) {
  return (
    <section aria-labelledby="cta-title" className="on-dark bg-surface-raised pb-20 sm:pb-24">
      <Container size="wide">
        <Reveal>
          <div className="relative overflow-hidden rounded-5xl bg-gradient-to-br from-brand-800 via-brand-700 to-aqua-700 px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-40"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-accent-400/20 blur-3xl"
            />
            <PulseRings className="left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2" />

            <div className="relative mx-auto max-w-2xl">
              <h2
                id="cta-title"
                className="type-display text-display-sm text-white sm:text-display-md"
              >
                {title}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-brand-100">{body}</p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button to="/contact" size="lg">
                  {CTA.primaryCta}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
                <Button to="/prior-authorization-software" variant="inverse" size="lg">
                  {CTA.secondaryCta}
                </Button>
              </div>

              <p className="mt-5 text-sm text-brand-100">{CTA.note}</p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
