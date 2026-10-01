/**
 * Shared case-rendering components, used by both the provider and payer
 * sides so one case looks like one case wherever it is shown.
 */

import clsx from "clsx";
import {
  AlertTriangle,
  Check,
  CircleDot,
  Clock,
  Globe,
  Monitor,
  Phone,
  Printer,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, TableWrap, Td, Th } from "./ui";
import {
  CHANNEL_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  durationHours,
  fullDate,
  relative,
} from "@/lib/format";
import { computeFlags } from "@/services/paService";
import { directoryService } from "@/services/directory";
import { store } from "@/mocks";
import type { Channel, PaStatus, PriorAuthRequest } from "@/types";

export function StatusBadge({ status }: { status: PaStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function PayerChip({ payerId }: { payerId: string }) {
  const payer = directoryService.sync.payer(payerId);
  if (!payer) return <span className="text-content-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={clsx(
          "grid h-6 w-6 shrink-0 place-items-center rounded text-[10px] font-bold text-white",
          payer.accent === "brand" && "bg-brand-600",
          payer.accent === "aqua" && "bg-aqua-600",
          payer.accent === "accent" && "bg-accent-600",
          payer.accent === "signal" && "bg-signal-600",
          payer.accent === "ink" && "bg-ink-600",
        )}
        aria-hidden
      >
        {payer.logoInitials}
      </span>
      <span className="truncate text-sm text-content">{payer.name}</span>
    </span>
  );
}

export const CHANNEL_ICON: Record<Channel, ReactNode> = {
  electronic: <Globe size={14} />,
  portal: <Monitor size={14} />,
  voice: <Phone size={14} />,
  fax: <Printer size={14} />,
  human: <UserRound size={14} />,
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  const tone =
    channel === "electronic"
      ? "accent"
      : channel === "portal"
        ? "brand"
        : channel === "voice"
          ? "signal"
          : "neutral";
  return (
    <Badge tone={tone}>
      <span aria-hidden>{CHANNEL_ICON[channel]}</span>
      {CHANNEL_LABEL[channel]}
    </Badge>
  );
}

