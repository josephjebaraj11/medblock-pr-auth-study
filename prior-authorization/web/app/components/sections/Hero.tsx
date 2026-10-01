import { ArrowRight, Check } from "lucide-react";

import { VitalsLine } from "~/components/backgrounds/VitalsLine";

import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Container } from "~/components/ui/Container";
import { Reveal } from "~/components/ui/Reveal";
import { HERO } from "~/content/home";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-gradient-to-b from-brand-50/80 via-surface to-surface dark:from-brand-950/60"
    >
      {/* Decorative background: a faint clinical grid and two soft colour washes. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-aqua-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-40 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl"
      />
      {/* Cardiac trace running along the foot of the hero. */}
      <VitalsLine className="bottom-0 left-0 h-24 text-brand-500 sm:h-32" />

      <Container size="wide" className="relative pb-20 pt-10 sm:pb-24 sm:pt-14 lg:pb-28 lg:pt-16">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Reveal>
              <Badge tone="brand">{HERO.eyebrow}</Badge>
            </Reveal>

            <Reveal delay={80}>
              <h1
                id="hero-title"
                className="type-display mt-6 text-display-sm sm:text-display-md lg:text-display-lg"
              >
                Insurers have algorithms.{" "}
                <span className="text-gradient">Now you do too.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-content-secondary">
                {HERO.body}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button to="/contact" size="lg">
                  {HERO.primaryCta}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
                <Button href="#how-it-works" variant="secondary" size="lg">
                  {HERO.secondaryCta}
                </Button>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <p className="mt-4 text-sm text-content-muted">{HERO.note}</p>
            </Reveal>

            <Reveal delay={360}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-8">
                {HERO.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="block text-3xl font-semibold text-content">
                        {stat.value}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-content-muted">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={200} className="lg:pl-4">
            <HeroCard />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/**
 * An abstract representation of a request in progress. Deliberately not a
 * screenshot and deliberately not a real patient — it illustrates the shape of
 * the workflow, so it is hidden from assistive tech behind a text summary.
 */
function HeroCard() {
  const { sample } = HERO;

  return (
    <div className="relative">
      <p className="sr-only">
        Illustration: an authorization request for {sample.medication} reaching
        &ldquo;{sample.status}&rdquo; in {sample.elapsed}.
      </p>

      <div
        aria-hidden="true"
        className="relative rounded-4xl bg-surface-raised p-6 shadow-glow ring-1 ring-line sm:p-7"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">
              {sample.patient}
            </p>
            <p className="mt-1 text-lg font-semibold text-content">
              {sample.medication}
            </p>
            <p className="text-sm text-content-muted">{sample.payer}</p>
          </div>
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-accent-400/40 animate-pulse-ring" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-tint-accent text-tint-accent-on">
              <Check className="h-6 w-6" strokeWidth={3} />
            </span>
          </div>
        </div>

        <ul className="mt-6 flex flex-col gap-3">
          {sample.checks.map((check) => (
            <li
              key={check}
              className="flex items-start gap-3 rounded-2xl bg-surface-inset px-4 py-3"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white">
                <Check className="h-3 w-3" strokeWidth={3.5} />
              </span>
              <span className="text-sm font-medium text-content-secondary">{check}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-surface-inverse px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-ink-400">Status</p>
            <p className="text-sm font-semibold text-white">{sample.status}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.1em] text-ink-400">Elapsed</p>
            <p className="font-mono text-sm font-semibold text-aqua-300">
              {sample.elapsed}
            </p>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute -bottom-8 -left-8 hidden rounded-2xl bg-surface-raised px-4 py-3 shadow-lift ring-1 ring-line sm:block"
      >
        <p className="text-xs font-medium text-content-muted">Reviewed by</p>
        <p className="text-sm font-semibold text-content">Your team, always</p>
      </div>
    </div>
  );
}
