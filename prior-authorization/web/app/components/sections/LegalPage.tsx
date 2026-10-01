import { Button } from "~/components/ui/Button";
import { Section } from "~/components/ui/Section";
import type { LegalDocument } from "~/content/legal";

type LegalPageProps = {
  document: LegalDocument;
};

/** Shared long-form layout for the privacy and HIPAA pages. */
export function LegalPage({ document }: LegalPageProps) {
  return (
    <>
      <Section tone="tint" containerSize="narrow" spacing="compact" spacingTop="tight">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-content-brand">
          Last updated {document.updated}
        </p>
        <h1 className="type-display mt-4 text-display-sm">{document.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-content-secondary">{document.intro}</p>
      </Section>

      <Section containerSize="narrow">
        <nav aria-label="On this page" className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-content-muted">
            On this page
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {document.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-block rounded-full bg-surface-inset px-3.5 py-1.5 text-sm font-medium text-content-secondary transition hover:bg-brand-50 hover:text-content-brand"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-12">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-relaxed text-content-secondary">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-5 flex flex-col gap-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                      />
                      <span className="leading-relaxed text-content-secondary">{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <p className="mt-14 rounded-2xl bg-surface-inset px-6 py-5 text-sm leading-relaxed text-content-muted">
          {document.disclaimer}
        </p>

        <Button to="/contact" variant="secondary" className="mt-8">
          Ask a question about this
        </Button>
      </Section>
    </>
  );
}
