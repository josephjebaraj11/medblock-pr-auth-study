import { Activity, Plug, ScrollText, ShieldAlert, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Callout,
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
  PageHeader,
  Stat,
} from "@/components/ui";
import { dateTime, percent, relative } from "@/lib/format";
import { adminService } from "@/services/adminService";
import { connectors } from "@/mocks";
import type { AuditEvent, ConnectorInstance, Tenant } from "@/types";

const STATE_TONE = {
  active: "accent",
  degraded: "signal",
  failed: "danger",
  "refresh-failed": "danger",
  expired: "danger",
  disconnected: "neutral",
  configuring: "brand",
} as const;

export default function AdminOverview() {
  const [instances, setInstances] = useState<ConnectorInstance[] | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminService.listInstances(),
      adminService.listTenants(),
      adminService.listAudit(),
    ]).then(([inst, ten, aud]) => {
      if (!active) return;
      setInstances(inst);
      setTenants(ten);
      setAudit(aud.slice(0, 8));
    });
    return () => {
      active = false;
    };
  }, []);

  const unhealthy = (instances ?? []).filter((i) =>
    ["failed", "refresh-failed", "expired", "disconnected"].includes(i.state),
  );
  const chain = adminService.verifyAuditChain();

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Platform overview"
        description="Connectors, tenants, rules and the audit trail. This role never sees clinical detail."
      />

      {unhealthy.length > 0 && (
        <Callout
          tone="danger"
          icon={<ShieldAlert size={15} />}
          title={`${unhealthy.length} connection${unhealthy.length === 1 ? "" : "s"} need attention`}
        >
          <p className="text-xs leading-relaxed">
            A connection that worked yesterday can quietly stop working today.
            Acting on connection state — rather than on whether an authorization
            flow once completed — is what keeps that visible.{" "}
            <Link to="/admin/connectors" className="font-semibold underline">
              Open connectors
            </Link>
            .
          </p>
        </Callout>
      )}

      <div className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Connector types"
          value={connectors.length}
          hint="In the shared registry"
          to="/admin/connectors"
        />
        <Stat
          label="Live connections"
          value={instances?.filter((i) => i.state === "active").length ?? "—"}
          tone="accent"
          hint={`${unhealthy.length} unhealthy`}
        />
        <Stat label="Tenants" value={tenants.length} hint="Across all deployments" />
        <Stat
          label="Audit entries"
          value={chain.checked}
          tone={chain.valid ? "accent" : "danger"}
          hint={chain.valid ? "Hash chain intact" : `Chain broken at ${chain.brokenAt}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={<Plug size={16} />}
            title="Connection health"
            description="Per-tenant instances and their current state."
            action={
              <Link
                to="/admin/connectors"
                className="text-xs font-semibold text-content-brand hover:underline"
              >
                Manage
              </Link>
            }
          />
          {!instances ? (
            <LoadingBlock />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {instances.map((i) => {
                const connector = connectors.find((c) => c.id === i.connectorId);
                return (
                  <li key={i.id}>
                    <Link
                      to={`/admin/connectors/${i.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-inset/60"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded bg-surface-inset text-[10px] font-bold text-content-secondary"
                          aria-hidden
                        >
                          {connector?.logoInitials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-content">
                            {i.label}
                          </span>
                          <span className="block text-xs text-content-muted">
                            {connector?.kind} · {i.environment} ·{" "}
                            {i.lastSyncAt ? `synced ${relative(i.lastSyncAt)}` : "never synced"}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="hidden text-xs tabular-nums text-content-muted sm:inline">
                          {percent(i.successRate, 1)}
                        </span>
                        <Badge tone={STATE_TONE[i.state]} dot>
                          {i.state.replace("-", " ")}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader icon={<Activity size={16} />} title="Tenants" />
            <CardBody className="space-y-2.5">
              {tenants.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">{t.name}</p>
                    <p className="text-xs text-content-muted">
                      {t.kind} · {t.tier} · {t.deploymentMode} · {t.region}
                    </p>
                  </div>
                  <Badge tone={t.status === "active" ? "accent" : "signal"}>{t.status}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<ScrollText size={16} />}
              title="Recent activity"
              action={
                <Link
                  to="/admin/audit"
                  className="text-xs font-semibold text-content-brand hover:underline"
                >
                  Full log
                </Link>
              }
            />
            <CardBody className="space-y-3">
              {audit.map((e) => (
                <div key={e.id}>
                  <p className="font-mono text-xs font-semibold text-content-brand">{e.action}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-content-secondary">
                    {e.summary}
                  </p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {e.actorName} · {dateTime(e.at)}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<Users size={16} />} title="Quick links" />
            <CardBody className="space-y-2">
              {[
                ["/admin/connectors", "Connectors and field mappings"],
                ["/admin/payers", "Payers, rules and automation policy"],
                ["/admin/users", "Users and roles"],
                ["/admin/audit", "Audit log"],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="block rounded-lg border border-line px-3 py-2 text-sm text-content transition-colors hover:border-brand-300 hover:bg-tint-brand/40"
                >
                  {label}
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
