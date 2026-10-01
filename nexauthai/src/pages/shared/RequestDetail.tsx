/**
 * One case, in full.
 *
 * The same page serves Operations and the Clinical Reviewer — the case is one
 * object, and the only thing that changes between personas is which actions
 * are offered. That is the design rule from the source material ("the case
 * remains the same even if execution moves from API to portal to phone to
 * human"), applied to the UI.
 */

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  FileText,
  Gavel,
  MessageSquare,
  Paperclip,
  Phone,
  Send,
  ShieldAlert,
  Stethoscope,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AiPanel } from "@/components/AiPanel";
import {
  ChannelBadge,
  KeyValue,
  RequestSummary,
  StatusBadge,
  StatusTrack,
} from "@/components/case";
import {
  AssumptionNote,
  Badge,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingBlock,
  Tabs,
} from "@/components/ui";
import { bytes, dateTime, fullDate, latency, relative } from "@/lib/format";
import { useSession } from "@/lib/session";
import { store } from "@/mocks";
import { directoryService } from "@/services/directory";
import { ApiError } from "@/services/http";
import { paService, type RequestDetail as Detail } from "@/services/paService";

type TabId = "overview" | "ai" | "documents" | "channels" | "messages" | "audit";

export default function RequestDetailPage({
  backTo = "/ops/requests",
  backLabel = "All requests",
}: {
  backTo?: string;
  backLabel?: string;
}) {
  const { id = "" } = useParams();
  const { user, can } = useSession();

  const [detail, setDetail] = useState<Detail | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(() => {
    let active = true;
    paService.get(id).then((d) => {
      if (active) setDetail(d ?? null);
    });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(load, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, okText: string) => {
    setBusy(key);
    setMessage(null);
    try {
      await fn();
      setMessage({ tone: "ok", text: okText });
      load();
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof ApiError ? err.message : "Something went wrong.",
      });
    } finally {
      setBusy(null);
    }
  };

  if (!detail) {
    return (
      <Card>
        <LoadingBlock label="Loading case" />
      </Card>
    );
  }

  const { request, flags, assessment, decision, documents, communications, appeals, peerToPeer, audit, routes } =
    detail;

  const openRfi = communications.find((c) => c.kind === "rfi" && c.status === "open");
  const patient = directoryService.sync.patient(request.patientId);
  const payer = directoryService.sync.payer(request.payerId);

  /* ---------------------------- actions ---------------------------- */

  const actions: React.ReactNode[] = [];

  if (can("request:approve-submission") && request.status === "needs-approval") {
    actions.push(
      <Button
        key="release"
        variant="primary"
        icon={<Send size={15} />}
        loading={busy === "release"}
        onClick={() =>
          run(
            "release",
            () => paService.submit(request.id, { approvedByUserId: user!.id }),
            "Released. The waterfall ran and the case moved on.",
          )
        }
      >
        Release &amp; submit
      </Button>,
    );
  }

  if (
    can("request:submit") &&
    ["documentation", "requirement-check"].includes(request.status)
  ) {
    actions.push(
      <Button
        key="submit"
        variant="primary"
        icon={<Send size={15} />}
        loading={busy === "submit"}
        onClick={() => run("submit", () => paService.submit(request.id), "Submission attempted.")}
      >
        Submit to payer
      </Button>,
    );
  }

  if (openRfi && can("request:submit")) {
    actions.push(
      <Button
        key="rfi"
        variant="primary"
        icon={<Upload size={15} />}
        loading={busy === "rfi"}
        onClick={() =>
          run(
            "rfi",
            () =>
              paService.respondToRFI(
                request.id,
                openRfi.id,
                store.documents
                  .filter((d) => d.patientId === request.patientId && d.type === "therapy-note")
                  .slice(0, 1)
                  .map((d) => d.id),
              ),
            "Document resupplied. The payer resumed review without restarting the request.",
          )
        }
      >
        Resupply requested document
      </Button>,
    );
  }

  if (flags.expiringSoon && can("request:submit")) {
    actions.push(
      <Button
        key="extend"
        loading={busy === "extend"}
        onClick={() =>
          run(
            "extend",
            () => paService.requestExtension(request.id, user!.id),
            "Extension granted. The authorization now covers the scheduled date.",
          )
        }
      >
        Request date extension
      </Button>,
    );
  }

  if (request.status === "eligibility-check" && can("request:submit")) {
    const alt = store.requests.find((r) => r.patientId === request.patientId)?.coverageId;
    actions.push(
      <Button
        key="coverage"
        loading={busy === "coverage"}
        onClick={() =>
          run(
            "coverage",
            () => paService.updateCoverage(request.id, alt ?? request.coverageId, user!.id),
            "Coverage updated. The case re-entered the waterfall.",
          )
        }
      >
        Update coverage &amp; re-run
      </Button>,
    );
  }

  if (can("clinical:attest") && request.status === "clinical-review") {
    actions.push(
      <Button
        key="attest"
        variant="primary"
        icon={<Stethoscope size={15} />}
        loading={busy === "attest"}
        onClick={() =>
          run(
            "attest",
            () =>
              paService.attestClinical(request.id, user!.id, {
                supported: true,
                note: "Concurrent pharmacologic management satisfies the intent of the conservative-therapy criterion. Attaching the full therapy record.",
                additionalDocumentIds: store.documents
                  .filter((d) => d.patientId === request.patientId && d.type === "therapy-note")
                  .map((d) => d.id),
              }),
            "Attested. The case has gone back to the agent to submit.",
          )
        }
      >
        Attest evidence &amp; return to agent
      </Button>,
      <Button
        key="not-supported"
        variant="ghost"
        loading={busy === "not-supported"}
        onClick={() =>
          run(
            "not-supported",
            () =>
              paService.attestClinical(request.id, user!.id, {
                supported: false,
                note: "Not clinically supported at this time.",
              }),
            "Withdrawn.",
          )
        }
      >
        Not clinically supported
      </Button>,
    );
  }

  if (can("appeal:approve") && request.status === "denied") {
    actions.push(
      <Button
        key="appeal"
        variant="primary"
        icon={<Gavel size={15} />}
        loading={busy === "appeal"}
        onClick={() =>
          run(
            "appeal",
            () =>
              paService.fileAppeal(request.id, {
                approvedByUserId: user!.id,
                argument:
                  "The denial rests on documentation that was present in the record but not retrieved at submission time. It is attached here, together with the full conservative-management record, which exceeds the policy threshold.",
                additionalDocumentIds: store.documents
                  .filter((d) => d.patientId === request.patientId && d.type === "therapy-note")
                  .map((d) => d.id),
              }),
            "Appeal filed, with your approval recorded against it.",
          )
        }
      >
        Approve &amp; file appeal
      </Button>,
    );
  }

  if (can("p2p:schedule") && ["denied", "appealed"].includes(request.status) && !peerToPeer) {
    actions.push(
      <Button
        key="p2p"
        icon={<Phone size={15} />}
        loading={busy === "p2p"}
        onClick={() =>
          run(
            "p2p",
            () => paService.requestPeerToPeer(request.id, user!.id),
            "Peer-to-peer requested. The payer offered three slots.",
          )
        }
      >
        Request peer-to-peer
      </Button>,
    );
  }

  /* ----------------------------- render ---------------------------- */

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "ai", label: "AI assist" },
    { id: "documents", label: "Documents", count: documents.length },
    { id: "channels", label: "Channels", count: request.attempts.length },
    { id: "messages", label: "Messages", count: communications.length },
    { id: "audit", label: "Audit", count: audit.length },
  ];

  return (
    <>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-content-brand hover:underline"
      >
        <ArrowLeft size={15} aria-hidden />
        {backLabel}
      </Link>

      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-display text-2xl font-semibold text-content">
            {request.caseNumber}
          </h1>
          <StatusBadge status={request.status} />
          {request.urgency === "expedited" && <Badge tone="danger">Expedited · 72h</Badge>}
          {flags.slaBreached && (
            <Badge tone="danger">
              <AlertTriangle size={12} aria-hidden />
              Past decision deadline
            </Badge>
          )}
          {flags.expiringSoon && <Badge tone="signal">Expires before service date</Badge>}
        </div>
        <p className="mt-1.5 text-sm text-content-secondary">
          {patient?.firstName} {patient?.lastName} · {request.serviceLines[0]?.code}{" "}
          {request.serviceLines[0]?.display} · {payer?.name}
        </p>
      </header>

      <Card className="mb-5">
        <CardBody>
          <StatusTrack request={request} />
        </CardBody>
      </Card>

      {message && (
        <Callout
          tone={message.tone === "ok" ? "accent" : "danger"}
          icon={message.tone === "ok" ? <Check size={15} /> : <X size={15} />}
        >
          {message.text}
        </Callout>
      )}

      {actions.length > 0 && (
        <div className="my-5 flex flex-wrap gap-2">{actions}</div>
      )}

      {request.status === "clinical-review" && (
        <Callout tone="signal" icon={<ShieldAlert size={15} />} title="This needs a licensed clinician">
          The agent found a gap it is not permitted to close. It reports what it
          found and what is missing; it does not decide whether the service is
          medically necessary.
        </Callout>
      )}

      {request.status === "denied" && (
        <Callout tone="danger" icon={<ShieldAlert size={15} />} title="Denial — routed to a person">
          Every denial goes to a licensed human. The agent has drafted an
          appeal, but it cannot be filed without clinical sign-off.
        </Callout>
      )}

      <div className="mt-5">
        <Tabs tabs={tabs} active={tab} onChange={setTab} label="Case sections" />
      </div>

      <div className="mt-5 space-y-5">
        {tab === "overview" && (
          <>
            <Card>
              <CardHeader title="Request" />
              <CardBody>
                <RequestSummary request={request} />
              </CardBody>
            </Card>

            {decision && (
              <Card>
                <CardHeader
                  title="Determination"
                  action={
                    <Badge
                      tone={
                        decision.outcome === "approved"
                          ? "accent"
                          : decision.outcome === "partially-approved"
                            ? "aqua"
                            : decision.outcome === "denied"
                              ? "danger"
                              : "signal"
                      }
                    >
                      {decision.outcome.replace("-", " ")}
                    </Badge>
                  }
                />
                <CardBody className="space-y-4">
                  <KeyValue
                    columns={3}
                    items={[
                      { label: "Authorization number", value: decision.authorizationNumber ?? "—" },
                      {
                        label: "Valid",
                        value:
                          decision.validFrom && decision.validTo
                            ? `${fullDate(decision.validFrom)} – ${fullDate(decision.validTo)}`
                            : "—",
                      },
                      { label: "Approved units", value: decision.approvedUnits ?? "—" },
                      { label: "Decided", value: dateTime(decision.decidedAt) },
                      { label: "Decided by", value: decision.decidedByName ?? "—" },
                      { label: "Payer reference", value: decision.payerRef ?? "—" },
                    ]}
                  />

                  {decision.reasonCodes.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-content-muted">
                        Reason codes
                      </p>
                      <ul className="space-y-1.5">
                        {decision.reasonCodes.map((rc) => (
                          <li key={`${rc.system}-${rc.code}`} className="text-sm">
                            <span className="font-mono text-xs font-semibold text-content">
                              {rc.system} {rc.code}
                            </span>
                            <span className="ml-2 text-content-secondary">{rc.display}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
                      Rationale
                    </p>
                    <p className="text-sm leading-relaxed text-content-secondary">
                      {decision.rationale}
                    </p>
                  </div>

                  {decision.appealDeadline && (
                    <p className="text-xs text-content-muted">
                      Appeal must be filed by {fullDate(decision.appealDeadline)} (
                      {relative(decision.appealDeadline)}).
                    </p>
                  )}

                  {flags.expiringSoon && (
                    <Callout tone="signal" icon={<AlertTriangle size={15} />}>
                      This authorization is valid to {fullDate(decision.validTo)}, but the
                      service is scheduled for {fullDate(request.scheduledServiceDate)} — four
                      days after it lapses.
                    </Callout>
                  )}
                </CardBody>
              </Card>
            )}

            {appeals.length > 0 && (
              <Card>
                <CardHeader title="Appeals" />
                <CardBody className="space-y-4">
                  {appeals.map((a) => (
                    <div key={a.id} className="rounded-lg border border-line px-3.5 py-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-content">{a.levelLabel}</span>
                        <Badge
                          tone={
                            a.status === "overturned"
                              ? "accent"
                              : a.status === "upheld"
                                ? "danger"
                                : a.status === "draft"
                                  ? "neutral"
                                  : "brand"
                          }
                        >
                          {a.status.replace("-", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-content-secondary">{a.argument}</p>
                      <p className="mt-2 text-xs text-content-muted">
                        {a.filedAt ? `Filed ${fullDate(a.filedAt)} · ` : "Not yet filed · "}
                        Response due {fullDate(a.dueAt)}
                        {a.approvedByUserId &&
                          ` · approved by ${store.users.find((u) => u.id === a.approvedByUserId)?.name}`}
                      </p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}

            {peerToPeer && (
              <Card>
                <CardHeader
                  title="Peer-to-peer review"
                  action={<Badge tone="signal">{peerToPeer.status}</Badge>}
                />
                <CardBody className="space-y-3">
                  <KeyValue
                    items={[
                      { label: "Payer reviewer", value: peerToPeer.payerReviewerName ?? "—" },
                      {
                        label: "Our clinician",
                        value: store.users.find((u) => u.id === peerToPeer.providerUserId)?.name ?? "—",
                      },
                      { label: "Requested", value: dateTime(peerToPeer.requestedAt) },
                      {
                        label: "Scheduled",
                        value: peerToPeer.scheduledAt
                          ? `${dateTime(peerToPeer.scheduledAt)} (${peerToPeer.durationMinutes} min)`
                          : "Not yet scheduled",
                      },
                    ]}
                  />

                  {peerToPeer.status === "requested" && can("p2p:schedule") && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
                        Slots the payer offered
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {peerToPeer.offeredSlots.map((slot) => (
                          <Button
                            key={slot}
                            size="sm"
                            loading={busy === slot}
                            onClick={() =>
                              run(
                                slot,
                                () => paService.schedulePeerToPeer(peerToPeer.id, slot),
                                "Peer-to-peer scheduled.",
                              )
                            }
                          >
                            {dateTime(slot)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {peerToPeer.notes && (
                    <p className="text-sm leading-relaxed text-content-secondary">
                      {peerToPeer.notes}
                    </p>
                  )}

                  <AssumptionNote>
                    Appeal levels and peer-to-peer scheduling are thinly specified in
                    the source material — it names them as outcomes but gives no
                    levels, deadlines or mechanics. This flow is an assumption.
                  </AssumptionNote>
                </CardBody>
              </Card>
            )}
          </>
        )}

        {tab === "ai" &&
          (assessment ? (
            <AiPanel
              assessment={assessment}
              documents={documents}
              threshold={store.policy.autoSubmitThreshold}
              readOnly={!can("request:submit") && !can("clinical:attest")}
            />
          ) : (
            <Card>
              <EmptyState
                icon={<FileText size={28} />}
                title="No AI assessment yet"
                description="The agent runs its assessment once the documentation packet is assembled."
                action={
                  can("request:submit") ? (
                    <Button
                      variant="primary"
                      loading={busy === "assess"}
                      onClick={() =>
                        run(
                          "assess",
                          () => paService.generateAssessment(request.id),
                          "Assessment generated.",
                        )
                      }
                    >
                      Run assessment
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ))}

        {tab === "documents" && (
          <Card>
            <CardHeader
              title="Documentation packet"
              description="Only the items the matched payer rule asked for. Prior authorization is a payment disclosure, so the whole chart never travels."
            />
            {documents.length === 0 ? (
              <EmptyState
                icon={<Paperclip size={28} />}
                title="No documents attached"
                description="The agent attaches documents once the payer's required-document list is known."
              />
            ) : (
              <ul className="divide-y divide-line-subtle">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                    <FileText size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-content">{d.title}</span>
                        {d.requiredByRule ? (
                          <Badge tone="accent">Required by rule</Badge>
                        ) : (
                          <Badge tone="neutral">Supplementary</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-content-muted">
                        {d.pages} pages · {bytes(d.sizeBytes)} · from {d.source} ·{" "}
                        {fullDate(d.uploadedAt)}
                        {d.loincCode && ` · LOINC ${d.loincCode}`}
                      </p>
                      <p className="mt-0.5 break-all font-mono text-[10px] text-content-muted">
                        {d.sha256.slice(0, 32)}…
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "channels" && (
          <>
            <Card>
              <CardHeader
                title="Submission attempts"
                description="Every attempt is recorded, including the ones that failed — that is how the routing stays explainable."
              />
              {request.attempts.length === 0 ? (
                <EmptyState
                  title="Not yet submitted"
                  description="Attempts appear here once the case goes to the payer."
                />
              ) : (
                <ol className="divide-y divide-line-subtle">
                  {request.attempts.map((a, i) => (
                    <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                      <span
                        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-inset text-xs font-semibold tabular-nums text-content-muted"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <ChannelBadge channel={a.channel} />
                          <Badge
                            tone={
                              a.outcome === "succeeded"
                                ? "accent"
                                : a.outcome === "failed"
                                  ? "danger"
                                  : "signal"
                            }
                          >
                            {a.outcome}
                          </Badge>
                          {a.externalRef && (
                            <span className="font-mono text-xs text-content-muted">
                              {a.externalRef}
                            </span>
                          )}
                        </div>
                        {a.errorMessage && (
                          <p className="mt-1 text-xs leading-relaxed text-content-danger">
                            {a.errorMessage}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-content-muted">
                          {dateTime(a.startedAt)} · via {a.connectorId}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Routes available for this payer"
                description="The waterfall tries these in order. A route whose connection is not usable is skipped rather than attempted."
              />
              <ol className="divide-y divide-line-subtle">
                {routes.map((r, i) => (
                  <li key={`${r.instanceId}-${i}`} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-inset text-xs font-semibold tabular-nums text-content-muted"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ChannelBadge channel={r.channel} />
                        <span className="text-sm font-medium text-content">{r.label}</span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-content-muted">
                        {r.rationale}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </>
        )}

        {tab === "messages" && (
          <Card>
            <CardHeader title="Messages and information requests" />
            {communications.length === 0 ? (
              <EmptyState
                icon={<MessageSquare size={28} />}
                title="No messages"
                description="Payer correspondence on this case appears here."
              />
            ) : (
              <ul className="divide-y divide-line-subtle">
                {communications.map((c) => (
                  <li key={c.id} className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-content">{c.subject}</span>
                      <Badge tone={c.status === "open" ? "signal" : "neutral"}>{c.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-content-muted">
                      {c.sender} · {dateTime(c.sentAt)}
                      {c.dueAt && ` · response due ${fullDate(c.dueAt)}`}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-content-secondary">{c.body}</p>

                    {c.requestedItems && c.requestedItems.length > 0 && (
                      <ul className="mt-2.5 space-y-1.5">
                        {c.requestedItems.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-lg bg-surface-inset px-3 py-2 text-xs"
                          >
                            <span className="font-semibold text-content">{item.label}</span>
                            <span className="mt-0.5 block text-content-muted">{item.reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "audit" && (
          <Card>
            <CardHeader
              title="Audit trail"
              description="Append-only and hash-chained. Every action carries an actor, a timestamp and — where it left our boundary — a reference number."
            />
            {audit.length === 0 ? (
              <EmptyState title="No audit entries for this case yet" />
            ) : (
              <ol className="divide-y divide-line-subtle">
                {audit.map((e) => (
                  <li key={e.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-content-brand">
                        {e.action}
                      </span>
                      <span className="text-xs text-content-muted">{dateTime(e.at)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-content">{e.summary}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
                      <span>
                        {e.actorName}
                        <Badge tone="neutral" className="ml-1.5">
                          {e.actorType}
                        </Badge>
                      </span>
                      {e.externalRef && (
                        <span className="font-mono">ref {e.externalRef}</span>
                      )}
                      {typeof e.metadata?.latencyMs === "number" && (
                        <span>{latency(e.metadata.latencyMs)}</span>
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
