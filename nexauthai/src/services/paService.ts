/**
 * The prior-authorization service.
 *
 * This is where the rules the source material insists on are actually
 * enforced, rather than merely described:
 *
 * - `submit` walks the waterfall in cost order and records which channel
 *   resolved the case, including the attempts that failed.
 * - `submit` refuses to create a second authorization for the same
 *   idempotency key.
 * - `recordDecision` will not record a denial or partial approval without a
 *   named human reviewer.
 * - The requirement check never defaults to "not required"; an unknown
 *   answer stays unknown and routes to a human.
 */

import { getConnection, getConnector, routesForPayer } from "@/connectors/registry";
import type { Route } from "@/connectors/registry";
import type { RequirementResult } from "@/connectors/types";
import { NOW, SERVICE_CATALOG, payers, store } from "@/mocks";
import type {
  AIAssessment,
  Appeal,
  AuditEvent,
  Channel,
  ClinicalDocument,
  Communication,
  Decision,
  Diagnosis,
  PaStatus,
  PeerToPeer,
  PriorAuthRequest,
  RequestFlags,
  ServiceLine,
  SubmissionAttempt,
  Task,
  Urgency,
} from "@/types";
import { ApiError, simulate, snapshot } from "./http";
import { directoryService } from "./directory";

/* ------------------------------------------------------------------ *
 * Derived helpers
 * ------------------------------------------------------------------ */

/**
 * SLA and expiry flags are computed, never stored — "expiring soon" is a
 * derived condition (valid-to before the service date), not a status.
 */
export function computeFlags(req: PriorAuthRequest, decision?: Decision): RequestFlags {
  const now = NOW.getTime();

  let hoursRemaining: number | null = null;
  let slaBreached = false;
  let slaAtRisk = false;

  if (req.decisionDueAt && !TERMINAL.includes(req.status)) {
    const due = new Date(req.decisionDueAt).getTime();
    hoursRemaining = (due - now) / 3_600_000;
    slaBreached = hoursRemaining < 0;
    const window = req.urgency === "expedited" ? 72 : 168;
    slaAtRisk = !slaBreached && hoursRemaining < window * 0.25;
  }

  const expiringSoon = Boolean(
    decision?.validTo &&
      req.scheduledServiceDate &&
      new Date(decision.validTo).getTime() < new Date(req.scheduledServiceDate).getTime(),
  );

  return { expiringSoon, slaBreached, slaAtRisk, hoursRemaining };
}

const TERMINAL: PaStatus[] = [
  "no-auth-required",
  "approved",
  "partially-approved",
  "denied",
  "withdrawn",
  "expired",
];

/** The five plain statuses practice staff see, mapped from the machine state. */
export function staffStatus(req: PriorAuthRequest, flags: RequestFlags): string {
  if (req.status === "no-auth-required") return "No authorization required";
  if (req.status === "clinical-review") return "Clinical review required";
  if (flags.expiringSoon && (req.status === "approved" || req.status === "partially-approved"))
    return "Expiring soon";
  if (req.status === "approved") return "Approved";
  if (req.status === "partially-approved") return "Partially approved";
  if (req.status === "denied") return "Denied";
  if (["submitted", "in-review", "pended", "submitting"].includes(req.status))
    return "Submitted — pending";
  if (req.status === "appealed") return "Appealed";
  if (req.status === "peer-to-peer") return "Peer-to-peer";
  if (req.status === "needs-approval") return "Waiting for release";
  if (req.status === "draft") return "Draft";
  return "In progress";
}

/* ------------------------------------------------------------------ *
 * Audit
 * ------------------------------------------------------------------ */

function hashOf(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0").repeat(4);
}

