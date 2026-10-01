/**
 * The clinical reviewer's queue.
 *
 * This is the whole of the licensed persona's landing surface, and it holds
 * exactly the four things that are medical judgements: an evidence gap the
 * agent stopped at, a denial, an appeal awaiting sign-off, and a scheduled
 * peer-to-peer. Nothing administrative reaches here — that is Operations'
 * queue, and the split is the point of keeping the two personas apart.
 */

import { Gavel, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/case";
import {
  Badge,
  Callout,
  Card,
  CardHeader,
  ConfidenceBar,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Stat,
} from "@/components/ui";
import { relative } from "@/lib/format";
import { store } from "@/mocks";
import { directoryService } from "@/services/directory";
import { paService } from "@/services/paService";
import type { Task } from "@/types";

const KIND_ICON = {
  "clinical-review": <Stethoscope size={15} />,
  "appeal-review": <Gavel size={15} />,
  "peer-to-peer": <Phone size={15} />,
} as const;

export default function ClinicalQueue() {
  const [tasks, setTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    let active = true;
    paService.listTasks("clinical-reviewer").then((rows) => {
      if (active) setTasks(rows.filter((t) => t.status === "open" || t.status === "in-progress"));
    });
    return () => {
      active = false;
    };
  }, []);

  const count = (kind: Task["kind"]) => (tasks ?? []).filter((t) => t.kind === kind).length;

  return (
    <>
      <PageHeader
        eyebrow="Clinical reviewer · licensed"
        title="Clinical review"
        description="Cases where the agent reached a question only a clinician can answer."
      />

      <Callout tone="brand" icon={<ShieldCheck size={15} />} title="Where the line sits">
        The agent reads the chart, matches the payer's criteria and says what it
        found and what is missing. It does not judge medical necessity, it does
        not issue denials, and it cannot file an appeal without your approval.
        Every action you take here is recorded against your name.
      </Callout>

      {tasks && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Evidence gaps" value={count("clinical-review")} tone="signal" />
          <Stat label="Denials & appeals" value={count("appeal-review")} tone="danger" />
          <Stat label="Peer-to-peer" value={count("peer-to-peer")} />
        </div>
      )}

      <Card className="mt-5">
        <CardHeader title="Your queue" description={`${tasks?.length ?? 0} open.`} />

        {!tasks ? (
          <LoadingBlock label="Loading queue" />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={28} />}
            title="Nothing waiting on you"
            description="Every case is either resolved or still with the agent."
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {tasks.map((t) => {
              const request = store.requests.find((r) => r.id === t.requestId);
              const patient = request ? directoryService.sync.patient(request.patientId) : null;
              const assessment = store.assessments.find((a) => a.requestId === t.requestId);
              const payer = request ? directoryService.sync.payer(request.payerId) : null;

              return (
                <li key={t.id}>
                  <Link
                    to={`/clinical/${t.requestId}`}
                    className="block px-4 py-4 transition-colors hover:bg-surface-inset/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-content-muted" aria-hidden>
                          {KIND_ICON[t.kind as keyof typeof KIND_ICON] ?? <Stethoscope size={15} />}
                        </span>
                        <span className="font-mono text-sm font-semibold text-content-brand">
                          {request?.caseNumber}
                        </span>
                        <span className="text-sm font-medium text-content">{t.title}</span>
                      </span>
                      {request && <StatusBadge status={request.status} />}
                    </div>

                    <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
                      {t.reason}
                    </p>

                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
                      {patient && (
                        <span className="font-medium text-content-secondary">
                          {patient.firstName} {patient.lastName}
                        </span>
                      )}
                      {request && (
                        <span className="font-mono">
                          {request.serviceLines[0]?.code} {request.serviceLines[0]?.display}
                        </span>
                      )}
                      {payer && <span>{payer.name}</span>}
                      {t.dueAt && <span>Due {relative(t.dueAt)}</span>}
                    </p>

                    {assessment && (
                      <div className="mt-3 rounded-lg bg-surface-inset px-3 py-2.5">
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-content">
                            Agent confidence {assessment.confidence.overall.toFixed(2)}
                          </span>
                          <Badge
                            tone={
                              assessment.recommendation === "ready-to-submit" ? "accent" : "signal"
                            }
                          >
                            {assessment.recommendation.replace(/-/g, " ")}
                          </Badge>
                        </div>
                        <ConfidenceBar
                          value={assessment.confidence.overall}
                          threshold={store.policy.autoSubmitThreshold}
                        />
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-content-muted">
                          {assessment.rationale}
                        </p>
                      </div>
                    )}
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
