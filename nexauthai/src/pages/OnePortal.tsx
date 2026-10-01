/**
 * "How this portal works" — the one-portal statement, in the product.
 *
 * This page exists because the single most load-bearing architectural claim
 * is also the easiest one to lose in a demo: there is exactly one
 * application. Every tenant and every persona signs into the same portal at
 * the same URL, and what differs is the token, never the deployment.
 *
 * It is reachable from every persona's navigation on purpose.
 */

import {
  Bell,
  Building2,
  CreditCard,
  KeyRound,
  Layers,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Callout, Card, CardBody, CardHeader, PageHeader, Td, TableWrap, Th } from "@/components/ui";
import { useSession } from "@/lib/session";
import { roles, tenants } from "@/mocks";

export default function OnePortal() {
  const { role, can } = useSession();

  return (
    <>
      <PageHeader
        eyebrow="How this works"
        title="One portal"
        description="One application serves every tenant and every persona. Nothing about it is cloned per practice or per role."
      />

      <Callout tone="brand" icon={<Layers size={16} />} title="There is only one portal">
        <p>
          Every practice on the platform and every person inside it signs into
          the <strong>same application at the same address</strong>. There is no
          separate build per customer, no separate app per persona, and no
          separate operator console. A Keycloak token carries a tenant and a
          set of scopes; the navigation, the screens and the rows each API call
          returns are all derived from it.
        </p>
        <p className="mt-2">
          Multi-tenancy and multi-persona are therefore the <em>same</em>{" "}
          mechanism seen from two angles — <code>tenant_id</code> decides
          <em> whose</em> data you see, scopes decide <em>what</em> you may do
          with it, and both are checked server-side on every request.
        </p>
      </Callout>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* ------------------------------ tenants ------------------------------ */}
        <Card>
          <CardHeader
            title="Many tenants, one deployment"
            description="A tenant is a practice. Isolation is enforced three times over, and none of it is a second portal."
          />
          <CardBody className="space-y-3">
            <ul className="space-y-2.5 text-sm leading-relaxed text-content-secondary">
              <li className="flex gap-2.5">
                <KeyRound size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden />
                <span>
                  <strong className="text-content">One Keycloak realm per tenant.</strong> Identity,
                  roles and sessions are tenant-scoped by construction, so a user in one practice
                  cannot be authorized into another.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Building2 size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden />
                <span>
                  <strong className="text-content">
                    <code className="font-mono text-xs">tenant_id</code> on every row,
                  </strong>{" "}
                  first in every primary key and index, taken from the token and never from the URL.
                </span>
              </li>
              <li className="flex gap-2.5">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden />
                <span>
                  <strong className="text-content">PostgreSQL row-level security</strong> underneath,
                  so a query that forgets its tenant returns nothing rather than someone else's data.
                </span>
              </li>
            </ul>

            <p className="text-sm leading-relaxed text-content-secondary">
              A customer that requires its own infrastructure gets a dedicated
              or air-gapped deployment of this same codebase, with its own realm
              and its own keys. It is a deployment option, not a different
              product.
            </p>

            <TableWrap>
                <thead>
                  <tr>
                    <Th>Tenant</Th>
                    <Th>Deployment</Th>
                    <Th>Realm</Th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id}>
                      <Td className="font-medium text-content">{t.name}</Td>
                      <Td>
                        <Badge tone={t.deploymentMode === "multi-tenant" ? "neutral" : "aqua"}>
                          {t.deploymentMode}
                        </Badge>
                      </Td>
                      <Td className="font-mono text-xs">{t.health.realm}</Td>
                    </tr>
                  ))}
                </tbody>
            </TableWrap>
          </CardBody>
        </Card>

        {/* ------------------------------ personas ------------------------------ */}
        <Card>
          <CardHeader
            title="Three personas, one navigation"
            description="The sidebar you are looking at was filtered by your scopes. Nobody is sent to a different app."
          />
          <CardBody className="space-y-3">
            <ul className="space-y-3">
              {roles.map((r) => (
                <li
                  key={r.id}
                  className={`rounded-lg border px-3 py-2.5 ${
                    r.id === role?.id ? "border-brand-400 bg-tint-brand/40" : "border-line bg-surface-inset"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-content">
                      <Users size={15} className="text-content-muted" aria-hidden />
                      {r.label}
                      {r.id === role?.id && <Badge tone="brand">You</Badge>}
                    </span>
                    {r.canMakeClinicalDetermination && (
                      <Badge tone="accent">Licensed</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-content-secondary">{r.sees}</p>
                  <p className="mt-1.5 flex flex-wrap gap-1">
                    {r.scopes.map((sc) => (
                      <code
                        key={sc}
                        className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-content-muted"
                      >
                        {sc}
                      </code>
                    ))}
                  </p>
                </li>
              ))}
            </ul>

            <p className="text-sm leading-relaxed text-content-secondary">
              One person can hold more than one persona — a lean practice often
              has a manager who is both Operations and Admin — and the portal
              renders the <strong>union</strong> of their scopes. A lean persona
              set never forces extra headcount.
            </p>

            <p className="text-sm leading-relaxed text-content-secondary">
              <strong className="text-content">Admin covers both reaches.</strong>{" "}
              A tenant admin manages one practice; a platform admin manages every
              tenant and the shared connector registry. Same screens, same code,
              wider scope — and neither holds a PHI scope at all.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* ------------------------------ the rest ------------------------------ */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Notifications leave the portal; PHI does not"
            description="Two outbound channels, one payload rule."
          />
          <CardBody className="space-y-2.5 text-sm leading-relaxed text-content-secondary">
            <p className="flex gap-2.5">
              <Mail size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden />
              <span>
                <strong className="text-content">Email</strong> — transactional, for anything that
                can wait for an inbox.
              </span>
            </p>
            <p className="flex gap-2.5">
              <MonitorSmartphone size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden />
              <span>
                <strong className="text-content">Web push</strong> — a browser service worker, for
                anything that cannot.
              </span>
            </p>
            <p>
              Both are preference- and role-scoped, and both carry an ID and an
              event type and nothing else. A message says a case needs attention
              and links back here, where access is checked again. No patient
              name, no diagnosis, no procedure code ever sits in an inbox or a
              push message.
            </p>
            <p>
              <Link to="/notifications" className="font-semibold text-content-brand underline">
                Open the notification centre
              </Link>{" "}
              to see the delivery preferences.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Billing is per tenant, inside the same portal"
            description="A subscription, not a price per authorization."
          />
          <CardBody className="space-y-2.5 text-sm leading-relaxed text-content-secondary">
            <p className="flex gap-2.5">
              <CreditCard size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden />
              <span>
                A tiered <strong className="text-content">annual license</strong> priced on physician
                count, a <strong className="text-content">flat monthly</strong> managed-services and
                cloud fee, one-time onboarding and net-new integration charges, and variable
                pass-through usage a tenant can take itemised or folded in.
              </span>
            </p>
            <p>
              Stripe holds the money and the payment instrument; this portal
              holds the plan, the invoices and the usage behind them. Every
              pass-through line traces back to the transaction ledger, so
              &ldquo;612 voice minutes&rdquo; can be audited down to the exact
              cases that produced it.
            </p>
            {can("billing:manage") ? (
              <p>
                <Link to="/admin/billing" className="font-semibold text-content-brand underline">
                  Open billing
                </Link>
              </p>
            ) : (
              <p className="text-xs text-content-muted">
                Billing is an Admin screen. Your persona does not hold{" "}
                <code className="font-mono">billing:manage</code>, so it is not in your navigation —
                the same filtering you can see working everywhere else.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="What a request actually carries"
          description="The same two facts decide every call, on every screen."
        />
        <CardBody>
          <pre className="overflow-x-auto rounded-lg bg-surface-inset p-3.5 font-mono text-xs leading-relaxed text-content-secondary">
{`GET /v1/cases?status=needs-approval
Authorization: Bearer <keycloak jwt>

  tenant_id : t-northside        ← whose data (realm-bound, never from the URL)
  scopes    : request:read
              request:approve-submission
              queue:work          ← what you may do with it

→ API checks the scope, then Postgres RLS checks the tenant again.
  A missing scope is a 403. A wrong tenant is an empty result, not a leak.`}
          </pre>
          <p className="mt-3 flex items-center gap-2 text-xs text-content-muted">
            <Bell size={13} aria-hidden />
            In this prototype there is no real token — picking a persona on the
            sign-in screen stands in for one, and the service layer checks the
            same scopes the API would.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
