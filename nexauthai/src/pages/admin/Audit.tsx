/**
 * Audit log viewer.
 *
 * Append-only and hash-chained. There is deliberately no edit or delete
 * control anywhere on this page — the chain is verified on load and the
 * result is stated plainly rather than implied by a padlock icon.
 */

import { Check, Search, ShieldCheck, ShieldX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Callout,
  Card,
  CardHeader,
  EmptyState,
  LoadingBlock,
  PageHeader,
  inputClass,
} from "@/components/ui";
import { dateTime, latency } from "@/lib/format";
import { adminService } from "@/services/adminService";
import type { AuditEvent } from "@/types";

const ACTOR_TONE = {
  user: "brand",
  agent: "aqua",
  system: "neutral",
  payer: "signal",
} as const;

export default function AdminAudit() {
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [search, setSearch] = useState("");
  const [actorType, setActorType] = useState("");

  useEffect(() => {
    let active = true;
    adminService.listAudit().then((rows) => active && setEvents(rows));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let rows = events ?? [];
    if (actorType) rows = rows.filter((e) => e.actorType === actorType);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          e.targetId.toLowerCase().includes(q) ||
          (e.externalRef ?? "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [events, search, actorType]);

  const chain = adminService.verifyAuditChain();

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Audit log"
        description="Every action by a person, an agent, the system or a payer — with a timestamp, an actor and, where it left our boundary, a reference number."
      />

      <Callout
        tone={chain.valid ? "accent" : "danger"}
        icon={chain.valid ? <ShieldCheck size={15} /> : <ShieldX size={15} />}
        title={chain.valid ? "Hash chain intact" : "Hash chain broken"}
      >
        <p className="text-xs leading-relaxed">
          {chain.valid
            ? `All ${chain.checked} entries verify against the preceding entry's hash. Nothing has been removed or altered.`
            : `Verification failed at entry ${chain.brokenAt}. An entry has been removed or altered.`}
        </p>
      </Callout>

      <Card className="mt-5">
        <CardHeader
          title="Events"
          description={`${filtered.length} of ${events?.length ?? 0}`}
          action={
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <label htmlFor="audit-search" className="sr-only">
                  Search audit log
                </label>
                <Search
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted"
                  aria-hidden
                />
                <input
                  id="audit-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Action, actor, reference"
                  className={`${inputClass} w-56 pl-8`}
                />
              </div>
              <div>
                <label htmlFor="audit-actor" className="sr-only">
                  Filter by actor type
                </label>
                <select
                  id="audit-actor"
                  value={actorType}
                  onChange={(e) => setActorType(e.target.value)}
                  className={inputClass}
                >
                  <option value="">All actors</option>
                  <option value="user">People</option>
                  <option value="agent">Agents</option>
                  <option value="system">System</option>
                  <option value="payer">Payers</option>
                </select>
              </div>
            </div>
          }
        />

        {!events ? (
          <LoadingBlock label="Loading audit log" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching entries" description="Try a different search or filter." />
        ) : (
          <ol className="divide-y divide-line-subtle">
            {filtered.map((e) => (
              <li key={e.id} className="px-4 py-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-xs font-semibold text-content-brand">
                      {e.action}
                    </code>
                    <Badge tone={ACTOR_TONE[e.actorType]}>{e.actorType}</Badge>
                  </span>
                  <span className="whitespace-nowrap text-xs text-content-muted">
                    {dateTime(e.at)}
                  </span>
                </div>

                <p className="mt-1 text-sm leading-relaxed text-content">{e.summary}</p>

                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
                  <span className="font-medium text-content-secondary">{e.actorName}</span>
                  <span className="font-mono">
                    {e.targetType}/{e.targetId}
                  </span>
                  {e.externalRef && <span className="font-mono">ref {e.externalRef}</span>}
                  {typeof e.metadata?.latencyMs === "number" && (
                    <span>{latency(e.metadata.latencyMs)}</span>
                  )}
                </p>

                <p className="mt-1.5 flex items-center gap-1.5 break-all font-mono text-[10px] text-content-muted">
                  <Check size={10} className="shrink-0" aria-hidden />
                  {e.prevHash.slice(0, 12)}… → {e.hash.slice(0, 12)}…
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <p className="mt-4 text-xs leading-relaxed text-content-muted">
        There is no edit or delete control on this page, and there is none in the
        API either — the production table has UPDATE and DELETE revoked from the
        application role. HIPAA documentation retention is commonly six years;
        confirm the actual period with counsel.
      </p>
    </>
  );
}
