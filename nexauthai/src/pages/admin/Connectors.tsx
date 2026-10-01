/**
 * Connector management and the field-mapping viewer.
 *
 * The submission flow genuinely routes through these adapters, so testing a
 * connection here calls the same `test()` method the waterfall calls — the
 * state shown is the adapter's real answer, not a decorative badge.
 */

import { ArrowLeft, Check, Plug, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingBlock,
  PageHeader,
  TableWrap,
  Tabs,
  Td,
  Th,
} from "@/components/ui";
import { dateTime, latency, percent, relative } from "@/lib/format";
import { connectors } from "@/mocks";
import { adminService } from "@/services/adminService";
import type { ConnectorInstance, ConnectorMapping } from "@/types";
import type { HealthResult } from "@/connectors/types";

const STATE_TONE = {
  active: "accent",
  degraded: "signal",
  failed: "danger",
  "refresh-failed": "danger",
  expired: "danger",
  disconnected: "neutral",
  configuring: "brand",
} as const;

const KIND_LABEL = {
  ehr: "EHR",
  payer: "Payer",
  clearinghouse: "Clearinghouse",
  voice: "Voice",
  document: "Documents",
  fax: "Fax",
} as const;

/* ------------------------------------------------------------------ *
 * List
 * ------------------------------------------------------------------ */