export function appendAudit(
  entry: Omit<AuditEvent, "id" | "at" | "prevHash" | "hash">,
): AuditEvent {
  const prev = store.audit[0];
  const at = new Date().toISOString();
  const id = `aud-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const prevHash = prev ? prev.hash : "0".repeat(32);
  const event: AuditEvent = {
    ...entry,
    id,
    at,
    prevHash,
    hash: hashOf(`${prevHash}|${id}|${at}|${entry.action}|${entry.targetId}`),
  };
  store.audit.unshift(event);
  return event;
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export interface RequestFilter {
  status?: PaStatus[];
  payerId?: string;
  patientId?: string;
  orderingProviderId?: string;
  urgency?: Urgency;
  search?: string;
  /** Payer-side callers see only their own payer's submitted work. */
  payerScope?: string;
}

export interface RequestDetail {
  request: PriorAuthRequest;
  flags: RequestFlags;
  assessment?: AIAssessment;
  decision?: Decision;
  documents: ClinicalDocument[];
  communications: Communication[];
  appeals: Appeal[];
  peerToPeer?: PeerToPeer;
  tasks: Task[];
  audit: AuditEvent[];
  routes: Route[];
}

export const paService = {
  async list(filter: RequestFilter = {}): Promise<PriorAuthRequest[]> {
    return simulate(() => {
      let rows = store.requests;

      if (filter.payerScope) {
        // A payer only ever sees what was actually submitted to it.
        rows = rows.filter(
          (r) =>
            r.payerId === filter.payerScope &&
            ["submitted", "in-review", "pended", "approved", "partially-approved", "denied", "appealed", "peer-to-peer"].includes(
              r.status,
            ),
        );
      }
      if (filter.status?.length) rows = rows.filter((r) => filter.status!.includes(r.status));
      if (filter.payerId) rows = rows.filter((r) => r.payerId === filter.payerId);
      if (filter.patientId) rows = rows.filter((r) => r.patientId === filter.patientId);
      if (filter.orderingProviderId)
        rows = rows.filter((r) => r.orderingProviderId === filter.orderingProviderId);
      if (filter.urgency) rows = rows.filter((r) => r.urgency === filter.urgency);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        rows = rows.filter((r) => {
          const patient = directoryService.sync.patientName(r.patientId).toLowerCase();
          return (
            r.caseNumber.toLowerCase().includes(q) ||
            patient.includes(q) ||
            r.serviceLines.some((s) => s.code.includes(q) || s.display.toLowerCase().includes(q))
          );
        });
      }
      return snapshot(rows);
    }, 220, 560);
  },

  async get(id: string): Promise<RequestDetail | undefined> {
    return simulate(() => {
      const request = store.requests.find((r) => r.id === id);
      if (!request) return undefined;

      const decision = store.decisions.find((d) => d.requestId === id);
      const detail: RequestDetail = {
        request: snapshot(request),
        flags: computeFlags(request, decision),
        assessment: snapshot(store.assessments.find((a) => a.requestId === id)),
        decision: snapshot(decision),
        documents: snapshot(
          store.documents.filter((d) => request.documentIds.includes(d.id)),
        ),
        communications: snapshot(store.communications.filter((c) => c.requestId === id)),
        appeals: snapshot(store.appeals.filter((a) => a.requestId === id)),
        peerToPeer: snapshot(store.peerToPeers.find((p) => p.requestId === id)),
        tasks: snapshot(store.tasks.filter((t) => t.requestId === id)),
        audit: snapshot(store.audit.filter((e) => e.targetId === id || e.metadata?.requestId === id)),
        routes: routesForPayer(request.payerId),
      };
      return detail;
    }, 260, 620);
  },

  async listTasks(role?: string, userId?: string): Promise<Task[]> {
    return simulate(() => {
      let rows = store.tasks.filter((t) => t.status !== "cancelled");
      if (role) rows = rows.filter((t) => t.assignedRole === role);
      if (userId) rows = rows.filter((t) => !t.assignedToUserId || t.assignedToUserId === userId);
      return snapshot(rows);
    }, 180, 420);
  },

  /* ---------------------------------------------------------------- *
   * Wizard steps
   * ---------------------------------------------------------------- */

  /** Step 2 — eligibility, via the clearinghouse. */
  async checkEligibility(patientId: string, coverageId: string) {
    const coverage = directoryService.sync.coverage(coverageId);
    if (!coverage) throw new ApiError("Coverage not found", 404, "not_found");

    const conn = getConnection("ci-availity");
    const connector = getConnector("con-availity-x12");
    if (!conn || !connector?.checkEligibility)
      throw new ApiError("No eligibility route available", 503, "payer_unavailable");

    const result = await connector.checkEligibility(conn, {
      patientId,
      memberId: coverage.memberId,
      payerId: coverage.payerId,
      serviceDate: new Date().toISOString().slice(0, 10),
      serviceCodes: [],
    });

    return result;
  },

  /**
   * Step 3 — is prior authorization required?
   *
   * Tries the payer's own CRD surface first, then the clearinghouse. If
   * neither answers, the result is "unknown" — which routes to a human. It
   * is never silently turned into "not required".
   */
  async checkRequirement(payerId: string, serviceCodes: string[], diagnosisCodes: string[]) {
    const routes = routesForPayer(payerId).filter((r) => r.channel === "electronic");

    for (const route of routes) {
      const conn = getConnection(route.instanceId);
      const connector = getConnector(route.connectorId, payerId);
      if (!conn || !connector?.isPARequired) continue;

      const result = await connector.isPARequired(conn, {
        patientId: "",
        memberId: "",
        payerId,
        serviceCodes,
        diagnosisCodes,
        placeOfService: "11",
        orderingProviderNpi: "",
      });
      if (result.ok && result.data) return { result, route };
    }

    const unknown: RequirementResult = {
      paRequired: "unknown",
      source: "payer-matrix",
      referenceNumber: "—",
      determinedAt: new Date().toISOString(),
      questionnaireAvailable: false,
      requiredDocuments: [],
      note: "No electronic route could answer. The case routes to a human rather than assuming no authorization is needed.",
    };

    return {
      result: {
        ok: true as const,
        data: unknown,
        meta: {
          connectorId: "none",
          instanceId: "none",
          latencyMs: 0,
          at: new Date().toISOString(),
          via: "rest" as const,
        },
      },
      route: undefined,
    };
  },

  /** Step 4 — fetch the DTR questionnaire, where the payer publishes one. */
  async getQuestionnaire(payerId: string, serviceCodes: string[]) {
    const route = routesForPayer(payerId).find((r) => r.channel === "electronic");
    if (!route) return undefined;
    const conn = getConnection(route.instanceId);
    const connector = getConnector(route.connectorId, payerId);
    if (!conn || !connector?.getQuestionnaire) return undefined;
    const res = await connector.getQuestionnaire(conn, {
      payerId,
      serviceCodes,
      diagnosisCodes: [],
      patientId: "",
    });
    return res.ok ? res.data : undefined;
  },

  /** Step 5 — pull only the documents the matched rule asked for. */
  async fetchDocuments(patientId: string, types: string[]): Promise<ClinicalDocument[]> {
    const conn = getConnection("ci-epic-prod");
    const connector = getConnector("con-epic");
    if (!conn || !connector?.fetchDocuments) return [];
    const res = await connector.fetchDocuments(conn, { patientId, types });
    return res.ok && res.data ? res.data : [];
  },

  /* ---------------------------------------------------------------- *
   * Create
   * ---------------------------------------------------------------- */

  async create(input: {
    patientId: string;
    coverageId: string;
    payerId: string;
    orderingProviderId: string;
    serviceCodes: string[];
    diagnosisCodes: { code: string; display: string }[];
    urgency: Urgency;
    scheduledServiceDate?: string;
    documentIds: string[];
    paRequired?: boolean | "unknown";
    requirementRef?: string;
    requirementSource?: PriorAuthRequest["requirementSource"];
  }): Promise<PriorAuthRequest> {
    const idempotencyKey = `${"t-northside"}:ord-${Date.now()}:${input.serviceCodes[0]}`;

    // Inquire before submit: the same patient + code must not open a second case.
    const duplicate = store.requests.find(
      (r) =>
        r.patientId === input.patientId &&
        r.serviceLines.some((s) => input.serviceCodes.includes(s.code)) &&
        !TERMINAL.includes(r.status),
    );
    if (duplicate) {
      throw new ApiError(
        `An open request already exists for this patient and service (${duplicate.caseNumber}). A second authorization would be a duplicate.`,
        409,
        "duplicate_request",
      );
    }

    const n = 1070 + store.requests.filter((r) => r.caseNumber.startsWith("NA-10")).length;
    const id = `req-${n}`;

    const diagnoses: Diagnosis[] = input.diagnosisCodes.map((d, i) => ({
      id: `dx-${n}-${i + 1}`,
      code: d.code,
      display: d.display,
      rank: i + 1,
    }));

    const serviceLines: ServiceLine[] = input.serviceCodes.map((code, i) => {
      const meta = SERVICE_CATALOG[code] ?? {
        display: code,
        system: "CPT" as const,
        unit: "units" as const,
      };
      return {
        id: `sl-${n}-${i + 1}`,
        code,
        codeSystem: meta.system,
        display: meta.display,
        placeOfService: "11",
        quantity: 1,
        unit: meta.unit,
        startDate: input.scheduledServiceDate ?? new Date().toISOString().slice(0, 10),
        diagnosisIds: diagnoses.map((d) => d.id),
      };
    });

    const request: PriorAuthRequest = {
      id,
      tenantId: "t-northside",
      caseNumber: `NA-${n}`,
      patientId: input.patientId,
      coverageId: input.coverageId,
      payerId: input.payerId,
      orderingProviderId: input.orderingProviderId,
      organizationId: "org-northside",
      status: input.paRequired === false ? "no-auth-required" : "documentation",
      urgency: input.urgency,
      serviceLines,
      diagnoses,
      documentIds: input.documentIds,
      paRequired: input.paRequired === "unknown" ? undefined : input.paRequired,
      requirementSource: input.requirementSource,
      requirementRef: input.requirementRef,
      requirementCheckedAt: new Date().toISOString(),
      attempts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledServiceDate: input.scheduledServiceDate,
      idempotencyKey,
      version: 1,
    };

    return simulate(() => {
      store.requests.unshift(request);
      appendAudit({
        tenantId: request.tenantId,
        actorId: "usr-dana",
        actorName: "Dana Whitaker",
        actorType: "user",
        action: "request.created",
        targetType: "PriorAuthRequest",
        targetId: id,
        summary: `Request opened for ${serviceLines[0].code} — ${serviceLines[0].display}`,
        metadata: { idempotencyKey },
      });
      if (input.paRequired === false) {
        appendAudit({
          tenantId: request.tenantId,
          actorId: "agent:coverage",
          actorName: "Coverage agent",
          actorType: "agent",
          action: "requirement.determined",
          targetType: "PriorAuthRequest",
          targetId: id,
          externalRef: input.requirementRef,
          summary: "No prior authorization required — evidenced, logged and written back to the chart",
          metadata: { source: input.requirementSource ?? "crd", paRequired: false },
        });
      }
      return snapshot(request);
    }, 320, 700);
  },

  /* ---------------------------------------------------------------- *
   * AI assessment
   * ---------------------------------------------------------------- */

  /**
   * Generates an assessment for a case that has none.
   *
   * The scoring is a transparent weighted sum over the same components the
   * fixtures use, so a freshly created case produces a score the UI can
   * explain component by component — not an opaque number.
   */
  async generateAssessment(requestId: string): Promise<AIAssessment> {
    const request = store.requests.find((r) => r.id === requestId);
    if (!request) throw new ApiError("Request not found", 404, "not_found");

    const existing = store.assessments.find((a) => a.requestId === requestId);
    if (existing) return simulate(() => snapshot(existing), 400, 900);

    const criteria = await directoryService.findCriteria(
      request.payerId,
      request.serviceLines.map((s) => s.code),
    );
    const docs = store.documents.filter((d) => request.documentIds.includes(d.id));

    const requiredTypes = criteria?.requiredDocuments.filter((d) => d.required) ?? [];
    const presentTypes = new Set(docs.map((d) => d.type));
    const completeness = requiredTypes.length
      ? requiredTypes.filter((d) => presentTypes.has(d.type as ClinicalDocument["type"])).length /
        requiredTypes.length
      : 1;

    const components = [
      { key: "rule-match" as const, label: "Rule match", score: criteria ? 1 : 0.4, weight: 0.2, explanation: criteria ? `Exact policy match (${criteria.policyNumber} v${criteria.version}).` : "No exact policy found; fell back to the payer matrix." },
      { key: "packet-completeness" as const, label: "Packet completeness", score: completeness, weight: 0.25, explanation: `${docs.length} document(s) attached against ${requiredTypes.length} required type(s).` },
      { key: "extraction-certainty" as const, label: "Extraction certainty", score: 0.9, weight: 0.2, explanation: "Lowest field confidence across extracted answers." },
      { key: "identity-match" as const, label: "Identity match", score: 1, weight: 0.1, explanation: "Patient, member ID and ordering NPI agree across sources." },
      { key: "route-reliability" as const, label: "Route reliability", score: 0.95, weight: 0.1, explanation: "Primary electronic route healthy." },
      { key: "prior-outcomes" as const, label: "Prior outcomes", score: 0.78, weight: 0.15, explanation: "Historical first-pass approval rate for this payer and code." },
    ];

    const overall = Number(
      components.reduce((sum, c) => sum + c.score * c.weight, 0).toFixed(2),
    );

    const matches = (criteria?.criteria ?? []).map((c) => ({
      criterionId: c.id,
      label: c.label,
      status: (completeness >= 1 ? "met" : "unclear") as "met" | "unclear",
      confidence: completeness >= 1 ? 0.92 : 0.66,
      evidence: docs.slice(0, 1).map((d) => ({ documentId: d.id, span: "p.1" })),
      note:
        completeness >= 1
          ? "Evidenced in the attached documentation."
          : "Could not be confirmed from the documents attached so far.",
    }));

    const missing = requiredTypes
      .filter((t) => !presentTypes.has(t.type as ClinicalDocument["type"]))
      .map((t) => ({
        id: `miss-${requestId}-${t.type}`,
        label: t.label,
        reason: `Policy ${criteria?.policyNumber ?? ""} lists this as a required document.`,
        severity: "blocking" as const,
        resolvableBy: "agent" as const,
      }));

    const recommendation =
      missing.length > 0
        ? ("gather-more-documentation" as const)
        : overall >= store.policy.autoSubmitThreshold
          ? ("ready-to-submit" as const)
          : ("escalate-clinical-review" as const);

    const assessment: AIAssessment = {
      id: `ai-${requestId.replace("req-", "")}`,
      tenantId: request.tenantId,
      requestId,
      generatedAt: new Date().toISOString(),
      modelVersion: "nexauth-extract-2026.09",
      promptVersion: "pa-extract/v7",
      extractedFacts: docs.slice(0, 4).map((d, i) => ({
        id: `f-${requestId}-${i}`,
        label: d.type === "therapy-note" ? "Conservative therapy documented" : d.type === "imaging-report" ? "Prior imaging" : "Clinical history",
        value: d.title,
        confidence: 0.88 + i * 0.02,
        sourceDocumentId: d.id,
        sourceSpan: "p.1",
        category: d.type === "imaging-report" ? "imaging" : d.type === "therapy-note" ? "treatment" : "history",
      })),
      criteriaMatches: matches,
      missingDocuments: missing,
      evidenceGaps: [],
      confidence: { overall, components },
      recommendation,
      rationale:
        missing.length > 0
          ? `${missing.length} required document type(s) are not attached. The agent recommends retrieving them before submitting.`
          : overall >= store.policy.autoSubmitThreshold
            ? `All criteria in the matched policy are evidenced and confidence ${overall} clears the tenant threshold of ${store.policy.autoSubmitThreshold}.`
            : `Confidence ${overall} is below the tenant threshold of ${store.policy.autoSubmitThreshold}. Routed to a licensed reviewer rather than submitted.`,
      draftLetter: criteria
        ? {
            subject: `Medical necessity — ${request.serviceLines[0].display} (${request.serviceLines[0].code}), ${directoryService.sync.patientName(request.patientId)}`,
            body: `To the Medical Director, ${directoryService.sync.payer(request.payerId)?.name}:

I am requesting prior authorization for ${request.serviceLines[0].display} (${request.serviceLines[0].codeSystem} ${request.serviceLines[0].code}) for this member, who presents with ${request.diagnoses[0]?.display.toLowerCase() ?? "the documented condition"}.

The attached documentation addresses each criterion in policy ${criteria.policyNumber} v${criteria.version}. ${docs.length} supporting document(s) accompany this request, limited to the items your policy specifies.

I am available for a peer-to-peer discussion at your convenience.`,
            citedFactIds: [],
            generatedAt: new Date().toISOString(),
          }
        : undefined,
    };

    return simulate(() => {
      store.assessments.push(assessment);
      request.aiAssessmentId = assessment.id;
      request.updatedAt = new Date().toISOString();
      appendAudit({
        tenantId: request.tenantId,
        actorId: "agent:decision",
        actorName: "Decision agent",
        actorType: "agent",
        action: "assessment.generated",
        targetType: "AIAssessment",
        targetId: assessment.id,
        summary: `Confidence ${overall} — ${recommendation.replace(/-/g, " ")}`,
        metadata: { confidence: overall, requestId },
      });
      return snapshot(assessment);
    }, 900, 1800);
  },

  /* ---------------------------------------------------------------- *
   * Submission waterfall
   * ---------------------------------------------------------------- */

  /**
   * Walks the cost-ordered waterfall. Every attempt — successful or not —
   * is recorded on the case, so the UI can show *how* a case was resolved,
   * not just that it was.
   */
  async submit(
    requestId: string,
    opts: { approvedByUserId?: string } = {},
  ): Promise<{ request: PriorAuthRequest; attempts: SubmissionAttempt[]; resolvedBy?: Channel }> {
    const request = store.requests.find((r) => r.id === requestId);
    if (!request) throw new ApiError("Request not found", 404, "not_found");

    if (request.attempts.some((a) => a.outcome === "succeeded")) {
      throw new ApiError(
        "This request has already been submitted. Submitting again would create a duplicate authorization.",
        409,
        "already_submitted",
      );
    }

    // The automation gate: kill switch → trust mode → confidence threshold.
    const assessment = store.assessments.find((a) => a.requestId === requestId);
    const trust = store.policy.trustByPayer[request.payerId] ?? "shadow";
    const confidence = assessment?.confidence.overall ?? 0;
    const needsRelease =
      store.policy.killSwitch ||
      trust === "shadow" ||
      confidence < store.policy.autoSubmitThreshold;

    if (needsRelease && !opts.approvedByUserId) {
      request.status = "needs-approval";
      request.updatedAt = new Date().toISOString();
      appendAudit({
        tenantId: request.tenantId,
        actorId: "agent:decision",
        actorName: "Decision agent",
        actorType: "agent",
        action: "submission.held",
        targetType: "PriorAuthRequest",
        targetId: requestId,
        summary: store.policy.killSwitch
          ? "Held — kill switch is on"
          : trust === "shadow"
            ? "Held — payer is in Shadow mode"
            : `Held — confidence ${confidence} is below the ${store.policy.autoSubmitThreshold} threshold`,
        metadata: { trustMode: trust, confidence },
      });
      return simulate(
        () => ({ request: snapshot(request), attempts: [], resolvedBy: undefined }),
        300,
        600,
      );
    }

    request.status = "submitting";
    const routes = routesForPayer(request.payerId);
    const coverage = directoryService.sync.coverage(request.coverageId);
    const attempts: SubmissionAttempt[] = [];
    let resolvedBy: Channel | undefined;

    for (const route of routes) {
      if (route.channel === "human") {
        // The floor. Nothing is sent; a task is raised instead.
        const attempt: SubmissionAttempt = {
          id: `att-${requestId}-${attempts.length + 1}`,
          requestId,
          channel: "human",
          connectorId: "manual",
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          outcome: "in-progress",
        };
        attempts.push(attempt);
        store.tasks.unshift({
          id: `tsk-${Date.now()}`,
          tenantId: request.tenantId,
          requestId,
          kind: "admin-exception",
          title: "No automated channel could reach this payer",
          reason: "Every electronic, portal and voice route failed. A staff member must take this one manually.",
          assignedRole: "provider-staff",
          priority: "high",
          createdAt: new Date().toISOString(),
          status: "open",
        });
        break;
      }

      const conn = getConnection(route.instanceId);
      const connector = getConnector(route.connectorId, request.payerId);
      if (!conn || !connector?.submitPA) continue;

      const startedAt = new Date().toISOString();
      const res = await connector.submitPA(conn, {
        requestId,
        caseNumber: request.caseNumber,
        patientId: request.patientId,
        memberId: coverage?.memberId ?? "",
        payerId: request.payerId,
        serviceCodes: request.serviceLines.map((s) => s.code),
        diagnosisCodes: request.diagnoses.map((d) => d.code),
        documentIds: request.documentIds,
        urgency: request.urgency,
        idempotencyKey: request.idempotencyKey,
      });

      const attempt: SubmissionAttempt = {
        id: `att-${requestId}-${attempts.length + 1}`,
        requestId,
        channel: route.channel,
        connectorId: route.connectorId,
        startedAt,
        endedAt: new Date().toISOString(),
        outcome: res.ok ? "succeeded" : "failed",
        externalRef: res.data?.externalRef,
        errorCode: res.error?.code,
        errorMessage: res.error?.message,
      };
      attempts.push(attempt);

      appendAudit({
        tenantId: request.tenantId,
        actorId: "agent:submission",
        actorName: "Submission agent",
        actorType: "agent",
        action: res.ok ? "request.submitted" : "channel.failed",
        targetType: "PriorAuthRequest",
        targetId: requestId,
        externalRef: res.data?.externalRef,
        summary: res.ok
          ? `Submitted via ${route.label} (${route.channel})`
          : `${route.label} failed: ${res.error?.message ?? "unknown"} — falling through to the next channel`,
        metadata: { channel: route.channel, connector: route.connectorId, latencyMs: res.meta.latencyMs },
      });

      if (res.ok && res.data) {
        resolvedBy = route.channel;
        request.status = "submitted";
        request.submittedAt = res.data.submittedAt;
        request.decisionDueAt =
          res.data.expectedDecisionBy ??
          new Date(
            Date.now() + (request.urgency === "expedited" ? 72 : 168) * 3_600_000,
          ).toISOString();
        break;
      }
    }

    request.attempts = [...request.attempts, ...attempts];
    request.updatedAt = new Date().toISOString();
    request.version += 1;
    if (!resolvedBy && request.status === "submitting") request.status = "documentation";

    // Releasing a held submission is itself an audited human action.
    if (opts.approvedByUserId) {
      appendAudit({
        tenantId: request.tenantId,
        actorId: opts.approvedByUserId,
        actorName: store.users.find((u) => u.id === opts.approvedByUserId)?.name ?? "Staff",
        actorType: "user",
        action: "submission.released",
        targetType: "PriorAuthRequest",
        targetId: requestId,
        summary: "Held submission released by a human",
      });
      const task = store.tasks.find(
        (t) => t.requestId === requestId && t.kind === "approve-submission" && t.status === "open",
      );
      if (task) {
        task.status = "done";
        task.resolvedAt = new Date().toISOString();
        task.resolvedByUserId = opts.approvedByUserId;
        task.resolution = "Released for submission.";
      }
    }

    return { request: snapshot(request), attempts, resolvedBy };
  },

  /* ---------------------------------------------------------------- *
   * RFI
   * ---------------------------------------------------------------- */

  async respondToRFI(requestId: string, communicationId: string, documentIds: string[]) {
    const request = store.requests.find((r) => r.id === requestId);
    const comm = store.communications.find((c) => c.id === communicationId);
    if (!request || !comm) throw new ApiError("Not found", 404, "not_found");

    const route = routesForPayer(request.payerId).find((r) => r.channel !== "human");
    const externalRef = request.attempts.find((a) => a.externalRef)?.externalRef ?? "";

    if (route) {
      const conn = getConnection(route.instanceId);
      const connector = getConnector(route.connectorId, request.payerId);
      if (conn && connector?.respondToRFI) {
        await connector.respondToRFI(conn, { requestId, externalRef, documentIds });
      }
    }

    return simulate(() => {
      comm.status = "responded";
      comm.respondedAt = new Date().toISOString();
      comm.attachmentIds = [...comm.attachmentIds, ...documentIds];
      request.documentIds = Array.from(new Set([...request.documentIds, ...documentIds]));
      request.status = "in-review";
      request.updatedAt = new Date().toISOString();
      request.version += 1;

      const task = store.tasks.find(
        (t) => t.requestId === requestId && t.kind === "rfi-response" && t.status === "open",
      );
      if (task) {
        task.status = "done";
        task.resolvedAt = new Date().toISOString();
        task.resolution = "Requested document resupplied without restarting the request.";
      }

      appendAudit({
        tenantId: request.tenantId,
        actorId: "agent:followup",
        actorName: "Follow-Up agent",
        actorType: "agent",
        action: "rfi.fulfilled",
        targetType: "PriorAuthRequest",
        targetId: requestId,
        externalRef,
        summary: `Resupplied ${documentIds.length} requested document(s) — review resumed without a new submission`,
      });
      return snapshot(request);
    }, 500, 1100);
  },

  /* ---------------------------------------------------------------- *
   * Clinical attestation (provider side)
   * ---------------------------------------------------------------- */

  async attestClinical(
    requestId: string,
    userId: string,
    input: { supported: boolean; note: string; additionalDocumentIds?: string[] },
  ) {
    const request = store.requests.find((r) => r.id === requestId);
    if (!request) throw new ApiError("Request not found", 404, "not_found");

    const user = store.users.find((u) => u.id === userId);
    const provider = user?.providerId ? directoryService.sync.provider(user.providerId) : undefined;
    if (!provider?.isLicensedReviewer) {
      throw new ApiError(
        "Only a licensed clinician may attest to clinical evidence.",
        403,
        "not_licensed",
      );
    }

    return simulate(() => {
      if (input.additionalDocumentIds?.length) {
        request.documentIds = Array.from(
          new Set([...request.documentIds, ...input.additionalDocumentIds]),
        );
      }
      request.status = input.supported ? "documentation" : "withdrawn";
      request.updatedAt = new Date().toISOString();
      request.version += 1;

      const task = store.tasks.find(
        (t) => t.requestId === requestId && t.kind === "clinical-review" && t.status === "open",
      );
      if (task) {
        task.status = "done";
        task.resolvedAt = new Date().toISOString();
        task.resolvedByUserId = userId;
        task.resolution = input.supported ? "Evidence attested; returned to the agent." : "Not clinically supported; withdrawn.";
      }

      appendAudit({
        tenantId: request.tenantId,
        actorId: userId,
        actorName: user?.name ?? "Clinician",
        actorType: "user",
        action: input.supported ? "clinical.attested" : "request.withdrawn",
        targetType: "PriorAuthRequest",
        targetId: requestId,
        summary: input.supported
          ? "Licensed clinician attested to the clinical evidence and returned the case to the agent"
          : "Licensed clinician determined the request is not clinically supported; withdrawn",
        metadata: { note: input.note.slice(0, 120) },
      });
      return snapshot(request);
    }, 420, 900);
  },

  /* ---------------------------------------------------------------- *
   * Payer-side determination
   * ---------------------------------------------------------------- */

  /**
   * Records a determination.
   *
   * A denial or partial approval requires a named reviewer who holds a role
   * permitted to make a clinical determination. There is no code path that
   * records one without a human — that is the point.
   */
  async recordDecision(
    requestId: string,
    input: {
      outcome: Decision["outcome"];
      reviewerUserId?: string;
      rationale: string;
      reasonCodes?: Decision["reasonCodes"];
      authorizationNumber?: string;
      validFrom?: string;
      validTo?: string;
      approvedUnits?: number;
    },
  ): Promise<Decision> {
    const request = store.requests.find((r) => r.id === requestId);
    if (!request) throw new ApiError("Request not found", 404, "not_found");

    const needsHuman = input.outcome === "denied" || input.outcome === "partially-approved";
    const reviewer = input.reviewerUserId
      ? store.users.find((u) => u.id === input.reviewerUserId)
      : undefined;

    if (needsHuman) {
      if (!reviewer) {
        throw new ApiError(
          "A denial or partial approval must be attributed to a named reviewer.",
          422,
          "human_required",
        );
      }
      if (!reviewer.roleIds.includes("payer-clinical")) {
        throw new ApiError(
          "Only a licensed clinical reviewer may issue a denial or partial approval. AI never denies care.",
          403,
          "not_licensed",
        );
      }
    }

    const decision: Decision = {
      id: `dec-${requestId.replace("req-", "")}`,
      tenantId: request.tenantId,
      requestId,
      outcome: input.outcome,
      decidedAt: new Date().toISOString(),
      decidedByUserId: reviewer?.id,
      decidedByName: reviewer?.name ?? "Electronic determination",
      authorizationNumber: input.authorizationNumber,
      validFrom: input.validFrom,
      validTo: input.validTo,
      approvedUnits: input.approvedUnits,
      reasonCodes: input.reasonCodes ?? [],
      rationale: input.rationale,
      payerRef: request.attempts.find((a) => a.externalRef)?.externalRef,
      appealDeadline:
        input.outcome === "denied"
          ? new Date(Date.now() + 60 * 86_400_000).toISOString()
          : undefined,
    };

    return simulate(() => {
      store.decisions = store.decisions.filter((d) => d.requestId !== requestId);
      store.decisions.push(decision);
      request.decisionId = decision.id;
      request.status =
        input.outcome === "approved"
          ? "approved"
          : input.outcome === "partially-approved"
            ? "partially-approved"
            : input.outcome === "denied"
              ? "denied"
              : "pended";
      request.updatedAt = new Date().toISOString();
      request.version += 1;

      for (const t of store.tasks) {
        if (t.requestId === requestId && t.kind === "clinical-determination" && t.status === "open") {
          t.status = "done";
          t.resolvedAt = new Date().toISOString();
          t.resolvedByUserId = reviewer?.id;
          t.resolution = `Determination issued: ${input.outcome}.`;
        }
      }

      appendAudit({
        tenantId: request.tenantId,
        actorId: reviewer?.id ?? "payer:system",
        actorName: reviewer?.name ?? "Electronic determination",
        actorType: reviewer ? "user" : "payer",
        action: "determination.issued",
        targetType: "Decision",
        targetId: decision.id,
        externalRef: decision.payerRef,
        summary: `${input.outcome.replace("-", " ")} — ${input.reasonCodes?.[0]?.display ?? "criteria assessed"}`,
        metadata: { outcome: input.outcome, requestId },
      });

      // A denial always raises a task for a licensed human on the provider side.
      if (input.outcome === "denied") {
        store.tasks.unshift({
          id: `tsk-${Date.now()}`,
          tenantId: request.tenantId,
          requestId,
          kind: "appeal-review",
          title: "Denial received — appeal draft ready for review",
          reason:
            "Every denial routes to a licensed clinician. The agent has drafted an appeal; it cannot be filed without clinical sign-off.",
          assignedRole: "ordering-physician",
          priority: "high",
          createdAt: new Date().toISOString(),
          dueAt: decision.appealDeadline,
          status: "open",
        });
        appendAudit({
          tenantId: request.tenantId,
          actorId: "agent:orchestrator",
          actorName: "Orchestrator",
          actorType: "agent",
          action: "request.escalated",
          targetType: "PriorAuthRequest",
          targetId: requestId,
          summary: "Denial routed to a licensed human",
          metadata: { policy: "no-ai-denial" },
        });
      }

      return snapshot(decision);
    }, 600, 1300);
  },

  async triage(requestId: string, assigneeUserId: string) {
    return simulate(() => {
      const task = store.tasks.find(
        (t) => t.requestId === requestId && t.kind === "intake-completeness" && t.status === "open",
      );
      if (task) {
        task.status = "done";
        task.resolvedAt = new Date().toISOString();
        task.resolution = "Intake complete; triaged to clinical review.";
      }
      const request = store.requests.find((r) => r.id === requestId);
      if (request) {
        request.status = "in-review";
        request.updatedAt = new Date().toISOString();
        store.tasks.unshift({
          id: `tsk-${Date.now()}`,
          tenantId: "t-meridian",
          requestId,
          kind: "clinical-determination",
          title: `Criteria review — ${request.serviceLines[0].display}`,
          reason: "Intake complete, triaged to clinical review.",
          assignedRole: "payer-clinical",
          assignedToUserId: assigneeUserId,
          priority: request.urgency === "expedited" ? "urgent" : "normal",
          createdAt: new Date().toISOString(),
          dueAt: request.decisionDueAt,
          status: "open",
        });
      }
      appendAudit({
        tenantId: "t-meridian",
        actorId: "usr-reyes",
        actorName: "Marcus Reyes",
        actorType: "user",
        action: "request.triaged",
        targetType: "PriorAuthRequest",
        targetId: requestId,
        summary: "Intake complete, assigned to clinical review",
        metadata: { assignedTo: assigneeUserId },
      });
      return true;
    }, 350, 750);
  },

  /* ---------------------------------------------------------------- *
   * Appeals and peer-to-peer
   * ---------------------------------------------------------------- */

  async fileAppeal(
    requestId: string,
    input: { approvedByUserId: string; argument: string; additionalDocumentIds: string[] },
  ): Promise<Appeal> {
    const request = store.requests.find((r) => r.id === requestId);
    const decision = store.decisions.find((d) => d.requestId === requestId);
    if (!request || !decision) throw new ApiError("Not found", 404, "not_found");

    const user = store.users.find((u) => u.id === input.approvedByUserId);
    const provider = user?.providerId ? directoryService.sync.provider(user.providerId) : undefined;
    if (!provider?.isLicensedReviewer) {
      throw new ApiError(
        "An appeal may only be filed with the approval of a licensed clinician.",
        403,
        "not_licensed",
      );
    }

    const existing = store.appeals.filter((a) => a.requestId === requestId);
    const level = (existing.length + 1) as 1 | 2 | 3;

    const appeal: Appeal = {
      id: `apl-${requestId.replace("req-", "")}-${level}`,
      tenantId: request.tenantId,
      requestId,
      decisionId: decision.id,
      level,
      levelLabel:
        level === 1 ? "First-level appeal" : level === 2 ? "Second-level appeal" : "External review",
      status: "submitted",
      filedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      approvedByUserId: input.approvedByUserId,
      argument: input.argument,
      additionalDocumentIds: input.additionalDocumentIds,
    };

    return simulate(() => {
      store.appeals.push(appeal);
      request.status = "appealed";
      request.documentIds = Array.from(
        new Set([...request.documentIds, ...input.additionalDocumentIds]),
      );
      request.updatedAt = new Date().toISOString();
      request.version += 1;

      for (const t of store.tasks) {
        if (t.requestId === requestId && t.kind === "appeal-review" && t.status === "open") {
          t.status = "done";
          t.resolvedAt = new Date().toISOString();
          t.resolvedByUserId = input.approvedByUserId;
          t.resolution = `${appeal.levelLabel} filed.`;
        }
      }

      appendAudit({
        tenantId: request.tenantId,
        actorId: input.approvedByUserId,
        actorName: user?.name ?? "Clinician",
        actorType: "user",
        action: "appeal.approved",
        targetType: "Appeal",
        targetId: appeal.id,
        summary: `${appeal.levelLabel} approved for filing by a licensed clinician`,
        metadata: { level, requestId },
      });
      appendAudit({
        tenantId: request.tenantId,
        actorId: "agent:followup",
        actorName: "Follow-Up agent",
        actorType: "agent",
        action: "appeal.filed",
        targetType: "Appeal",
        targetId: appeal.id,
        externalRef: decision.payerRef,
        summary: `Appeal submitted with ${input.additionalDocumentIds.length} additional document(s)`,
        metadata: { requestId },
      });
      return snapshot(appeal);
    }, 700, 1400);
  },

  async requestPeerToPeer(requestId: string, providerUserId: string): Promise<PeerToPeer> {
    const request = store.requests.find((r) => r.id === requestId);
    if (!request) throw new ApiError("Request not found", 404, "not_found");

    const base = Date.now() + 2 * 86_400_000;
    const p2p: PeerToPeer = {
      id: `p2p-${requestId.replace("req-", "")}`,
      tenantId: request.tenantId,
      requestId,
      status: "requested",
      requestedAt: new Date().toISOString(),
      providerUserId,
      offeredSlots: [
        new Date(base + 3 * 3_600_000).toISOString(),
        new Date(base + 6 * 3_600_000).toISOString(),
        new Date(base + 26 * 3_600_000).toISOString(),
      ],
      payerReviewerName: `${directoryService.sync.payer(request.payerId)?.name} medical director`,
    };

    return simulate(() => {
      store.peerToPeers = store.peerToPeers.filter((p) => p.requestId !== requestId);
      store.peerToPeers.push(p2p);
      request.status = "peer-to-peer";
      request.updatedAt = new Date().toISOString();
      appendAudit({
        tenantId: request.tenantId,
        actorId: providerUserId,
        actorName: store.users.find((u) => u.id === providerUserId)?.name ?? "Clinician",
        actorType: "user",
        action: "p2p.requested",
        targetType: "PeerToPeer",
        targetId: p2p.id,
        summary: "Peer-to-peer review requested",
        metadata: { requestId },
      });
      return snapshot(p2p);
    }, 500, 1000);
  },

  async schedulePeerToPeer(p2pId: string, slot: string): Promise<PeerToPeer> {
    const p2p = store.peerToPeers.find((p) => p.id === p2pId);
    if (!p2p) throw new ApiError("Not found", 404, "not_found");
    return simulate(() => {
      p2p.status = "scheduled";
      p2p.scheduledAt = slot;
      p2p.durationMinutes = 15;
      for (const t of store.tasks) {
        if (t.requestId === p2p.requestId && t.kind === "peer-to-peer" && t.status === "open") {
          t.status = "in-progress";
        }
      }
      appendAudit({
        tenantId: p2p.tenantId,
        actorId: p2p.providerUserId,
        actorName: store.users.find((u) => u.id === p2p.providerUserId)?.name ?? "Clinician",
        actorType: "user",
        action: "p2p.scheduled",
        targetType: "PeerToPeer",
        targetId: p2p.id,
        summary: `Peer-to-peer scheduled for ${new Date(slot).toLocaleString()}`,
        metadata: { requestId: p2p.requestId },
      });
      return snapshot(p2p);
    }, 400, 800);
  },

  /** Ask the payer to extend an authorization that lapses too early. */
  async requestExtension(requestId: string, userId: string) {
    const request = store.requests.find((r) => r.id === requestId);
    const decision = store.decisions.find((d) => d.requestId === requestId);
    if (!request || !decision) throw new ApiError("Not found", 404, "not_found");

    return simulate(() => {
      const newValidTo = new Date(
        new Date(request.scheduledServiceDate ?? Date.now()).getTime() + 30 * 86_400_000,
      )
        .toISOString()
        .slice(0, 10);
      decision.validTo = newValidTo;
      request.updatedAt = new Date().toISOString();
      for (const t of store.tasks) {
        if (t.requestId === requestId && t.kind === "expiring-approval" && t.status === "open") {
          t.status = "done";
          t.resolvedAt = new Date().toISOString();
          t.resolvedByUserId = userId;
          t.resolution = `Authorization extended to ${newValidTo}.`;
        }
      }
      appendAudit({
        tenantId: request.tenantId,
        actorId: userId,
        actorName: store.users.find((u) => u.id === userId)?.name ?? "Staff",
        actorType: "user",
        action: "authorization.extended",
        targetType: "Decision",
        targetId: decision.id,
        externalRef: decision.authorizationNumber,
        summary: `Date span extended to ${newValidTo}, covering the scheduled service date`,
        metadata: { requestId },
      });
      return snapshot(decision);
    }, 600, 1200);
  },

  /** Update coverage and re-run the case from eligibility. */
  async updateCoverage(requestId: string, coverageId: string, userId: string) {
    const request = store.requests.find((r) => r.id === requestId);
    if (!request) throw new ApiError("Request not found", 404, "not_found");
    return simulate(() => {
      request.coverageId = coverageId;
      request.status = "requirement-check";
      request.updatedAt = new Date().toISOString();
      request.version += 1;
      for (const t of store.tasks) {
        if (t.requestId === requestId && t.kind === "admin-exception" && t.status === "open") {
          t.status = "done";
          t.resolvedAt = new Date().toISOString();
          t.resolvedByUserId = userId;
          t.resolution = "Coverage updated; case re-entered the waterfall at eligibility.";
        }
      }
      appendAudit({
        tenantId: request.tenantId,
        actorId: userId,
        actorName: store.users.find((u) => u.id === userId)?.name ?? "Staff",
        actorType: "user",
        action: "coverage.updated",
        targetType: "PriorAuthRequest",
        targetId: requestId,
        summary: "Coverage corrected and the case re-run from eligibility",
      });
      return snapshot(request);
    }, 500, 1000);
  },
};

/* ------------------------------------------------------------------ *
 * KPIs
 * ------------------------------------------------------------------ */

export interface Kpis {
  pending: number;
  approved: number;
  denied: number;
  partiallyApproved: number;
  noAuthRequired: number;
  needsHuman: number;
  avgTurnaroundHours: number;
  slaBreaches: number;
  slaAtRisk: number;
  touchlessRate: number;
  firstPassApprovalRate: number;
  channelMix: { channel: Channel; count: number }[];
  byPayer: { payerId: string; name: string; total: number; approved: number }[];
}

export function computeKpis(requests: PriorAuthRequest[]): Kpis {
  const decisionsByRequest = new Map(store.decisions.map((d) => [d.requestId, d]));

  const pending = requests.filter((r) =>
    ["submitted", "in-review", "pended", "submitting", "needs-approval"].includes(r.status),
  ).length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const denied = requests.filter((r) => r.status === "denied").length;
  const partiallyApproved = requests.filter((r) => r.status === "partially-approved").length;
  const noAuthRequired = requests.filter((r) => r.status === "no-auth-required").length;
  const needsHuman = requests.filter((r) =>
    ["clinical-review", "needs-approval", "eligibility-check", "peer-to-peer"].includes(r.status),
  ).length;

  const turnarounds = requests
    .map((r) => {
      const d = decisionsByRequest.get(r.id);
      if (!r.submittedAt || !d) return null;
      return (new Date(d.decidedAt).getTime() - new Date(r.submittedAt).getTime()) / 3_600_000;
    })
    .filter((v): v is number => v !== null && v >= 0);

  const avgTurnaroundHours = turnarounds.length
    ? Math.round(turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length)
    : 0;

  let slaBreaches = 0;
  let slaAtRisk = 0;
  for (const r of requests) {
    const f = computeFlags(r, decisionsByRequest.get(r.id));
    if (f.slaBreached) slaBreaches += 1;
    if (f.slaAtRisk) slaAtRisk += 1;
  }

  // "Touchless" = reached a terminal outcome with no human task raised.
  const resolved = requests.filter((r) => TERMINAL.includes(r.status));
  const touched = new Set(store.tasks.map((t) => t.requestId));
  const touchlessRate = resolved.length
    ? resolved.filter((r) => !touched.has(r.id)).length / resolved.length
    : 0;

  const decided = approved + denied + partiallyApproved;
  const firstPassApprovalRate = decided ? (approved + partiallyApproved) / decided : 0;

  const channelCounts = new Map<Channel, number>();
  for (const r of requests) {
    const winner = r.attempts.find((a) => a.outcome === "succeeded");
    if (winner) channelCounts.set(winner.channel, (channelCounts.get(winner.channel) ?? 0) + 1);
  }

  const byPayer = payers.map((p) => {
    const rows = requests.filter((r) => r.payerId === p.id);
    return {
      payerId: p.id,
      name: p.name,
      total: rows.length,
      approved: rows.filter((r) => r.status === "approved" || r.status === "partially-approved")
        .length,
    };
  });

  return {
    pending,
    approved,
    denied,
    partiallyApproved,
    noAuthRequired,
    needsHuman,
    avgTurnaroundHours,
    slaBreaches,
    slaAtRisk,
    touchlessRate,
    firstPassApprovalRate,
    channelMix: [...channelCounts.entries()].map(([channel, count]) => ({ channel, count })),
    byPayer,
  };
}
