import { Icon } from "~/components/ui/Icon";
import { Reveal } from "~/components/ui/Reveal";
import { Section } from "~/components/ui/Section";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { INTEGRATIONS } from "~/content/home";

const CATEGORY_ICON = {
  EHR: "plug",
  Standard: "git-merge",
  Fallback: "refresh-cw",
} as const;

type Category = keyof typeof CATEGORY_ICON;

export function Integrations() {
  const categories = ["EHR", "Standard", "Fallback"] as const satisfies readonly Category[];

  return (
    <Section
      id="integrations"
      tone="mint"
      aria-labelledby="integrations-title"
      containerSize="wide"
    >
      <SectionHeading
        id="integrations-title"
        eyebrow={INTEGRATIONS.eyebrow}
        title={INTEGRATIONS.title}
        description={INTEGRATIONS.description}
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {categories.map((category, index) => {
          const items = INTEGRATIONS.items.filter((item) => item.category === category);
          if (items.length === 0) return null;

          return (
            <Reveal key={category} delay={index * 100}>
              <div className="h-full rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-line sm:p-7">
                <h3 className="flex items-center gap-3 text-lg font-semibold">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tint-aqua text-tint-aqua-on">
                    <Icon name={CATEGORY_ICON[category]} className="h-5 w-5" />
                  </span>
                  {category === "EHR"
                    ? "Electronic health records"
                    : category === "Standard"
                      ? "Interoperability standards"
                      : "When a payer still wants paper"}
                </h3>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {items.map((item) => (
                    <li
                      key={item.name}
                      className="rounded-full bg-surface-inset px-3.5 py-1.5 text-sm font-medium text-content-secondary"
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-content-secondary">
        {INTEGRATIONS.note}
      </p>
    </Section>
  );
}
