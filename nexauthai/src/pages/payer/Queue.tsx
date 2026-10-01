/**
 * Payer intake queue.
 *
 * ASSUMPTION. The source material is entirely provider-side — no client or
 * consulting document in the folder describes a payer intake reviewer, a
 * work queue or a completeness check. This screen is modelled on the
 * payer-side patterns in the research reports (Microsoft's utilization-
 * management accelerator, Cohere Health, Anterior) rather than on stated
 * requirements. See docs/00-source-analysis.md, gap G1.
 */

import { AlertTriangle, Check, Inbox, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChannelBadge, SlaChip, StatusBadge } from "@/components/case";
import {
  AssumptionNote,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Stat,
  TableWrap,
  Td,
  Th,
  inputClass,
} from "@/components/ui";
import { fullDate, relative } from "@/lib/format";
import { useSession } from "@/lib/session";
import { store } from "@/mocks";
import { directoryService } from "@/services/directory";
import { computeFlags, paService } from "@/services/paService";
import type { PriorAuthRequest } from "@/types";

export default function PayerQueue() {
  const { user } = useSession();
  const [requests, setRequests] = useState<PriorAuthRequest[] | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    if (!user?.payerId) return;
    paService.list({ payerScope: user.payerId }).then(setRequests);
  };

  useEffect(load, [user]);

  const awaitingIntake = useMemo(
    () =>
      (requests ?? []).filter((r) => {
        const hasIntakeTask = store.tasks.some(
          (t) => t.requestId === r.id && t.kind === "intake-completeness" && t.status === "open",
        );
        return hasIntakeTask && (!urgencyFilter || r.urgency === urgencyFilter);
      }),
    [requests, urgencyFilter],
  );

  const inReview = (requests ?? []).filter((r) => r.status === "in-review");
  const decided = (requests ?? []).filter((r) =>
    ["approved", "partially-approved", "denied"].includes(r.status),
  );
  const breached = (requests ?? []).filter((r) => computeFlags(r).slaBreached).length;

  const triage = async (requestId: string) => {
    setBusy(requestId);
    await paService.triage(requestId, "usr-halvorsen");
    load();
    setBusy(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Payer intake reviewer"
        title="Intake queue"
        description="Submissions arriving from providers. Check completeness, then triage to a clinical reviewer."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Awaiting intake" value={awaitingIntake.length} tone="signal" />
        <Stat label="With clinical review" value={inReview.length} />
        <Stat label="Decided" value={decided.length} tone="accent" />
        <Stat
          label="Past decision deadline"
          value={breached}
          tone={breached ? "danger" : "neutral"}
          hint="72h expedited / 7d standard"
        />
      </div>

      <Card>
        <CardHeader
          title="Awaiting completeness check"
          description="Nothing here has been assessed for medical necessity — intake confirms the packet is workable and routes it."
          action={
            <div>
              <label htmlFor="urgency" className="sr-only">
                Filter by urgency
              </label>
              <select
                id="urgency"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className={inputClass}
              >
                <option value="">All urgencies</option>
                <option value="expedited">Expedited only</option>
                <option value="standard">Standard only</option>
              </select>
            </div>
          }
        />

        {!requests ? (
          <LoadingBlock label="Loading queue" />
        ) : awaitingIntake.length === 0 ? (
          <EmptyState
            icon={<Inbox size={28} />}
            title="Intake queue is clear"
            description="Everything received has been triaged."
          />
        ) : (
          <TableWrap>
            <caption className="sr-only">Submissions awaiting a completeness check</caption>
            <thead>
              <tr>
                <Th>Case</Th>
                <Th>Member</Th>
                <Th>Service</Th>
                <Th>Received via</Th>
                <Th>Packet</Th>
                <Th>Deadline</Th>
                <Th>
                  <span className="sr-only">Action</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {awaitingIntake.map((r) => {
                const patient = directoryService.sync.patient(r.patientId);
                const coverage = directoryService.sync.coverage(r.coverageId);
                const attempt = r.attempts.find((a) => a.outcome === "succeeded");
                const docCount = r.documentIds.length;
                const complete = docCount >= 2;

                return (
                  <tr key={r.id} className="transition-colors hover:bg-surface-inset/60">
                    <Td>
                      <Link
                        to={`/payer/review/${r.id}`}
                        className="font-mono text-sm font-semibold text-content-brand hover:underline"
                      >
                        {r.caseNumber}
                      </Link>
                      {r.urgency === "expedited" && (
                        <Badge tone="danger" className="ml-2">
                          Expedited
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <span className="block truncate text-sm text-content">
                        {patient?.firstName} {patient?.lastName}
                      </span>
                      <span className="block font-mono text-xs text-content-muted">
                        {coverage?.memberId}
                      </span>
                    </Td>
                    <Td>
                      <span className="block font-mono text-xs font-semibold text-content">
                        {r.serviceLines[0]?.code}
                      </span>
                      <span className="block max-w-[14rem] truncate text-xs text-content-muted">
                        {r.serviceLines[0]?.display}
                      </span>
                    </Td>
                    <Td>
                      {attempt ? (
                        <ChannelBadge channel={attempt.channel} />
                      ) : (
                        <span className="text-xs text-content-muted">—</span>
                      )}
                      <span className="mt-0.5 block font-mono text-[11px] text-content-muted">
                        {attempt?.externalRef}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={complete ? "accent" : "signal"}>
                        {complete ? <Check size={11} /> : <AlertTriangle size={11} />}
                        {docCount} document{docCount === 1 ? "" : "s"}
                      </Badge>
                    </Td>
                    <Td>
                      <SlaChip request={r} />
                      <span className="mt-0.5 block text-xs text-content-muted">
                        {r.decisionDueAt ? fullDate(r.decisionDueAt) : "—"}
                      </span>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<UserCheck size={13} />}
                        loading={busy === r.id}
                        onClick={() => triage(r.id)}
                      >
                        Triage
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="All submissions to this plan"
          description="Received, in review and decided."
        />
        {!requests ? (
          <LoadingBlock />
        ) : (
          <TableWrap>
            <caption className="sr-only">All submissions</caption>
            <thead>
              <tr>
                <Th>Case</Th>
                <Th>Member</Th>
                <Th>Service</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const patient = directoryService.sync.patient(r.patientId);
                return (
                  <tr key={r.id} className="transition-colors hover:bg-surface-inset/60">
                    <Td>
                      <Link
                        to={`/payer/review/${r.id}`}
                        className="font-mono text-sm font-semibold text-content-brand hover:underline"
                      >
                        {r.caseNumber}
                      </Link>
                    </Td>
                    <Td className="text-sm text-content">
                      {patient?.firstName} {patient?.lastName}
                    </Td>
                    <Td className="font-mono text-xs text-content">{r.serviceLines[0]?.code}</Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td className="text-xs text-content-muted">{relative(r.submittedAt)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <AssumptionNote>
        Everything on this screen is an assumption. The folder this prototype
        was built from contains no payer-side requirements at all — no intake
        role, no queue, no completeness check. The shape here follows the
        payer-side products described in the research reports.
      </AssumptionNote>
    </>
  );
}
