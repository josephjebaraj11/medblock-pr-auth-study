/**
 * Payer clinical reviewer / medical director queue.
 *
 * ASSUMPTION — see docs/00-source-analysis.md, gap G1.
 *
 * The one rule carried over from the source material and enforced in code:
 * only a user holding the payer-clinical role can record a denial or partial
 * approval, and the service layer rejects any attempt to record one without
 * a named licensed reviewer.
 */

import { AlertTriangle, ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SlaChip, StatusBadge } from "@/components/case";
import {
  AssumptionNote,
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
import { dateTime, relative } from "@/lib/format";
import { useSession } from "@/lib/session";
import { store } from "@/mocks";
import { directoryService } from "@/services/directory";
import { computeFlags, paService } from "@/services/paService";
import type { PriorAuthRequest, Task } from "@/types";

export default function PayerClinicalQueue() {
  const { user } = useSession();
  const [requests, setRequests] = useState<PriorAuthRequest[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user?.payerId) return;
    let active = true;
    Promise.all([
      paService.list({ payerScope: user.payerId }),
      paService.listTasks("payer-clinical"),
    ]).then(([rows, taskRows]) => {
      if (!active) return;
      setRequests(rows);
      setTasks(taskRows.filter((t) => t.status === "open"));
    });
    return () => {
      active = false;
    };
  }, [user]);

  const queue = (requests ?? []).filter((r) =>
    tasks.some((t) => t.requestId === r.id && t.kind === "clinical-determination"),
  );
  const breached = queue.filter((r) => computeFlags(r).slaBreached).length;
  const expedited = queue.filter((r) => r.urgency === "expedited").length;

  const decidedByMe = (requests ?? []).filter((r) => {
    const d = store.decisions.find((x) => x.requestId === r.id);
    return d?.decidedByUserId === user?.id;
  });

  return (
    <>
      <PageHeader
        eyebrow="Payer clinical reviewer"
        title="Clinical review"
        description="Cases triaged to you for a medical-necessity determination."
      />

      <Callout tone="brand" icon={<ShieldCheck size={15} />} title="You are the decision">
        The AI criteria match below is an aid, not a determination. A denial or
        partial approval is recorded against your name, and the platform will
        not record one without a named licensed reviewer.
      </Callout>

      <div className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Awaiting determination" value={queue.length} tone={queue.length ? "signal" : "neutral"} />
        <Stat label="Expedited" value={expedited} tone={expedited ? "danger" : "neutral"} hint="72-hour window" />
        <Stat label="Past deadline" value={breached} tone={breached ? "danger" : "neutral"} />
        <Stat label="Decided by you" value={decidedByMe.length} tone="accent" />
      </div>

      <Card>
        <CardHeader title="Your queue" description={`${queue.length} awaiting a determination.`} />

        {!requests ? (
          <LoadingBlock label="Loading queue" />
        ) : queue.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={28} />}
            title="Queue is clear"
            description="Nothing is waiting on a determination."
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {queue.map((r) => {
              const patient = directoryService.sync.patient(r.patientId);
              const assessment = store.assessments.find((a) => a.requestId === r.id);
              const unmet = assessment?.criteriaMatches.filter((m) => m.status !== "met").length ?? 0;

              return (
                <li key={r.id}>
                  <Link
                    to={`/payer/review/${r.id}`}
                    className="block px-4 py-4 transition-colors hover:bg-surface-inset/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-content-brand">
                          {r.caseNumber}
                        </span>
                        <span className="text-sm font-medium text-content">
                          {r.serviceLines[0]?.code} {r.serviceLines[0]?.display}
                        </span>
                        {r.urgency === "expedited" && <Badge tone="danger">Expedited</Badge>}
                      </span>
                      <span className="flex items-center gap-2">
                        <SlaChip request={r} />
                        <StatusBadge status={r.status} />
                      </span>
                    </div>

                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
                      <span className="font-medium text-content-secondary">
                        {patient?.firstName} {patient?.lastName}
                      </span>
                      <span>{patient && `${patient.dateOfBirth}`}</span>
                      <span className="font-mono">{r.diagnoses[0]?.code}</span>
                      <span>Submitted {relative(r.submittedAt)}</span>
                      <span>{r.documentIds.length} documents</span>
                    </p>

                    {assessment ? (
                      <div className="mt-3 rounded-lg bg-surface-inset px-3 py-2.5">
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-content">
                            Criteria match — {assessment.criteriaMatches.length - unmet} of{" "}
                            {assessment.criteriaMatches.length} met
                          </span>
                          <span className="text-xs tabular-nums text-content-muted">
                            agent confidence {assessment.confidence.overall.toFixed(2)}
                          </span>
                        </div>
                        <ConfidenceBar value={assessment.confidence.overall} />
                        {unmet > 0 && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-tint-signal-on">
                            <AlertTriangle size={11} aria-hidden />
                            {unmet} criterion
                            {unmet === 1 ? "" : "a"} not met or unclear — your judgement
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-content-muted">
                        No AI assessment accompanies this submission.
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {decidedByMe.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Recently decided by you" />
          <ul className="divide-y divide-line-subtle">
            {decidedByMe.slice(0, 5).map((r) => {
              const d = store.decisions.find((x) => x.requestId === r.id);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="flex items-center gap-2">
                    <Link
                      to={`/payer/review/${r.id}`}
                      className="font-mono text-sm font-semibold text-content-brand hover:underline"
                    >
                      {r.caseNumber}
                    </Link>
                    <span className="text-sm text-content">{r.serviceLines[0]?.code}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-content-muted">
                    {d && dateTime(d.decidedAt)}
                    <StatusBadge status={r.status} />
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <AssumptionNote>
        The payer-side roles and screens are an assumption. No client or
        consulting document in the source folder describes them.
      </AssumptionNote>
    </>
  );
}
