/**
 * Tenants.
 *
 * The screen that used to belong to a separate "master admin" console. It
 * lives in the same portal as everything else, and the only thing that
 * changes between a tenant admin and a platform admin is how many rows come
 * back — one, or all of them.
 *
 * Every column here is a count, a rate or a configuration value. There is no
 * PHI on this screen because the admin persona holds no PHI scope: a
 * platform admin can see that a tenant's exception rate is climbing, and
 * cannot see a single case behind it.
 */

import { Building2, Globe2, KeyRound, ShieldOff, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Badge,
  Callout,
  Card,
  CardHeader,
  LoadingBlock,
  PageHeader,
  Stat,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { useSession } from "@/lib/session";
import { adminService } from "@/services/adminService";
import type { Tenant } from "@/types";

const STATUS_TONE = {
  active: "accent",
  onboarding: "signal",
  suspended: "danger",
} as const;

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function AdminTenants() {
  const { user } = useSession();
  const [tenants, setTenants] = useState<Tenant[] | null>(null);

  const scope = user?.adminScope ?? "tenant";

  useEffect(() => {
    if (!user) return;
    let active = true;
    adminService.listTenants(scope, user.tenantId).then((rows) => {
      if (active) setTenants(rows);
    });
    return () => {
      active = false;
    };
  }, [user, scope]);

  const totals = (tenants ?? []).reduce(
    (acc, t) => ({
      physicians: acc.physicians + t.health.physicians,
      cases: acc.cases + t.health.casesLast30d,
      degraded: acc.degraded + t.health.connectionsDegraded,
    }),
    { physicians: 0, cases: 0, degraded: 0 },
  );

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Tenants"
        description={
          scope === "platform"
            ? "Every practice on the platform, in one list. Counts and rates only — this persona holds no PHI scope."
            : "Your practice. A platform admin sees this same screen with every tenant on it."
        }
        actions={
          <Badge tone={scope === "platform" ? "brand" : "neutral"} dot>
            {scope === "platform" ? "Platform reach" : "Tenant reach"}
          </Badge>
        }
      />

      <Callout tone="brand" icon={<ShieldOff size={15} />} title="No PHI on this screen">
        Tenant Admin and Master Admin are one persona with two reaches. Both
        manage configuration and oversight — users, rules, connections, billing
        and audit — and neither can open a case. Volume and exception rates are
        how a platform admin tells whether a tenant is healthy without ever
        seeing what is in it.
      </Callout>

      {!tenants ? (
        <Card className="mt-5">
          <LoadingBlock label="Loading tenants" />
        </Card>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Tenants" value={tenants.length} />
            <Stat label="Licensed physicians" value={totals.physicians} />
            <Stat label="Cases · last 30 days" value={totals.cases.toLocaleString()} />
            <Stat
              label="Connections degraded"
              value={totals.degraded}
              tone={totals.degraded ? "danger" : "accent"}
              to="/admin/connectors"
            />
          </div>

          <Card className="mt-5">
            <CardHeader
              title="All tenants"
              description="Isolation is a realm, a tenant_id and a row-level-security policy — never a second deployment."
            />
            <TableWrap>
                <thead>
                  <tr>
                    <Th>Tenant</Th>
                    <Th>Plan</Th>
                    <Th>Deployment</Th>
                    <Th>Primary EHR</Th>
                    <Th className="text-right">Physicians</Th>
                    <Th className="text-right">Cases 30d</Th>
                    <Th className="text-right">Touchless</Th>
                    <Th className="text-right">Exceptions</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id}>
                      <Td>
                        <span className="flex items-center gap-2">
                          <Building2 size={15} className="shrink-0 text-content-muted" aria-hidden />
                          <span>
                            <span className="block font-medium text-content">{t.name}</span>
                            <span className="block font-mono text-[11px] text-content-muted">
                              {t.id}
                            </span>
                          </span>
                        </span>
                      </Td>
                      <Td className="capitalize">{t.tier}</Td>
                      <Td>
                        <Badge tone={t.deploymentMode === "multi-tenant" ? "neutral" : "aqua"}>
                          {t.deploymentMode}
                        </Badge>
                      </Td>
                      <Td>{t.health.primaryEhr}</Td>
                      <Td className="text-right tabular-nums">{t.health.physicians}</Td>
                      <Td className="text-right tabular-nums">
                        {t.health.casesLast30d.toLocaleString()}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {t.status === "onboarding" ? "—" : pct(t.health.touchlessRate)}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {t.status === "onboarding" ? "—" : pct(t.health.exceptionRate)}
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[t.status]} dot>
                          {t.status}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
            </TableWrap>
          </Card>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="How each tenant is isolated"
                description="Three independent mechanisms, all inside one application."
              />
              <TableWrap>
                  <thead>
                    <tr>
                      <Th>Tenant</Th>
                      <Th>Keycloak realm</Th>
                      <Th>Region</Th>
                      <Th className="text-right">Users</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id}>
                        <Td className="font-medium text-content">{t.name}</Td>
                        <Td>
                          <span className="flex items-center gap-1.5 font-mono text-xs">
                            <KeyRound size={13} className="text-content-muted" aria-hidden />
                            {t.health.realm}
                          </span>
                        </Td>
                        <Td>
                          <span className="flex items-center gap-1.5 font-mono text-xs">
                            <Globe2 size={13} className="text-content-muted" aria-hidden />
                            {t.region}
                          </span>
                        </Td>
                        <Td className="text-right tabular-nums">
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={13} className="text-content-muted" aria-hidden />
                            {t.health.activeUsers}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
              </TableWrap>
            </Card>

            <Card>
              <CardHeader
                title="What that means in the request path"
                description="The same two checks run on every call, for every tenant."
              />
              <div className="px-4 pb-4">
                <ol className="space-y-2.5 text-sm leading-relaxed text-content-secondary">
                  <li>
                    <strong className="text-content">1 · Realm.</strong> The user authenticates
                    against their tenant's realm. A token issued by one realm is not accepted by
                    another, so cross-tenant access fails before any code runs.
                  </li>
                  <li>
                    <strong className="text-content">2 · Scope.</strong> The API checks the scope the
                    endpoint requires. A missing scope is a 403, whichever tenant you belong to.
                  </li>
                  <li>
                    <strong className="text-content">3 · Row-level security.</strong> Postgres filters
                    by <code className="font-mono text-xs">tenant_id</code> taken from the token, so
                    a query that forgets its tenant returns nothing instead of someone else's rows.
                  </li>
                  <li>
                    <strong className="text-content">Dedicated tier.</strong> Same code, same portal,
                    its own VPC and keys. Stillwater runs this way; it is a deployment choice, not a
                    different product.
                  </li>
                </ol>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
