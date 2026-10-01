import { Check } from "lucide-react";

import { AuthFlowMesh } from "~/components/backgrounds/AuthFlowMesh";

import { Badge } from "~/components/ui/Badge";
import { Icon } from "~/components/ui/Icon";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { DIFFERENTIATOR } from "~/content/home";

export function Differentiator() {
  const { sample } = DIFFERENTIATOR;

  return (
    <Section
      id="appeals"
      tone="dark"
      spacing="loose"
      containerSize="wide"
      aria-labelledby="differentiator-title"
      className="overflow-hidden"
    >
      {/* Documents leaving the practice, assembled, and returning approved. */}
      <AuthFlowMesh className="text-aqua-200 [mask-image:linear-gradient(to_bottom,black,rgba(0,0,0,0.3)_38%,rgba(0,0,0,0.3)_70%,black)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-aqua-500/10 blur-3xl"
      />

      <div className="relative grid items-center gap-14 lg:grid-cols-2">
        <div>
          <Reveal>
            <Badge tone="inverse">{DIFFERENTIATOR.eyebrow}</Badge>
            <h2
              id="differentiator-title"
              className="type-display mt-6 text-display-sm text-white sm:text-display-md"
            >
              {DIFFERENTIATOR.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-300">
              {DIFFERENTIATOR.description}
            </p>
          </Reveal>

          <ul className="mt-8 flex flex-col gap-4">
            {DIFFERENTIATOR.points.map((point, index) => (
              <Reveal as="li" key={point} delay={index * 70} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-ink-950">
                  <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3.5} />
                </span>
                <span className="leading-relaxed text-ink-200">{point}</span>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal delay={150}>
          <div className="rounded-4xl bg-white/[0.04] p-2 ring-1 ring-white/10 backdrop-blur">
            <div className="rounded-3xl bg-surface-raised p-6 shadow-lift sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">
                    {sample.title}
                  </p>
                  <p className="mt-1 font-semibold text-content">{sample.subtitle}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tint-brand text-tint-brand-on">
                  <Icon name="scale" className="h-5 w-5" />
                </span>
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.1em] text-content-muted">
                Sources retrieved
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {sample.retrieval.map((source) => (
                  <li
                    key={source.label}
                    className="flex items-center justify-between gap-4 rounded-xl bg-surface-inset px-4 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-content-secondary">
                      <Icon name="file-search" className="h-4 w-4 text-aqua-600" />
                      {source.label}
                    </span>
                    <span className="font-mono text-xs text-content-muted">{source.year}</span>
                  </li>
                ))}
              </ul>

              <blockquote className="mt-6 border-l-2 border-accent-500 pl-4">
                <p className="text-sm leading-relaxed text-content-secondary">{sample.excerpt}</p>
              </blockquote>

              <p className="mt-5 flex items-center gap-2 text-xs text-content-muted">
                <Icon name="check-circle" className="h-4 w-4 text-accent-600" />
                {sample.footnote}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
