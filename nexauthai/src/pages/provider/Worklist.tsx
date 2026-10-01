import { AlertTriangle, Clock, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/case";
import {
  Badge,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Tabs,
} from "@/components/ui";
import { dateTime, relative } from "@/lib/format";
import { directoryService } from "@/services/directory";
import { paService } from "@/services/paService";
import { store } from "@/mocks";
import type { Task } from "@/types";

const TAB_KINDS = {
  all: null,
  exceptions: ["admin-exception", "approve-submission"],
  clinical: ["clinical-review", "appeal-review", "peer-to-peer"],
  payer: ["rfi-response", "expiring-approval"],
} as const;

type TabId = keyof typeof TAB_KINDS;

const PRIORITY_TONE = {
  urgent: "danger",
  high: "signal",
  normal: "neutral",
  low: "neutral",
} as const;

export default function Worklist() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [tab, setTab] = useState<TabId>("all");

  useEffect(() => {
    let active = true;
    paService.listTasks().then((rows) => {
      if (active) setTasks(rows.filter((t) => t.status !== "done" && t.status !== "cancelled"));
    });
    return () => {
      active = false;
    };
  }, []);

  const kinds = TAB_KINDS[tab];
  const filtered = (tasks ?? []).filter(
    (t) => !kinds || (kinds as readonly string[]).includes(t.kind),
  );

  const count = (id: TabId) => {
    const k = TAB_KINDS[id];
    return (tasks ?? []).filter((t) => !k || (k as readonly string[]).includes(t.kind)).length;
  };

  return (
    <>
      <PageHeader
        eyebrow="Provider / clinic staff"
        title="Worklist"
        description="Only exceptions reach this list, each already loaded with the context behind it. If a case is not here, the agent is still working it."
      />

      <Card>
        <div className="px-4 pt-1">
          <Tabs
            label="Worklist sections"
            active={tab}
            onChange={setTab}
            tabs={[
              { id: "all", label: "Everything", count: count("all") },
              { id: "exceptions", label: "Administrative", count: count("exceptions") },
              { id: "clinical", label: "Clinical", count: count("clinical") },
              { id: "payer", label: "Payer action", count: count("payer") },
            ]}
          />
        </div>

        {!tasks ? (
          <LoadingBlock label="Loading worklist" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox size={28} />}
            title="Nothing waiting"
            description="Every case the agent could resolve has been resolved."
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {filtered.map((t) => {
              const request = store.requests.find((r) => r.id === t.requestId);
              const patient = request ? directoryService.sync.patient(request.patientId) : null;
              return (
                <li key={t.id}>
                  <Link
                    to={`/provider/requests/${t.requestId}`}
                    className="block px-4 py-3.5 transition-colors hover:bg-surface-inset/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-content-brand">
                          {request?.caseNumber}
                        </span>
                        <span className="text-sm font-medium text-content">{t.title}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {t.priority !== "normal" && (
                          <Badge tone={PRIORITY_TONE[t.priority]}>
                            {t.priority === "urgent" && <AlertTriangle size={11} aria-hidden />}
                            {t.priority}
                          </Badge>
                        )}
                        {request && <StatusBadge status={request.status} />}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-relaxed text-content-secondary">
                      {t.reason}
                    </p>

                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
                      {patient && (
                        <span>
                          {patient.firstName} {patient.lastName}
                        </span>
                      )}
                      {request && <span className="font-mono">{request.serviceLines[0]?.code}</span>}
                      <span>Raised {relative(t.createdAt)}</span>
                      {t.dueAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} aria-hidden />
                          Due {dateTime(t.dueAt)}
                        </span>
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
