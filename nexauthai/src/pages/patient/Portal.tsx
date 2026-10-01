/**
 * Patient portal — read-only.
 *
 * ASSUMPTION. The source material mentions the patient twice: as the
 * indirect beneficiary of faster care, and as a future obligation under the
 * CMS Patient Access API, which from 1 January 2027 must expose prior
 * authorization status and history to a patient's own app. Nothing in the
 * folder specifies a patient UI.
 *
 * Scoped accordingly: status and timeline only. No clinical detail, no
 * criteria, no payer rationale, no documents, and no actions.
 */

import { Activity, CalendarCheck, Clock, HelpCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AssumptionNote,
  Badge,
  Callout,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingBlock,
  PageHeader,
} from "@/components/ui";
import { fullDate, relative } from "@/lib/format";
import { useSession } from "@/lib/session";
import { store } from "@/mocks";
import { directoryService } from "@/services/directory";
import { paService } from "@/services/paService";
import type { PriorAuthRequest } from "@/types";

/** Patient-facing language. Deliberately plainer than the staff statuses. */
function patientStatus(r: PriorAuthRequest): { label: string; tone: "accent" | "brand" | "signal" | "danger" | "neutral"; explain: string } {
  switch (r.status) {
    case "approved":
      return {
        label: "Approved",
        tone: "accent",
        explain: "Your insurer has approved this. You can go ahead and schedule.",
      };
    case "partially-approved":
      return {
        label: "Approved with changes",
        tone: "aqua" as never,
        explain: "Your insurer approved this, but changed some details. Your clinic can explain what changed.",
      };
    case "denied":
      return {
        label: "Not approved",
        tone: "danger",
        explain: "Your insurer did not approve this. Your care team is reviewing what happens next.",
      };
    case "appealed":
      return {
        label: "Under appeal",
        tone: "signal",
        explain: "Your doctor has asked the insurer to reconsider. This usually takes a few weeks.",
      };
    case "peer-to-peer":
      return {
        label: "Doctor-to-doctor review",
        tone: "signal",
        explain: "Your doctor is speaking directly with the insurer's doctor about this request.",
      };
    case "no-auth-required":
      return {
        label: "No approval needed",
        tone: "accent",
        explain: "This service does not need your insurer's approval. Nothing is holding it up.",
      };
    case "pended":
      return {
        label: "Insurer needs more information",
        tone: "signal",
        explain: "Your insurer asked for an extra document. Your clinic is sending it — you do not need to do anything.",
      };
    case "clinical-review":
      return {
        label: "With your care team",
        tone: "brand",
        explain: "Your clinic is adding some information before sending this to your insurer.",
      };
    case "withdrawn":
      return { label: "Withdrawn", tone: "neutral", explain: "This request was withdrawn." };
    default:
      return {
        label: "In progress",
        tone: "brand",
        explain: "Your clinic has sent this to your insurer and is waiting on a response.",
      };
  }
}

