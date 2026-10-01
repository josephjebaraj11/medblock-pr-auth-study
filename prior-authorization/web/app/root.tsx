import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { ReactNode } from "react";

import { Footer } from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { Button } from "~/components/ui/Button";
import { Container } from "~/components/ui/Container";
import { SITE } from "~/content/site";
import { withBase } from "~/lib/base-url";
import { organizationGraph } from "~/lib/structured-data";
import { THEME_INIT_SCRIPT } from "~/lib/theme";

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  // Fonts are self-hosted (see app/fonts.css). Preloading the two latin faces
  // starts them in parallel with the stylesheet rather than after it.
  {
    rel: "preload",
    href: withBase("/fonts/inter-latin.woff2"),
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: withBase("/fonts/source-serif-4-latin.woff2"),
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  { rel: "icon", href: withBase("/favicon.svg"), type: "image/svg+xml" },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FFFFFF" />
        <Meta />
        <Links />
        {/* Runs before first paint so the page never flashes the wrong theme.
            It touches only <html>, so it cannot desync hydration. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Site-wide identity. Per-route graphs reference this by @id rather
            than restating the organisation on every page. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationGraph()) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-surface-inverse focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let message =
    "An unexpected error interrupted this page. Try again, or get in touch if it keeps happening.";

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Page not found" : `${error.status} ${error.statusText}`;
    message =
      error.status === 404
        ? "That page has moved or never existed. The links below will get you back on track."
        : message;
  }

  return (
    <Container size="narrow" className="py-28 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-content-brand">
        {SITE.name}
      </p>
      <h1 className="type-display mt-4 text-display-sm">{title}</h1>
      <p className="mt-4 text-lg text-content-secondary">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/">Back to home</Button>
        <Button to="/contact" variant="secondary">
          Contact us
        </Button>
      </div>
    </Container>
  );
}
