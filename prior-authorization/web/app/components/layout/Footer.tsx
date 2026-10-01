import { Link } from "react-router";

import { Logo } from "~/components/brand/Logo";
import { Icon } from "~/components/ui/Icon";
import { Container } from "~/components/ui/Container";
import { COMPLIANCE_BADGES, FOOTER_NAV, SITE } from "~/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark bg-surface-inverse text-ink-300">
      <Container size="wide">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Link
              to="/"
              aria-label={`${SITE.name} — home`}
              className="inline-flex rounded-lg text-white"
            >
              <Logo title={null} />
            </Link>
            <p className="mt-5 leading-relaxed text-ink-400">{SITE.description}</p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-aqua-300 hover:text-aqua-200"
            >
              <Icon name="mail" className="h-4 w-4" />
              {SITE.email}
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {FOOTER_NAV.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-white">
                  {column.title}
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-ink-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 py-8 lg:flex-row lg:items-center lg:justify-between">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {COMPLIANCE_BADGES.map((badge) => (
              <li
                key={badge.label}
                className="inline-flex items-center gap-2 text-xs font-medium text-ink-400"
              >
                <Icon name={badge.icon} className="h-4 w-4 text-accent-400" />
                {badge.label}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-400">
            © {year} {SITE.name}. All rights reserved. {SITE.name} supports clinical
            decisions; it does not make them.
          </p>
        </div>
      </Container>
    </footer>
  );
}