export default function PatientPortal() {
  const { user } = useSession();
  const [requests, setRequests] = useState<PriorAuthRequest[] | null>(null);

  useEffect(() => {
    if (!user?.patientId) return;
    let active = true;
    paService.list({ patientId: user.patientId }).then((rows) => active && setRequests(rows));
    return () => {
      active = false;
    };
  }, [user]);

  const patient = user?.patientId ? directoryService.sync.patient(user.patientId) : null;

  return (
    <>
      <PageHeader
        eyebrow="Patient"
        title="My authorizations"
        description="Where each of your insurance approval requests has got to. This view is read-only — your care team manages everything here."
      />

      {patient && (
        <Card className="mb-6">
          <CardBody>
            <p className="text-sm text-content">
              <span className="font-semibold">
                {patient.firstName} {patient.lastName}
              </span>
              <span className="ml-2 text-content-muted">
                Date of birth {fullDate(patient.dateOfBirth)}
              </span>
            </p>
          </CardBody>
        </Card>
      )}

      {!requests ? (
        <Card>
          <LoadingBlock label="Loading your authorizations" />
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Activity size={28} />}
            title="Nothing to show"
            description="You have no authorization requests on file."
          />
        </Card>
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => {
            const status = patientStatus(r);
            const decision = store.decisions.find((d) => d.requestId === r.id);
            const payer = directoryService.sync.payer(r.payerId);
            const provider = directoryService.sync.provider(r.orderingProviderId);

            return (
              <li key={r.id}>
                <Card>
                  <CardHeader
                    title={r.serviceLines[0]?.display ?? "Service"}
                    description={`Requested by ${provider?.firstName} ${provider?.lastName}, ${provider?.credential} · ${payer?.name}`}
                    action={<Badge tone={status.tone}>{status.label}</Badge>}
                  />
                  <CardBody className="space-y-3.5">
                    <p className="text-sm leading-relaxed text-content-secondary">
                      {status.explain}
                    </p>

                    <ol className="space-y-2.5 border-l-2 border-line-subtle pl-4">
                      <li className="relative">
                        <span
                          className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-accent-600"
                          aria-hidden
                        />
                        <p className="text-xs font-medium text-content">Requested</p>
                        <p className="text-xs text-content-muted">
                          {fullDate(r.createdAt)} ({relative(r.createdAt)})
                        </p>
                      </li>

                      {r.submittedAt && (
                        <li className="relative">
                          <span
                            className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-accent-600"
                            aria-hidden
                          />
                          <p className="text-xs font-medium text-content">Sent to your insurer</p>
                          <p className="text-xs text-content-muted">{fullDate(r.submittedAt)}</p>
                        </li>
                      )}

                      {decision && (
                        <li className="relative">
                          <span
                            className={`absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full ${
                              decision.outcome === "denied" ? "bg-danger-600" : "bg-accent-600"
                            }`}
                            aria-hidden
                          />
                          <p className="text-xs font-medium text-content">
                            Your insurer responded
                          </p>
                          <p className="text-xs text-content-muted">
                            {fullDate(decision.decidedAt)}
                          </p>
                        </li>
                      )}

                      {!decision && r.decisionDueAt && (
                        <li className="relative">
                          <span
                            className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-surface-inset ring-2 ring-line"
                            aria-hidden
                          />
                          <p className="text-xs font-medium text-content-muted">
                            Decision expected
                          </p>
                          <p className="flex items-center gap-1 text-xs text-content-muted">
                            <Clock size={11} aria-hidden />
                            by {fullDate(r.decisionDueAt)}
                          </p>
                        </li>
                      )}
                    </ol>

                    {decision?.validTo && decision.outcome !== "denied" && (
                      <p className="flex items-center gap-1.5 rounded-lg bg-tint-accent px-3 py-2 text-xs text-tint-accent-on">
                        <CalendarCheck size={13} aria-hidden />
                        Approval valid until {fullDate(decision.validTo)}
                      </p>
                    )}

                    {r.scheduledServiceDate && (
                      <p className="text-xs text-content-muted">
                        Scheduled for {fullDate(r.scheduledServiceDate)}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Callout tone="brand" icon={<HelpCircle size={15} />} title="Questions about any of these?">
        <p className="text-xs leading-relaxed">
          Call your clinic on{" "}
          <span className="font-semibold">(614) 555-0142</span>. This page shows
          status only — your care team has the full picture and can explain what
          a decision means for you.
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs">
          <Phone size={12} aria-hidden />
          Northside Orthopaedic &amp; Spine
        </p>
      </Callout>

      <AssumptionNote>
        This portal is an assumption. The source material names the patient only
        as an indirect beneficiary and as a 2027 obligation under the CMS Patient
        Access API, which must expose prior authorization status and history to
        a patient's own application. Nothing here shows clinical detail, payer
        criteria or decision rationale — a deliberately narrow reading.
      </AssumptionNote>
    </>
  );
}
