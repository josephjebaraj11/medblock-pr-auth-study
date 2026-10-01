import { Icon } from "~/components/ui/Icon";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { HOW_IT_WORKS } from "~/content/home";

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      containerSize="wide"
      spacing="loose"
    >
      <SectionHeading
        id="how-it-works-title"
        eyebrow={HOW_IT_WORKS.eyebrow}
        title={HOW_IT_WORKS.title}
        description={HOW_IT_WORKS.description}
      />

      <ol className="relative mt-16 grid gap-10 lg:grid-cols-4 lg:gap-6">
        {/* The connecting rail only makes sense in the horizontal layout. The
            marching dashes read as the request moving between steps. */}
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 top-6 hidden h-0.5 rounded-full bg-gradient-to-r from-brand-100 via-aqua-200 to-brand-100 lg:block"
        />
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 top-6 hidden h-0.5 animate-rail-flow rounded-full bg-[repeating-linear-gradient(90deg,theme(colors.brand.500)_0_8px,transparent_8px_24px)] opacity-90 lg:block"
        />

        {HOW_IT_WORKS.steps.map((step, index) => (
          <Reveal as="li" key={step.number} delay={index * 110} className="relative">
            <div className="flex items-center gap-4 lg:block">
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft ring-4 ring-white">
                <Icon name={step.icon} className="h-5 w-5" />
              </span>
              <div className="lg:mt-6">
                <p className="font-mono text-xs font-semibold tracking-[0.12em] text-content-brand">
                  {step.number}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
              </div>
            </div>
            <p className="mt-4 leading-relaxed text-content-secondary">{step.body}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-tint-aqua px-3 py-1 text-xs font-semibold text-tint-aqua-on">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {step.duration}
            </p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
