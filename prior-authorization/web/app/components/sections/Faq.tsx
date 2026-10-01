import { Accordion } from "~/components/ui/Accordion";
import { Button } from "~/components/ui/Button";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { FAQS } from "~/content/home";

export function Faq() {
  return (
    <Section id="faq" aria-labelledby="faq-title" containerSize="wide">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            title="Questions we get asked first."
            align="left"
          />
          <p className="mt-6 leading-relaxed text-content-secondary">
            Still unsure whether this fits your setup? Send us the specifics and we
            will tell you plainly, including when the answer is no.
          </p>
          <Button to="/contact" variant="secondary" className="mt-6">
            Ask us directly
          </Button>
        </div>

        <Accordion items={FAQS} />
      </div>
    </Section>
  );
}
