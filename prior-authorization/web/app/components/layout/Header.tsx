import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";

import { Logo } from "~/components/brand/Logo";
import { Button } from "~/components/ui/Button";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { Container } from "~/components/ui/Container";
import { MAIN_NAV, SITE } from "~/content/site";
import { cn } from "~/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route or hash changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled || menuOpen
          ? "border-line bg-surface/90 backdrop-blur-md"
          : "border-transparent bg-surface/60 backdrop-blur-sm",
      )}
    >
      <Container size="wide">
        <div className="flex h-18 items-center justify-between gap-6 py-4">
          <Link
            to="/"
            aria-label={`${SITE.name} — home`}
            className="rounded-lg text-content transition-opacity hover:opacity-80"
          >
            <Logo title={null} />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {MAIN_NAV.map((item) => (
                <li key={item.label}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors",
                        isActive && !item.to.includes("#")
                          ? "text-content-brand"
                          : "text-content-secondary hover:bg-surface-inset hover:text-content",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <Button to="/contact" size="md">
              {SITE.demoCta}
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-content-secondary ring-1 ring-line lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            {menuOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </Container>

      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="border-t border-line bg-surface lg:hidden"
      >
        <Container size="wide">
          <nav aria-label="Mobile" className="py-4">
            <ul className="flex flex-col gap-1">
              {MAIN_NAV.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="block rounded-xl px-3 py-3 text-base font-medium text-content-secondary hover:bg-surface-inset"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Button to="/contact" size="lg" className="mt-4 w-full">
              {SITE.demoCta}
            </Button>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
              <span className="text-sm font-medium text-content-secondary">Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </Container>
      </div>
    </header>
  );
}
