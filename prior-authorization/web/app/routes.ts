import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("prior-authorization-software", "routes/prior-authorization-software.tsx"),
  // Permanent redirect from the pre-rename slug.
  route("solutions", "routes/solutions.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("about", "routes/about.tsx"),
  route("contact", "routes/contact.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("hipaa", "routes/hipaa.tsx"),
  route("sitemap.xml", "routes/sitemap.xml.ts"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