export default function AdminConnectors() {
  const [instances, setInstances] = useState<ConnectorInstance[] | null>(null);
  const [tab, setTab] = useState<"connections" | "registry">("connections");

  useEffect(() => {
    let active = true;
    adminService.listInstances().then((rows) => active && setInstances(rows));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Connectors"
        description="One unified internal contract; a pluggable adapter behind it for each EHR and payer. Adding a payer is a new adapter, never a change to the engine."
      />

      <Card>
        <div className="px-4 pt-1">
          <Tabs
            label="Connector views"
            active={tab}
            onChange={setTab}
            tabs={[
              { id: "connections", label: "Connections", count: instances?.length },
              { id: "registry", label: "Registry", count: connectors.length },
            ]}
          />
        </div>

        {tab === "connections" &&
          (!instances ? (
            <LoadingBlock label="Loading connections" />
          ) : (
            <TableWrap>
              <caption className="sr-only">Configured connections</caption>
              <thead>
                <tr>
                  <Th>Connection</Th>
                  <Th>Kind</Th>
                  <Th>State</Th>
                  <Th>Last sync</Th>
                  <Th>Success</Th>
                  <Th>Latency</Th>
                  <Th>Errors</Th>
                </tr>
              </thead>
              <tbody>
                {instances.map((i) => {
                  const c = connectors.find((x) => x.id === i.connectorId);
                  return (
                    <tr key={i.id} className="transition-colors hover:bg-surface-inset/60">
                      <Td>
                        <Link
                          to={`/admin/connectors/${i.id}`}
                          className="text-sm font-medium text-content-brand hover:underline"
                        >
                          {i.label}
                        </Link>
                        <span className="block text-xs text-content-muted">{i.environment}</span>
                      </Td>
                      <Td>
                        <Badge tone="neutral">{c ? KIND_LABEL[c.kind] : "—"}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={STATE_TONE[i.state]} dot>
                          {i.state.replace("-", " ")}
                        </Badge>
                      </Td>
                      <Td className="whitespace-nowrap text-xs text-content-muted">
                        {i.lastSyncAt ? relative(i.lastSyncAt) : "never"}
                      </Td>
                      <Td className="tabular-nums text-xs text-content">
                        {percent(i.successRate, 1)}
                      </Td>
                      <Td className="tabular-nums text-xs text-content-muted">
                        {latency(i.avgLatencyMs)}
                      </Td>
                      <Td>
                        {i.errors.length > 0 ? (
                          <Badge tone="danger">{i.errors.length}</Badge>
                        ) : (
                          <span className="text-xs text-content-muted">—</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          ))}

        {tab === "registry" && (
          <ul className="divide-y divide-line-subtle">
            {connectors.map((c) => (
              <li key={c.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-inset text-xs font-bold text-content-secondary"
                      aria-hidden
                    >
                      {c.logoInitials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-content">{c.name}</p>
                      <p className="text-xs text-content-muted">
                        {c.vendor} · v{c.version} · {KIND_LABEL[c.kind]}
                      </p>
                    </div>
                  </div>
                  <Badge tone="neutral">~{c.onboardingDays} days to onboard</Badge>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                  {c.description}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {c.standards.map((s) => (
                    <Badge key={s} tone="brand">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded bg-surface-inset px-1.5 py-0.5 font-mono text-[10px] text-content-muted"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Detail
 * ------------------------------------------------------------------ */

export function ConnectorDetail() {
  const { id = "" } = useParams();
  const [instance, setInstance] = useState<ConnectorInstance | null>(null);
  const [mapping, setMapping] = useState<ConnectorMapping | null>(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    adminService.getInstance(id).then(async (inst) => {
      if (!active || !inst) return;
      setInstance(inst);
      if (inst.mappingId) {
        const m = await adminService.getMapping(inst.mappingId);
        if (active) setMapping(m ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(load, [load]);

  if (!instance) {
    return (
      <Card>
        <LoadingBlock label="Loading connection" />
      </Card>
    );
  }

  const connector = connectors.find((c) => c.id === instance.connectorId);

  const runTest = async () => {
    setBusy("test");
    setHealth(null);
    try {
      const result = await adminService.testConnection(instance.id);
      setHealth(result);
      load();
    } finally {
      setBusy(null);
    }
  };

  const reconnect = async () => {
    setBusy("reconnect");
    try {
      await adminService.reconnect(instance.id);
      setHealth(null);
      load();
    } finally {
      setBusy(null);
    }
  };

  const needsReconnect = ["refresh-failed", "expired", "disconnected", "failed"].includes(
    instance.state,
  );

  return (
    <>
      <Link
        to="/admin/connectors"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-content-brand hover:underline"
      >
        <ArrowLeft size={15} aria-hidden />
        All connectors
      </Link>

      <PageHeader
        eyebrow={connector ? KIND_LABEL[connector.kind] : "Connector"}
        title={instance.label}
        description={connector?.description}
        actions={
          <>
            <Button loading={busy === "test"} onClick={runTest}>
              Test connection
            </Button>
            {needsReconnect && (
              <Button
                variant="primary"
                icon={<RefreshCw size={15} />}
                loading={busy === "reconnect"}
                onClick={reconnect}
              >
                Reconnect
              </Button>
            )}
          </>
        }
      />

      {health && (
        <Callout
          tone={health.healthy ? "accent" : "danger"}
          icon={health.healthy ? <Check size={15} /> : <X size={15} />}
          title={health.healthy ? "Connection healthy" : "Connection failed"}
        >
          <p className="text-xs leading-relaxed">{health.message}</p>
          <p className="mt-1 text-xs opacity-80">
            Checked {dateTime(health.checkedAt)} · {latency(health.latencyMs)}
            {health.errorCode && ` · ${health.errorCode}`}
          </p>
        </Callout>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Health" />
          <CardBody>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              {[
                ["State", <Badge key="s" tone={STATE_TONE[instance.state]} dot>{instance.state.replace("-", " ")}</Badge>],
                ["Environment", instance.environment],
                ["Success rate (24h)", percent(instance.successRate, 1)],
                ["Requests (24h)", instance.requestsLast24h.toLocaleString()],
                ["Average latency", latency(instance.avgLatencyMs)],
                ["Last sync", instance.lastSyncAt ? dateTime(instance.lastSyncAt) : "never"],
                ["Last tested", instance.lastTestedAt ? dateTime(instance.lastTestedAt) : "never"],
                ["Credential", <code key="c" className="font-mono text-xs">{instance.credentialRef}</code>],
                ["Contract version", connector?.version ?? "—"],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs font-medium text-content-muted">{label}</dt>
                  <dd className="mt-0.5 text-sm text-content">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 border-t border-line-subtle pt-3 text-xs leading-relaxed text-content-muted">
              The credential itself never leaves the vault — only this reference
              travels. A connection is stateful on purpose: one that worked
              yesterday can stop working today, and the system acts on state
              rather than on whether an authorization flow once completed.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader icon={<Plug size={16} />} title="Capabilities" />
          <CardBody>
            {connector && (
              <>
                <ul className="space-y-1.5">
                  {connector.capabilities.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-content">
                      <Check size={13} className="text-tint-accent-on" aria-hidden />
                      <code className="font-mono text-xs">{c}</code>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-line-subtle pt-3">
                  <p className="mb-1.5 text-xs font-semibold text-content-muted">Standards</p>
                  <div className="flex flex-wrap gap-1.5">
                    {connector.standards.map((s) => (
                      <Badge key={s} tone="brand">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="mt-4 border-t border-line-subtle pt-3">
                  <p className="mb-1.5 text-xs font-semibold text-content-muted">Interfaces</p>
                  <div className="flex flex-wrap gap-1.5">
                    {connector.interfaces.map((s) => (
                      <Badge key={s} tone="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {instance.errors.length > 0 && (
        <Card className="mt-5">
          <CardHeader
            title="Error log"
            description="Native errors mapped to the shared taxonomy, so the waterfall can decide what to do without knowing the vendor."
          />
          <ul className="divide-y divide-line-subtle">
            {instance.errors.map((e) => (
              <li key={e.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <code className="font-mono text-xs font-semibold text-content-danger">
                      {e.code}
                    </code>
                    <Badge tone="neutral">{e.operation}</Badge>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-content-muted">
                    {e.occurrences}× · {relative(e.at)}
                    {e.retryable ? (
                      <Badge tone="signal">retryable</Badge>
                    ) : (
                      <Badge tone="danger">not retryable</Badge>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-content-secondary">{e.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader
          title="Field mapping"
          description="How this source's representation translates into the canonical FHIR-based model. Read-only here; mappings are versioned and changed through a release."
          action={mapping && <Badge tone="neutral">v{mapping.version}</Badge>}
        />
        {!mapping ? (
          <EmptyState
            title="No field mapping"
            description="This connector does not translate a source schema — it speaks the canonical model natively."
          />
        ) : (
          <TableWrap>
            <caption className="sr-only">Field mappings</caption>
            <thead>
              <tr>
                <Th>Source path</Th>
                <Th>Canonical target</Th>
                <Th>Transform</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {mapping.fields.map((f) => (
                <tr key={f.id}>
                  <Td>
                    <code className="font-mono text-xs text-content">{f.sourcePath}</code>
                    <span className="mt-0.5 block text-xs text-content-muted">{f.sourceSystem}</span>
                  </Td>
                  <Td>
                    <code className="font-mono text-xs text-content">{f.targetPath}</code>
                    {f.required && (
                      <Badge tone="neutral" className="ml-2">
                        required
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    {f.transform ? (
                      <code className="font-mono text-xs text-content-brand">{f.transform}</code>
                    ) : (
                      <span className="text-xs text-content-muted">direct</span>
                    )}
                    {f.codeSystemFrom && (
                      <span className="mt-0.5 block text-xs text-content-muted">
                        {f.codeSystemFrom} → {f.codeSystemTo}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        f.status === "mapped"
                          ? "accent"
                          : f.status === "needs-review"
                            ? "signal"
                            : "danger"
                      }
                    >
                      {f.status.replace("-", " ")}
                    </Badge>
                    {f.notes && (
                      <span className="mt-1 block max-w-[20rem] text-xs leading-relaxed text-content-muted">
                        {f.notes}
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
