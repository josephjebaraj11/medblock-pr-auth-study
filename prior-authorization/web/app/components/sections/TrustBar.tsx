import { Container } from "~/components/ui/Container";
import { Icon } from "~/components/ui/Icon";
import { COMPLIANCE_BADGES } from "~/content/site";
import { INTEGRATIONS } from "~/content/home";

export function TrustBar() {
  const names = INTEGRATIONS.items.map((item) => item.name);

  return (
    <section aria-label="Compatibility and compliance" className="border-y border-line/70 bg-surface-raised py-10">
      <Container size="wide">
        <p className="text-center text-sm font-medium text-content-muted">
          Connects to the systems and standards your practice already runs on
        </p>

        {/* Decorative marquee; the same names are listed accessibly in the
            integrations section further down the page. */}
        <div aria-hidden="true" className="mask-fade-x mt-6 overflow-hidden">
          <div className="flex w-max animate-marquee gap-10 motion-reduce:animate-none">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center gap-10">
                {names.map((name) => (
                  <li
                    key={`${copy}-${name}`}
                    className="whitespace-nowrap text-base font-semibold tracking-tight text-content-muted"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {COMPLIANCE_BADGES.map((badge) => (
            <li
              key={badge.label}
              className="inline-flex items-center gap-2 text-sm font-medium text-content-secondary"
            >
              <Icon name={badge.icon} className="h-4 w-4 text-accent-600" />
              {badge.label}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
