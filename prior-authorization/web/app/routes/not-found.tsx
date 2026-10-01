import { Button } from "~/components/ui/Button";
import { Container } from "~/components/ui/Container";
import { MAIN_NAV } from "~/content/site";
import { seo } from "~/lib/seo";

export function meta() {
  return [
    ...seo({
      title: "Page not found",
      description: "That page has moved or never existed.",
      path: "/404",
    }),
    { name: "robots", content: "noindex" },
  ];
}

export default function NotFoundRoute() {
  return (
    <Container size="narrow" className="pb-28 pt-16 text-center">
      <p className="font-mono text-sm font-semibold tracking-[0.12em] text-content-brand">
        404
      </p>
      <h1 className="type-display mt-4 text-display-sm">This page is not here.</h1>
      <p className="mt-4 text-lg text-content-secondary">
        The link may be out of date. Everything else is one click away.
      </p>
      <ul className="mt-8 flex flex-wrap justify-center gap-2">
        {MAIN_NAV.map((item) => (
          <li key={item.label}>
            <Button to={item.to} variant="secondary" size="sm">
              {item.label}
            </Button>
          </li>
        ))}
      </ul>
      <Button to="/" size="lg" className="mt-8">
        Back to home
      </Button>
    </Container>
  );
}