/** Deadline chip. Breached and at-risk read differently at a glance. */
export function SlaChip({ request }: { request: PriorAuthRequest }) {
  const decision = store.decisions.find((d) => d.requestId === request.id);
  const flags = computeFlags(request, decision);

  if (flags.hoursRemaining === null) {
    return <span className="text-xs text-content-muted">—</span>;
  }
  if (flags.slaBreached) {
    return (
      <Badge tone="danger">
        <AlertTriangle size={12} aria-hidden />
        {durationHours(flags.hoursRemaining)} over
      </Badge>
    );
  }
  if (flags.slaAtRisk) {
    return (
      <Badge tone="signal">
        <Clock size={12} aria-hidden />
        {durationHours(flags.hoursRemaining)} left
      </Badge>
    );
  }
  return (
    <span className="text-xs tabular-nums text-content-muted">
      {durationHours(flags.hoursRemaining)} left
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Request table
 * ------------------------------------------------------------------ */

export function RequestTable({
  requests,
  linkBase,
  showPatient = true,
  showSla = true,
  emptyMessage = "No requests match these filters.",
}: {
  requests: PriorAuthRequest[];
  linkBase: string;
  showPatient?: boolean;
  showSla?: boolean;
  emptyMessage?: string;
}) {
  if (requests.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-content-muted">{emptyMessage}</p>
    );
  }

  return (
    <TableWrap>
      <caption className="sr-only">Prior authorization requests</caption>
      <thead>
        <tr>
          <Th>Case</Th>
          {showPatient && <Th>Patient</Th>}
          <Th>Service</Th>
          <Th>Payer</Th>
          <Th>Status</Th>
          {showSla && <Th>Deadline</Th>}
          <Th>Updated</Th>
        </tr>
      </thead>
      <tbody>
        {requests.map((r) => {
          const patient = directoryService.sync.patient(r.patientId);
          const line = r.serviceLines[0];
          return (
            <tr key={r.id} className="transition-colors hover:bg-surface-inset/60">
              <Td>
                <Link
                  to={`${linkBase}/${r.id}`}
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
              {showPatient && (
                <Td>
                  <span className="block truncate text-sm text-content">
                    {patient ? `${patient.firstName} ${patient.lastName}` : "—"}
                  </span>
                  <span className="block font-mono text-xs text-content-muted">
                    {patient?.mrn}
                  </span>
                </Td>
              )}
              <Td>
                <span className="block font-mono text-xs font-semibold text-content">
                  {line?.code}
                </span>
                <span className="block max-w-[18rem] truncate text-xs text-content-muted">
                  {line?.display}
                </span>
              </Td>
              <Td>
                <PayerChip payerId={r.payerId} />
              </Td>
              <Td>
                <StatusBadge status={r.status} />
              </Td>
              {showSla && (
                <Td>
                  <SlaChip request={r} />
                </Td>
              )}
              <Td>
                <span className="whitespace-nowrap text-xs text-content-muted">
                  {relative(r.updatedAt)}
                </span>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </TableWrap>
  );
}

/* ------------------------------------------------------------------ *
 * Status timeline
 * ------------------------------------------------------------------ */

/**
 * The lifecycle, with the stages this case actually passed through marked.
 * Branch states (no-auth-required, denied, appealed) replace the tail rather
 * than appending to it, so the track reflects what happened.
 */
const TRACK: { status: PaStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "eligibility-check", label: "Eligibility" },
  { status: "requirement-check", label: "PA required?" },
  { status: "documentation", label: "Documentation" },
  { status: "submitted", label: "Submitted" },
  { status: "in-review", label: "In review" },
  { status: "approved", label: "Decision" },
];

const ORDER: PaStatus[] = [
  "draft",
  "eligibility-check",
  "requirement-check",
  "documentation",
  "clinical-review",
  "needs-approval",
  "submitting",
  "submitted",
  "in-review",
  "pended",
  "approved",
  "partially-approved",
  "denied",
  "appealed",
  "peer-to-peer",
];

export function StatusTrack({ request }: { request: PriorAuthRequest }) {
  const currentIndex = ORDER.indexOf(request.status);

  const steps = TRACK.map((step) => {
    if (step.status === "approved") {
      const terminal: PaStatus[] = [
        "approved",
        "partially-approved",
        "denied",
        "appealed",
        "peer-to-peer",
      ];
      const reached = terminal.includes(request.status);
      return {
        label: reached ? STATUS_LABEL[request.status] : "Decision",
        state: reached
          ? request.status === "denied"
            ? ("failed" as const)
            : ("done" as const)
          : ("pending" as const),
      };
    }
    const idx = ORDER.indexOf(step.status);
    return {
      label: step.label,
      state:
        request.status === step.status
          ? ("current" as const)
          : idx < currentIndex
            ? ("done" as const)
            : ("pending" as const),
    };
  });

  // The evidenced "no PA required" ending is its own two-step story.
  if (request.status === "no-auth-required") {
    steps.splice(3, 4, { label: "No authorization required", state: "done" });
  }

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="Case progress">
      {steps.map((step, i) => (
        <li key={`${step.label}-${i}`} className="flex items-center gap-1">
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              step.state === "done" && "bg-tint-accent text-tint-accent-on",
              step.state === "current" && "bg-tint-brand text-tint-brand-on ring-1 ring-brand-400",
              step.state === "failed" && "bg-tint-danger text-tint-danger-on",
              step.state === "pending" && "bg-surface-inset text-content-muted",
            )}
          >
            {step.state === "done" && <Check size={12} aria-hidden />}
            {step.state === "current" && <CircleDot size={12} aria-hidden />}
            {step.state === "failed" && <AlertTriangle size={12} aria-hidden />}
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <span className="h-px w-3 bg-line" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ *
 * Key-value list
 * ------------------------------------------------------------------ */

export function KeyValue({
  items,
  columns = 2,
}: {
  items: { label: string; value: ReactNode }[];
  columns?: 1 | 2 | 3;
}) {
  return (
    <dl
      className={clsx(
        "grid gap-x-6 gap-y-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-medium text-content-muted">{item.label}</dt>
          <dd className="mt-0.5 break-words text-sm text-content">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RequestSummary({ request }: { request: PriorAuthRequest }) {
  const patient = directoryService.sync.patient(request.patientId);
  const coverage = directoryService.sync.coverage(request.coverageId);
  const provider = directoryService.sync.provider(request.orderingProviderId);
  const payer = directoryService.sync.payer(request.payerId);

  return (
    <KeyValue
      columns={3}
      items={[
        {
          label: "Patient",
          value: patient ? (
            <>
              {patient.firstName} {patient.lastName}
              <span className="ml-1.5 font-mono text-xs text-content-muted">{patient.mrn}</span>
            </>
          ) : (
            "—"
          ),
        },
        { label: "Date of birth", value: patient ? fullDate(patient.dateOfBirth) : "—" },
        {
          label: "Coverage",
          value: coverage ? (
            <>
              {payer?.name}
              <span className="ml-1.5 font-mono text-xs text-content-muted">
                {coverage.memberId}
              </span>
            </>
          ) : (
            "—"
          ),
        },
        {
          label: "Ordering provider",
          value: provider ? `${provider.firstName} ${provider.lastName}, ${provider.credential}` : "—",
        },
        {
          label: "Service",
          value: request.serviceLines
            .map((s) => `${s.code} — ${s.display}`)
            .join("; "),
        },
        {
          label: "Diagnoses",
          value: request.diagnoses.map((d) => `${d.code} ${d.display}`).join("; "),
        },
        { label: "Urgency", value: request.urgency === "expedited" ? "Expedited" : "Standard" },
        { label: "Scheduled for", value: fullDate(request.scheduledServiceDate) },
        {
          label: "Requirement source",
          value: request.requirementRef ? (
            <>
              <span className="uppercase">{request.requirementSource}</span>
              <span className="ml-1.5 font-mono text-xs text-content-muted">
                {request.requirementRef}
              </span>
            </>
          ) : (
            "Not yet determined"
          ),
        },
      ]}
    />
  );
}
