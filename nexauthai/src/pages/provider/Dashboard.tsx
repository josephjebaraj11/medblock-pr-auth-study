import { AlertTriangle, ArrowRight, Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RequestTable } from "@/components/case";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
  PageHeader,
  Stat,
} from "@/components/ui";
import { CHANNEL_LABEL, durationHours, percent, relative } from "@/lib/format";
import { useSession } from "@/lib/session";
import { computeKpis, paService, type Kpis } from "@/services/paService";
import type { PriorAuthRequest, Task } from "@/types";

export default function ProviderDashboard() {
  const { user } = useSession();
  const [requests, setRequests] = useState<PriorAuthRequest[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([paService.list(), paService.listTasks("provider-staff")]).then(
      ([rows, taskRows]) => {
        if (!active) return;
        setRequests(rows);
        setKpis(computeKpis(rows));
        setTasks(taskRows.filter((t) => t.status === "open"));
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const needsAttention = (requests ?? []).filter((r) =>
    ["clinical-review", "needs-approval", "pended", "eligibility-check"].includes(r.status),
  );

  return (
    <>
      <PageHeader
        eyebrow="Provider / clinic staff"
        title={`Good afternoon, ${user?.name.split(" ")[0]}`}
        description="Everything the agent could resolve on its own has been resolved. What's below is what needs a person."
        actions={
          <Button variant="primary" icon={<Plus size={15} />}>
            <Link to="/provider/new">New request</Link>
          </Button>
        }
      />

      {!kpis ? (
        <Card>
          <LoadingBlock label="Loading dashboard" />
        </Card>
      ) : (
        <>
          <section aria-label="Key figures" className="mb-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Stat label="Pending with payers" value={kpis.pending} to="/provider/requests?status=pending" />
              <Stat label="Approved" value={kpis.approved} tone="accent" />
              <Stat label="Denied" value={kpis.denied} tone="danger" />
              <Stat
                label="Avg turnaround"
                value={`${kpis.avgTurnaroundHours}h`}
                hint="Submission to determination"
              />
              <Stat
                label="SLA breaches"
                value={kpis.slaBreaches}
                tone={kpis.slaBreaches > 0 ? "danger" : "neutral"}
                hint={`${kpis.slaAtRisk} more at risk`}
              />
              <Stat
                label="Needs a person"
                value={kpis.needsHuman}
                tone={kpis.needsHuman > 0 ? "signal" : "neutral"}
                to="/provider/worklist"
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader
                  title="What needs you"
                  description="Cases the waterfall could not close on its own, each with the reason it stopped."
                  action={
                    <Link
                      to="/provider/worklist"
                      className="flex items-center gap-1 text-xs font-semibold text-content-brand hover:underline"
                    >
                      Full worklist
                      <ArrowRight size={13} aria-hidden />
                    </Link>
                  }
                />
                <RequestTable
                  requests={needsAttention}
                  linkBase="/provider/requests"
                  showSla={false}
                  emptyMessage="Nothing is waiting on a person right now."
                />
              </Card>

              <Card className="mt-6">
                <CardHeader
                  title="All requests"
                  description={`${requests?.length ?? 0} cases across every status.`}
                  action={
                    <Link
                      to="/provider/requests"
                      className="flex items-center gap-1 text-xs font-semibold text-content-brand hover:underline"
                    >
                      View all
                      <ArrowRight size={13} aria-hidden />
                    </Link>
                  }
                />
                <RequestTable
                  requests={(requests ?? []).slice(0, 8)}
                  linkBase="/provider/requests"
                  showSla={false}
                />
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="How cases were resolved"
                  description="The waterfall tries the cheapest channel first and records which one worked."
                />
                <CardBody>
                  {kpis.channelMix.length === 0 ? (
                    <p className="text-sm text-content-muted">No submissions yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {kpis.channelMix
                        .sort((a, b) => b.count - a.count)
                        .map((c) => {
                          const total = kpis.channelMix.reduce((s, x) => s + x.count, 0);
                          const share = c.count / total;
                          return (
                            <li key={c.channel}>
                              <div className="mb-1 flex items-baseline justify-between text-xs">
                                <span className="font-medium text-content">
                                  {CHANNEL_LABEL[c.channel]}
                                </span>
                                <span className="tabular-nums text-content-muted">
                                  {c.count} · {percent(share)}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-surface-inset">
                                <div
                                  className={
                                    c.channel === "electronic"
                                      ? "h-full bg-accent-600"
                                      : c.channel === "portal"
                                        ? "h-full bg-brand-600"
                                        : c.channel === "voice"
                                          ? "h-full bg-signal-500"
                                          : "h-full bg-ink-500"
                                  }
                                  style={{ width: `${share * 100}%` }}
                                />
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                  <p className="mt-4 border-t border-line-subtle pt-3 text-xs leading-relaxed text-content-muted">
                    Each step down costs more and takes longer. Electronic is
                    seconds; a phone call averages eight minutes of hold time.
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Open tasks" description={`${tasks.length} assigned to your team.`} />
                <CardBody className="space-y-2.5">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-content-muted">Nothing open.</p>
                  ) : (
                    tasks.slice(0, 6).map((t) => (
                      <Link
                        key={t.id}
                        to={`/provider/requests/${t.requestId}`}
                        className="block rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-brand-300 hover:bg-tint-brand/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-content">{t.title}</span>
                          {t.priority === "urgent" && (
                            <AlertTriangle
                              size={14}
                              className="mt-0.5 shrink-0 text-content-danger"
                              aria-label="Urgent"
                            />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-content-muted">
                          {t.reason}
                        </p>
                        {t.dueAt && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-content-muted">
                            <Clock size={11} aria-hidden />
                            Due {relative(t.dueAt)}
                          </p>
                        )}
                      </Link>
                    ))
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Turnaround by payer" />
                <CardBody>
                  <ul className="space-y-2">
                    {kpis.byPayer
                      .filter((p) => p.total > 0)
                      .map((p) => (
                        <li
                          key={p.payerId}
                          className="flex items-baseline justify-between gap-3 text-sm"
                        >
                          <span className="truncate text-content">{p.name}</span>
                          <span className="shrink-0 tabular-nums text-xs text-content-muted">
                            {p.approved}/{p.total} approved
                          </span>
                        </li>
                      ))}
                  </ul>
                </CardBody>
              </Card>
            </div>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-content-muted">
            Average turnaround is measured from submission to determination
            across {kpis.approved + kpis.denied + kpis.partiallyApproved} decided
            cases. Deadlines follow CMS-0057-F: {durationHours(72)} expedited,{" "}
            {durationHours(168)} standard.
          </p>
        </>
      )}
    </>
  );
}
