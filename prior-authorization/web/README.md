# Nexauth AI — marketing site

Production-ready marketing website for **Nexauth AI**, an AI prior-authorization
platform for medical practices.

The logo is an N monogram set in a hexagonal node — the hexagon reads as a hub
and carries the "nex-" in the name, and the N's right stem finishes above its
left so the letterform lifts. It ships as `<Logo />` (mark + wordmark) and
`<Logo variant="icon" />`, with the same geometry in `public/favicon.svg`. Prerendered React Router 7 app, styled with
Tailwind CSS 3.

> Content note: copy, statistics attribution, pricing and testimonials are
> written as realistic placeholder marketing content. Replace the pricing,
> testimonials and compliance claims with your own verified facts before
> publishing.

## Requirements

- Node.js >= 20.19 (Vite 7 requirement)
- npm 10+

## Setup

```bash
npm install
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with HMR at http://localhost:5173 |
| `npm run build` | Prerender every route into static files in `build/client/` |
| `npm run preview` | Serve `build/client/` locally at http://localhost:4173 |
| `npm run typecheck` | Generate route types, then run `tsc --noEmit` |
| `npm run lint` | ESLint 9 flat config, zero warnings tolerated |
| `npm run lint:fix` | ESLint with `--fix` |

## Stack

- **React 19** + **React Router 7** in framework mode (routes declared in `app/routes.ts`)
- **Vite 7** build pipeline
- **TypeScript 5.6**, `strict` plus `noUncheckedIndexedAccess` and `noUnusedLocals`
- **Tailwind CSS 3** with a token-only palette in `tailwind.config.ts`
- `clsx` + `tailwind-merge` behind a `cn()` helper in `app/lib/utils.ts`
- **ESLint 9** flat config with typescript-eslint, react-hooks and jsx-a11y
- `lucide-react` icons

## Structure

```
app/
├── root.tsx                 # HTML document, header/footer shell, error boundary
├── routes.ts                # Route configuration
├── app.css                  # Tailwind layers + base/focus/reduced-motion rules
├── components/
│   ├── backgrounds/         # Animated decorative SVG backgrounds
│   │   ├── VitalsLine.tsx   # ECG trace with a sweeping pulse (hero)
│   │   ├── AuthFlowMesh.tsx # Documents → assembly → approval (dark section)
│   │   └── PulseRings.tsx   # Expanding approval rings (CTA)
│   ├── brand/Logo.tsx       # <Logo /> — full (mark + wordmark) and icon-only
│   ├── layout/              # Header (sticky, mobile menu), Footer
│   ├── ui/                  # Button, Container, Section, Card, Badge,
│   │                        # SectionHeading, Reveal, Accordion, Field, Icon
│   ├── forms/DemoForm.tsx   # Contact/demo form, client-side validation
│   └── sections/            # Home page sections + shared LegalPage
├── content/                 # Typed page content, no JSX
│   ├── site.ts  home.ts  solutions.ts  about.ts  contact.ts  legal.ts
│   └── icons.ts             # IconName union consumed by <Icon />
├── lib/
│   ├── utils.ts             # cn()
│   └── seo.ts               # seo() — title, description, canonical, OG, Twitter
└── routes/                  # home, solutions, about, contact, privacy, hipaa, not-found
```

Page copy lives in `app/content/*` as typed data and is rendered by the
components in `app/components/sections/*`. To change wording, edit the content
files — not the components.

## Routes

| Path | Module |
|---|---|
| `/` | `app/routes/home.tsx` |
| `/solutions` | `app/routes/solutions.tsx` |
| `/about` | `app/routes/about.tsx` |
| `/contact` | `app/routes/contact.tsx` |
| `/privacy` | `app/routes/privacy.tsx` |
| `/hipaa` | `app/routes/hipaa.tsx` |
| `*` | `app/routes/not-found.tsx` (returns HTTP 404) |

Each route exports `meta` built from `seo()` in `app/lib/seo.ts`.

## Theming

Light and dark, with a three-way control (Light / Dark / System) in the header
and in the mobile menu.

**Light is the default.** A visitor who has not chosen gets the light theme
regardless of their OS setting; `prefers-color-scheme` is consulted only once
someone explicitly picks *System*, which then also tracks live OS changes.
`DEFAULT_THEME` in `app/lib/theme.ts` is the single place that decides this.

- **No flash.** A small script in `<head>` (`THEME_INIT_SCRIPT` in
  `app/lib/theme.ts`) sets the class on `<html>` before first paint. It touches
  only `documentElement`, never server-rendered markup, so it cannot desync
  hydration.
- **One shared store.** The toggle is mounted twice, so the selection lives in a
  module-level store consumed through `useSyncExternalStore`. The server
  snapshot is `null` — nothing selected on the server or the first client
  render — and the real value arrives in an effect.
- **Persistence.** Every choice is written to `localStorage`, *System*
  included — an absent value now means "has not chosen" and resolves to light,
  so *System* has to be recorded explicitly to survive a reload. All storage
  access is wrapped in `try/catch`, since it throws in private mode and when
  site data is blocked.
- **`theme-color`** is kept in step so the browser chrome matches.

### How theming is implemented

Semantic CSS variables in `app/app.css`, surfaced as Tailwind colours. A theme
swap is a change of ~20 variables rather than a `dark:` variant on every utility
in the codebase — components reference `bg-surface-raised` and `text-content`,
not `bg-white` and `text-ink-900`.

| Token | Use |
|---|---|
| `surface`, `surface-subtle`, `surface-raised`, `surface-inset`, `surface-mint` | Page, section band, card, inset chip, mint band |
| `surface-inverse` | Panels that stay dark in **both** themes (footer, appeals section, featured plan) |
| `content`, `content-secondary`, `content-muted` | Heading, body, caption |
| `content-brand`, `content-danger` | Brand and error text on a page surface |
| `line`, `line-subtle` | Borders and rings |
| `tint-*` / `tint-*-on` | Soft colour washes and the text that sits on them |

`dark:` variants are used only where a swap genuinely isn't expressible as a
token — decorative gradients, and the featured pricing card, which relies on
being a dark panel in light mode and so needs a brand tint in dark mode instead.

## Design tokens

All colours are named tokens in `tailwind.config.ts`; components never use raw
hex values.

- `brand` — medical blue, primary UI and links
- `aqua` — secondary teal, gradients and supporting accents
- `accent` — the "greenlight" green, reserved for approval states and CTAs
- `ink` — text and dark surfaces
- `mint` — soft supporting surfaces
- `signal` — warnings and form errors only

## Typography

Two faces, with a deliberate division of labour:

- **Inter** — everything functional: body copy, card headings, nav, buttons,
  labels, form controls, stats, badges.
- **Source Serif 4** — the editorial layer, applied through the single
  `.type-display` component class in `app/app.css`: page titles (`h1`), section
  titles (`h2`), and pull quotes. Nothing else.

The point is that the switch between them *means* something. A serif section
title against Inter body copy makes the hierarchy legible before anyone reads a
word; a serif applied everywhere would just be decoration. The split is
enforced by keeping `.type-display` opt-in rather than styling `h1, h2`
globally — several `h2` elements (footer column headings, "On this page",
"Sources") are utility labels and correctly stay in Inter.

Measured across the built site: the serif lands on 37 of 790 text-bearing
elements — 4.7%.

The `display-*` font sizes in `tailwind.config.ts` carry tracking tuned for the
serif, since those sizes are only ever used by `.type-display` headings; a
grotesque wants noticeably tighter spacing than a serif at the same size.

Both families load from Google Fonts in `app/root.tsx` with `display=swap`.

## Animated backgrounds

Four abstract, motion-bearing backgrounds carry the healthcare and prior-auth
theme. All are inline SVG or CSS gradients — no raster assets, no stock photos,
nothing to download.

| Where | What it shows |
|---|---|
| Hero | A cardiac trace with a brighter pulse sweeping along it, like a bedside monitor refreshing |
| How it works | Dashes marching along the step rail — the request moving between stages |
| Appeals (dark) | Documents leaving the practice, assembled at hubs, returning as approvals, with packets flowing along each link |
| Closing CTA | Concentric rings expanding on a slow beat — an approval propagating |

Each one is `aria-hidden` and `pointer-events-none`, sits behind content, and
stops animating under `prefers-reduced-motion` while keeping a sensible static
appearance. The appeals mesh is masked so its links dim behind the body copy.
Animation timings live in `tailwind.config.ts` alongside the colour tokens.

## SEO

| Surface | Where |
|---|---|
| Per-route title, description, canonical, OG + Twitter | `app/lib/seo.ts` |
| `og:image` (1200×630) | `public/og-image.png` |
| JSON-LD builders | `app/lib/structured-data.ts` |
| Organization + WebSite graph (site-wide) | `app/root.tsx` |
| `sitemap.xml` | `app/routes/sitemap.xml.ts`, generated from `SITEMAP_ROUTES` |
| `robots.txt` | `public/robots.txt` |
| Self-hosted fonts | `app/fonts.css`, `public/fonts/` |

Structured data is emitted through React Router's `meta` export using the
`script:ld+json` descriptor, so each route ships only the graph that describes
it and references the site-wide `Organization` by `@id` rather than restating
it. `FAQPage` is built from the same `FAQS` data the page renders, so the markup
can never describe an answer a visitor cannot see.

The sitemap is generated from `SITEMAP_ROUTES` in `app/content/site.ts` at
request time rather than kept as a static file, so it cannot drift from the
routes that exist.

`robots.txt` admits `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`
and friends **deliberately** — a model cannot cite a site it is not allowed to
read. Revisit that trade-off if the goal changes.

Fonts are self-hosted as variable `woff2` (one file per family covers the whole
weight axis), which removes a third-party DNS lookup, connection and round trip
from the critical path. Verified: the page makes zero third-party requests.

### Redirects

`/solutions` → `/prior-authorization-software` (301). The old slug was a
category nobody searches; the redirect preserves any links it had picked up.

## Accessibility

Verified against the built site:

- Every text/background pairing on all six pages meets WCAG 2.1 AA contrast
  (4.5:1 body, 3:1 large text) **in both light and dark themes**, including
  gradient backgrounds and expanded accordion panels
- The theme control is a labelled `radiogroup`; both mounted instances stay in
  sync and report exactly one selection
- Semantic landmarks, exactly one `<h1>` per page, labelled sections
- Skip-to-content link as the first tab stop
- Visible focus rings everywhere, with a dark-surface variant
- Accordion and mobile menu driven by `aria-expanded` / `aria-controls`;
  Escape closes the menu
- Form errors announced via an `role="alert"` summary that receives focus, with
  `aria-invalid` and `aria-describedby` on each field
- Decorative icons and illustrations are `aria-hidden`, with text alternatives
- Animations are suppressed under `prefers-reduced-motion` (verified: every
  animated layer drops to a 1µs duration), and all decorative background layers
  sit inside `aria-hidden` subtrees

## Notes

- The contact form has no backend. Valid submissions render a success state;
  `app/components/forms/DemoForm.tsx` marks where a real POST would go.
- Every route is prerendered to a flat `.html` file at build time, so each page
  is served at exactly the URL its canonical tag points at, with no
  trailing-slash redirect. Routes are listed in `prerender` in
  `react-router.config.ts`; a new page must be added there to get a file.
- `.github/workflows/deploy.yml` force-pushes `build/client/` to the `gh-pages`
  branch on every push to `main` that touches `web/`; Pages must be set to
  "Deploy from a branch" with `gh-pages` / root. (The `actions/deploy-pages`
  route needs a Pages API token this repo's runner is not granted.) Because a
  project site lives at
  `/<repo>/`, CI builds with `BASE_PATH=/<repo>/`; `react-router.config.ts`
  feeds that to both the router `basename` and Vite's `base`, and its
  `buildEnd` hook flattens the output into a Pages-shaped tree. Paths written
  as plain strings (a `<link href>`, a meta refresh) need `withBase()` from
  `app/lib/base-url.ts` — `<Link>` and imported assets are handled for you.
- Point a custom domain at the site and the prefix goes away: drop the
  `BASE_PATH` env from the workflow and add a `web/public/CNAME` file.
