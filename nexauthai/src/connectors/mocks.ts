/**
 * Mock connectors.
 *
 * Each implements the same `Connector` contract the production adapters
 * would. They simulate latency, emit the provenance metadata the case ledger
 * records, and fail in the ways their real counterparts actually fail — an
 * expired OAuth refresh on the EHR side, a changed UI on the portal side, a
 * payer that simply does not implement the method you wanted.
 *
 * The submission waterfall in `services/paService.ts` walks these in cost
 * order and records which one resolved the case, so the routing is visible
 * in the UI rather than asserted in a document.
 */

import type {
  ClinicalDocument,
  Questionnaire,
  RequirementSource,
} from "@/types";
import { clinicalDocuments, questionnaires } from "@/mocks";
import type {
  ConnectionRef,
  Connector,
  ConnectorEvent,
  ConnectorFault,
  ConnectorManifest,
  ConnectorResult,
  DocumentRequest,
  EligibilityRequest,
  EligibilityResult,
  HealthResult,
  QuestionnaireRequest,
  RFIResponseRequest,
  RequirementRequest,
  RequirementResult,
  StatusResult,
  SubmissionReceipt,
  SubmissionRequest,
  WriteBackRequest,
} from "./types";

const CONTRACT_VERSION = "1.0.0";

/** Simulated network delay, so the UI's loading states are real. */
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const jitter = (base: number, spread = 0.3) =>
  Math.round(base * (1 - spread + Math.random() * spread * 2));

let refSeq = 7_740_000;
const nextRef = (prefix: string) => {
  refSeq += Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${refSeq}`;
};

function ok<T>(
  data: T,
  manifest: ConnectorManifest,
  conn: ConnectionRef,
  latencyMs: number,
  externalRef?: string,
): ConnectorResult<T> {
  return {
    ok: true,
    data,
    meta: {
      connectorId: manifest.id,
      instanceId: conn.instanceId,
      externalRef,
      latencyMs,
      at: new Date().toISOString(),
      via: manifest.interfaces[0],
    },
  };
}

function fail<T>(
  error: ConnectorFault,
  manifest: ConnectorManifest,
  conn: ConnectionRef,
  latencyMs: number,
): ConnectorResult<T> {
  return {
    ok: false,
    error,
    meta: {
      connectorId: manifest.id,
      instanceId: conn.instanceId,
      latencyMs,
      at: new Date().toISOString(),
      via: manifest.interfaces[0],
    },
  };
}

/* ================================================================== *
 * EHR — Epic
 * ================================================================== */

export class MockEpicConnector implements Connector {
  private manifest: ConnectorManifest = {
    id: "con-epic",
    name: "Epic",
    vendor: "Epic Systems",
    kind: "ehr",
    interfaces: ["fhir-r4", "smart-on-fhir", "cds-hooks", "bulk-fhir"],
    version: "2026.3",
    contractVersion: CONTRACT_VERSION,
    capabilities: ["checkEligibility", "isPARequired", "fetchDocuments", "writeBack", "subscribeToUpdates"],
    standards: ["FHIR R4", "US Core 6.1.0", "SMART App Launch 2.0", "CDS Hooks 2.0.1"],
  };

  describe() {
    return this.manifest;
  }

  async test(conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(260);
    await delay(ms);
    return {
      healthy: true,
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message: `SMART backend-services token acquired; metadata endpoint returned FHIR R4 (4.0.1). Environment: ${conn.environment}.`,
    };
  }

  /**
   * Epic surfaces coverage from the chart rather than running a 270/271
   * itself — useful as a cross-check against the clearinghouse answer, not
   * as the authoritative eligibility result.
   */
  async checkEligibility(conn: ConnectionRef, req: EligibilityRequest) {
    const ms = jitter(340);
    await delay(ms);
    return ok<EligibilityResult>(
      {
        active: true,
        planName: "On file in Epic",
        groupNumber: "—",
        coverageStart: "2026-01-01",
        transactionRef: nextRef("EPIC-COV"),
      },
      this.manifest,
      conn,
      ms,
      req.memberId,
    );
  }

  /** CRD fired through Epic's CDS Hooks surface at order-sign. */
  async isPARequired(conn: ConnectionRef, req: RequirementRequest) {
    const ms = jitter(1100);
    await delay(ms);
    const ref = nextRef("CRD-EPIC");
    return ok<RequirementResult>(
      {
        paRequired: true,
        source: "crd" as RequirementSource,
        referenceNumber: ref,
        determinedAt: new Date().toISOString(),
        questionnaireAvailable: true,
        requiredDocuments: [
          { type: "order", label: "Signed physician order", required: true },
          { type: "office-note", label: "Office visit notes", required: true },
          { type: "therapy-note", label: "Physical therapy notes", required: true },
        ],
        note: `CRD card returned through Epic for ${req.serviceCodes.join(", ")}.`,
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async fetchDocuments(conn: ConnectionRef, req: DocumentRequest) {
    const ms = jitter(780);
    await delay(ms);
    // Minimum necessary: only the types the rule asked for.
    const docs = clinicalDocuments.filter(
      (d) => d.patientId === req.patientId && req.types.includes(d.type),
    );
    return ok<ClinicalDocument[]>(docs, this.manifest, conn, ms, nextRef("EPIC-DOC"));
  }

  async writeBack(conn: ConnectionRef, req: WriteBackRequest) {
    const ms = jitter(420);
    await delay(ms);
    return ok<void>(undefined, this.manifest, conn, ms, req.referenceNumber);
  }

  subscribeToUpdates(conn: ConnectionRef, handler: (e: ConnectorEvent) => void) {
    const id = setInterval(() => {
      handler({
        type: "sync.completed",
        instanceId: conn.instanceId,
        at: new Date().toISOString(),
        detail: "Incremental chart sync completed.",
      });
    }, 90_000);
    return () => clearInterval(id);
  }
}

/* ================================================================== *
 * EHR — Oracle Health (Cerner)
 * ================================================================== */

export class MockCernerConnector implements Connector {
  private manifest: ConnectorManifest = {
    id: "con-cerner",
    name: "Oracle Health (Cerner Millennium)",
    vendor: "Oracle Health",
    kind: "ehr",
    interfaces: ["fhir-r4", "smart-on-fhir", "bulk-fhir"],
    version: "2026.1",
    contractVersion: CONTRACT_VERSION,
    capabilities: ["checkEligibility", "fetchDocuments", "writeBack"],
    standards: ["FHIR R4", "US Core", "SMART App Launch 2.0"],
  };

  describe() {
    return this.manifest;
  }

  async test(conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(640);
    await delay(ms);
    return {
      healthy: conn.environment === "sandbox",
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message:
        conn.environment === "sandbox"
          ? "System account authorized. 14 local order codes still have no CPT mapping."
          : "Production domain not yet enabled for this client.",
      errorCode: conn.environment === "sandbox" ? undefined : "auth_expired",
    };
  }

  async fetchDocuments(conn: ConnectionRef, req: DocumentRequest) {
    const ms = jitter(1250);
    await delay(ms);
    const docs = clinicalDocuments.filter(
      (d) => d.patientId === req.patientId && req.types.includes(d.type),
    );
    if (docs.length === 0) {
      return fail<ClinicalDocument[]>(
        {
          code: "mapping_missing",
          message:
            "ServiceRequest.code uses a local order code with no CPT mapping; cannot resolve the required document list.",
          retryable: false,
        },
        this.manifest,
        conn,
        ms,
      );
    }
    return ok(docs, this.manifest, conn, ms, nextRef("OH-DOC"));
  }

  async writeBack(conn: ConnectionRef, _req: WriteBackRequest) {
    const ms = jitter(560);
    await delay(ms);
    return fail<void>(
      {
        code: "not_supported",
        message:
          "Task write-back is not enabled for this Oracle Health domain. Confirm with the client's administrator.",
        retryable: false,
      },
      this.manifest,
      conn,
      ms,
    );
  }
}

/* ================================================================== *
 * EHR — athenahealth (currently in a refresh-failed state)
 * ================================================================== */

export class MockAthenaConnector implements Connector {
  private manifest: ConnectorManifest = {
    id: "con-athena",
    name: "athenahealth",
    vendor: "athenahealth",
    kind: "ehr",
    interfaces: ["fhir-r4", "smart-on-fhir", "rest"],
    version: "2026.2",
    contractVersion: CONTRACT_VERSION,
    capabilities: ["checkEligibility", "fetchDocuments", "writeBack", "subscribeToUpdates"],
    standards: ["FHIR R4 (4.0.1)", "SMART v2", "athenaOne REST"],
  };

  describe() {
    return this.manifest;
  }

  async test(_conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(380);
    await delay(ms);
    return {
      healthy: false,
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message:
        "Refresh token rejected. The practice's app authorization was revoked or has lapsed — a user must reconnect.",
      errorCode: "auth_expired",
    };
  }

  async fetchDocuments(conn: ConnectionRef, _req: DocumentRequest) {
    const ms = jitter(300);
    await delay(ms);
    return fail<ClinicalDocument[]>(
      { code: "auth_expired", message: "Connection is not authorized. Reconnect required.", retryable: false },
      this.manifest,
      conn,
      ms,
    );
  }
}

/* ================================================================== *
 * Generic FHIR R4 fallback
 * ================================================================== */

export class MockGenericFhirConnector implements Connector {
  private manifest: ConnectorManifest = {
    id: "con-generic-fhir",
    name: "Generic FHIR R4",
    vendor: "NexAuthAI",
    kind: "ehr",
    interfaces: ["fhir-r4", "smart-on-fhir"],
    version: "1.4",
    contractVersion: CONTRACT_VERSION,
    capabilities: ["fetchDocuments", "writeBack"],
    standards: ["FHIR R4", "US Core 6.1.0"],
  };

  describe() {
    return this.manifest;
  }

  async test(_conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(500);
    await delay(ms);
    return {
      healthy: true,
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message: "CapabilityStatement retrieved; US Core 6.1.0 profiles advertised.",
    };
  }

  async fetchDocuments(conn: ConnectionRef, req: DocumentRequest) {
    const ms = jitter(900);
    await delay(ms);
    const docs = clinicalDocuments.filter(
      (d) => d.patientId === req.patientId && req.types.includes(d.type),
    );
    return ok(docs, this.manifest, conn, ms, nextRef("FHIR-DOC"));
  }

  async writeBack(conn: ConnectionRef, req: WriteBackRequest) {
    const ms = jitter(400);
    await delay(ms);
    return ok<void>(undefined, this.manifest, conn, ms, req.referenceNumber);
  }
}

/* ================================================================== *
 * Payer — full Da Vinci stack
 * ================================================================== */

export class MockMeridianPASConnector implements Connector {
  private manifest: ConnectorManifest = {
    id: "con-meridian-pas",
    name: "Meridian PAS",
    vendor: "Meridian Health Plan",
    kind: "payer",
    interfaces: ["fhir-r4", "rest"],
    version: "2.2.1",
    contractVersion: CONTRACT_VERSION,
    capabilities: [
      "isPARequired",
      "getQuestionnaire",
      "submitPA",
      "getStatus",
      "respondToRFI",
      "subscribeToUpdates",
    ],
    standards: ["Da Vinci CRD 2.2.1", "Da Vinci DTR 2.2.0", "Da Vinci PAS 2.2.1", "Da Vinci CDex 2.1.0"],
  };

  describe() {
    return this.manifest;
  }

  async test(_conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(820);
    await delay(ms);
    return {
      healthy: true,
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message: "PAS endpoint reachable; CRD discovery document lists order-sign and order-select hooks.",
    };
  }

  async isPARequired(conn: ConnectionRef, req: RequirementRequest) {
    const ms = jitter(950);
    await delay(ms);
    const ref = nextRef("CRD-MRDN");
    // Physical therapy evaluation needs no authorization with this payer —
    // and that "no" is an evidenced assertion, not a default.
    const noAuthCodes = ["97161", "97162", "97110"];
    const required = !req.serviceCodes.every((c) => noAuthCodes.includes(c));
    return ok<RequirementResult>(
      {
        paRequired: required,
        source: "crd",
        referenceNumber: ref,
        determinedAt: new Date().toISOString(),
        policyId: required ? "MH-RAD-0412" : "MH-REH-030",
        policyVersion: required ? "4.2" : "2.2",
        questionnaireAvailable: required,
        requiredDocuments: required
          ? [
              { type: "order", label: "Signed physician order", required: true },
              { type: "office-note", label: "Office visit notes (most recent 2)", required: true },
              { type: "therapy-note", label: "Physical therapy notes", required: true },
              { type: "imaging-report", label: "Prior imaging reports", required: false },
            ]
          : [],
        note: required
          ? "Prior authorization required. Documentation requirements returned with the CRD card."
          : "No prior authorization required for this service under the member's plan.",
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async getQuestionnaire(conn: ConnectionRef, _req: QuestionnaireRequest) {
    const ms = jitter(1400);
    await delay(ms);
    const q = questionnaires.find((x) => x.payerId === "pay-meridian");
    if (!q) {
      return fail<Questionnaire>(
        { code: "not_supported", message: "No DTR questionnaire published for this service.", retryable: false },
        this.manifest,
        conn,
        ms,
      );
    }
    return ok(q, this.manifest, conn, ms, nextRef("DTR-MRDN"));
  }

  async submitPA(conn: ConnectionRef, req: SubmissionRequest) {
    const ms = jitter(1800);
    await delay(ms);
    const ref = nextRef("MRDN-PAS");
    const hours = req.urgency === "expedited" ? 72 : 168;
    return ok<SubmissionReceipt>(
      {
        accepted: true,
        externalRef: ref,
        submittedAt: new Date().toISOString(),
        expectedDecisionBy: new Date(Date.now() + hours * 3_600_000).toISOString(),
        status: "in-review",
        note: `Claim/$submit accepted. ${req.documentIds.length} attachment(s) received.`,
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async getStatus(conn: ConnectionRef, externalRef: string) {
    const ms = jitter(700);
    await delay(ms);
    return ok<StatusResult>(
      { status: "in-review", checkedAt: new Date().toISOString(), externalRef },
      this.manifest,
      conn,
      ms,
      externalRef,
    );
  }

  async respondToRFI(conn: ConnectionRef, req: RFIResponseRequest) {
    const ms = jitter(1300);
    await delay(ms);
    return ok<SubmissionReceipt>(
      {
        accepted: true,
        externalRef: req.externalRef,
        submittedAt: new Date().toISOString(),
        status: "in-review",
        note: `CDex Task fulfilled with ${req.documentIds.length} document(s). Review resumed without restarting the request.`,
      },
      this.manifest,
      conn,
      ms,
      req.externalRef,
    );
  }

  subscribeToUpdates(conn: ConnectionRef, handler: (e: ConnectorEvent) => void) {
    const id = setInterval(() => {
      handler({
        type: "status.changed",
        instanceId: conn.instanceId,
        at: new Date().toISOString(),
        detail: "FHIR Subscription notification received.",
      });
    }, 120_000);
    return () => clearInterval(id);
  }
}

/* ================================================================== *
 * Payer — CRD + PAS only, no DTR, no CDex
 * ================================================================== */

export class MockGranitePASConnector implements Connector {
  private manifest: ConnectorManifest = {
    id: "con-granite-pas",
    name: "Granite State Blue PAS",
    vendor: "Granite State Blue",
    kind: "payer",
    interfaces: ["fhir-r4"],
    version: "2.0.1",
    contractVersion: CONTRACT_VERSION,
    capabilities: ["isPARequired", "submitPA", "getStatus"],
    standards: ["Da Vinci CRD 2.0.1", "Da Vinci PAS 2.0.1"],
  };

  describe() {
    return this.manifest;
  }

  async test(_conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(1900);
    await delay(ms);
    return {
      healthy: true,
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message: "PAS endpoint reachable at IG version 2.0.1. No DTR or CDex capability advertised.",
    };
  }

  async isPARequired(conn: ConnectionRef, _req: RequirementRequest) {
    const ms = jitter(1500);
    await delay(ms);
    const ref = nextRef("CRD-GSB");
    return ok<RequirementResult>(
      {
        paRequired: true,
        source: "crd",
        referenceNumber: ref,
        determinedAt: new Date().toISOString(),
        questionnaireAvailable: false,
        requiredDocuments: [
          { type: "order", label: "Signed order", required: true },
          { type: "office-note", label: "Clinical notes", required: true },
          { type: "therapy-note", label: "Therapy records", required: true },
        ],
        note: "No DTR questionnaire available — documentation requirements come from the published policy as a checklist.",
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async getQuestionnaire(conn: ConnectionRef, _req: QuestionnaireRequest) {
    const ms = jitter(200);
    await delay(ms);
    return fail<Questionnaire>(
      { code: "not_supported", message: "This payer does not implement Da Vinci DTR.", retryable: false },
      this.manifest,
      conn,
      ms,
    );
  }

  async submitPA(conn: ConnectionRef, req: SubmissionRequest) {
    const ms = jitter(2400);
    await delay(ms);
    const ref = nextRef("GSB-PAS");
    return ok<SubmissionReceipt>(
      {
        accepted: true,
        externalRef: ref,
        submittedAt: new Date().toISOString(),
        expectedDecisionBy: new Date(
          Date.now() + (req.urgency === "expedited" ? 72 : 168) * 3_600_000,
        ).toISOString(),
        status: "in-review",
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async getStatus(conn: ConnectionRef, externalRef: string) {
    const ms = jitter(1100);
    await delay(ms);
    return ok<StatusResult>(
      { status: "in-review", checkedAt: new Date().toISOString(), externalRef },
      this.manifest,
      conn,
      ms,
      externalRef,
    );
  }
}

/* ================================================================== *
 * Clearinghouse — X12
 * ================================================================== */

export class MockX12ClearinghouseConnector implements Connector {
  private manifest: ConnectorManifest = {
    id: "con-availity-x12",
    name: "Availity Clearinghouse",
    vendor: "Availity",
    kind: "clearinghouse",
    interfaces: ["x12-edi", "rest"],
    version: "3.8",
    contractVersion: CONTRACT_VERSION,
    capabilities: ["checkEligibility", "isPARequired", "submitPA", "getStatus"],
    standards: ["X12 270/271", "X12 276/277", "X12 278 (005010)"],
  };

  describe() {
    return this.manifest;
  }

  async test(_conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(3200);
    await delay(ms);
    return {
      healthy: true,
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message: "Trading-partner session established. Elevated latency on the 270/271 endpoint during peak hours.",
    };
  }

  async checkEligibility(conn: ConnectionRef, req: EligibilityRequest) {
    const ms = jitter(2600);
    await delay(ms);
    const ref = nextRef("271");
    // Robert Hayes' coverage terminated — the administrative-exception path.
    const terminated = req.memberId === "ATL5590113";
    return ok<EligibilityResult>(
      {
        active: !terminated,
        planName: terminated ? "Atlas Premier PPO (terminated)" : "Active coverage on file",
        groupNumber: "AP-77301",
        coverageStart: "2026-01-01",
        coverageEnd: terminated ? "2026-08-31" : undefined,
        copay: terminated ? undefined : "$40 specialist",
        deductibleRemaining: terminated ? undefined : "$1,240",
        transactionRef: ref,
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async isPARequired(conn: ConnectionRef, _req: RequirementRequest) {
    const ms = jitter(3100);
    await delay(ms);
    const ref = nextRef("278I");
    return ok<RequirementResult>(
      {
        paRequired: true,
        source: "x12-278-inquiry",
        referenceNumber: ref,
        determinedAt: new Date().toISOString(),
        questionnaireAvailable: false,
        note: "278 inquiry returned an authorization requirement. The transaction does not carry a documentation list — requirements come from the payer matrix.",
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async submitPA(conn: ConnectionRef, req: SubmissionRequest) {
    const ms = jitter(4200);
    await delay(ms);
    // Pinnacle's member ID format is rejected by the 278 validator.
    if (req.memberId.startsWith("PNC")) {
      return fail<SubmissionReceipt>(
        {
          code: "validation_failed",
          message:
            "278 rejected: subscriber member ID format does not match the payer's expectation for Pinnacle Choice.",
          retryable: false,
        },
        this.manifest,
        conn,
        ms,
      );
    }
    const ref = nextRef("278");
    return ok<SubmissionReceipt>(
      {
        accepted: true,
        externalRef: ref,
        submittedAt: new Date().toISOString(),
        status: "in-review",
        note: "278 accepted. Note that 278 carries no attachments — supporting documents follow by the payer's stated channel.",
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async getStatus(conn: ConnectionRef, externalRef: string) {
    const ms = jitter(2200);
    await delay(ms);
    return ok<StatusResult>(
      { status: "in-review", checkedAt: new Date().toISOString(), externalRef },
      this.manifest,
      conn,
      ms,
      externalRef,
    );
  }
}

/* ================================================================== *
 * Payer portal — browser automation
 * ================================================================== */

export class MockPortalRpaConnector implements Connector {
  constructor(private readonly payerLabel: string, private readonly broken = false) {}

  private manifest: ConnectorManifest = {
    id: "con-portal-rpa",
    name: "Payer Portal Automation",
    vendor: "NexAuthAI",
    kind: "payer",
    interfaces: ["browser-rpa"],
    version: "2.3",
    contractVersion: CONTRACT_VERSION,
    capabilities: ["isPARequired", "submitPA", "getStatus", "respondToRFI"],
    standards: ["None — browser automation"],
  };

  describe() {
    return this.manifest;
  }

  async test(_conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(9000);
    await delay(Math.min(ms, 1200));
    return {
      healthy: !this.broken,
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message: this.broken
        ? `${this.payerLabel}: the attachment upload step no longer matches the recorded baseline — the payer moved the control behind a new tab.`
        : `${this.payerLabel}: login succeeded and the recorded baseline still matches.`,
      errorCode: this.broken ? "ui_changed" : undefined,
    };
  }

  async isPARequired(conn: ConnectionRef, _req: RequirementRequest) {
    const ms = jitter(11_000);
    await delay(Math.min(ms, 1500));
    const ref = nextRef("PRTL");
    return ok<RequirementResult>(
      {
        paRequired: true,
        source: "portal-lookup",
        referenceNumber: ref,
        determinedAt: new Date().toISOString(),
        questionnaireAvailable: false,
        note: `Read from the ${this.payerLabel} portal's authorization-requirement lookup. Screenshot evidence stored.`,
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async submitPA(conn: ConnectionRef, req: SubmissionRequest) {
    const ms = jitter(16_000);
    await delay(Math.min(ms, 2200));
    if (this.broken) {
      return fail<SubmissionReceipt>(
        {
          code: "ui_changed",
          message: `${this.payerLabel} portal layout changed at the attachment step. Falling through to the next channel.`,
          retryable: false,
        },
        this.manifest,
        conn,
        ms,
      );
    }
    const ref = nextRef("PRTL");
    return ok<SubmissionReceipt>(
      {
        accepted: true,
        externalRef: ref,
        submittedAt: new Date().toISOString(),
        status: "in-review",
        note: `Submitted through the ${this.payerLabel} portal with ${req.documentIds.length} attachment(s). Screenshot evidence stored against the case.`,
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async getStatus(conn: ConnectionRef, externalRef: string) {
    const ms = jitter(8000);
    await delay(Math.min(ms, 1100));
    return ok<StatusResult>(
      { status: "in-review", checkedAt: new Date().toISOString(), externalRef },
      this.manifest,
      conn,
      ms,
      externalRef,
    );
  }

  async respondToRFI(conn: ConnectionRef, req: RFIResponseRequest) {
    const ms = jitter(12_000);
    await delay(Math.min(ms, 1600));
    return ok<SubmissionReceipt>(
      {
        accepted: true,
        externalRef: req.externalRef,
        submittedAt: new Date().toISOString(),
        status: "in-review",
        note: "Document uploaded to the existing portal case — no new request created.",
      },
      this.manifest,
      conn,
      ms,
      req.externalRef,
    );
  }
}

/* ================================================================== *
 * Voice
 * ================================================================== */

export class MockVoiceConnector implements Connector {
  private manifest: ConnectorManifest = {
    id: "con-voice",
    name: "Voice Agent (Retell + SIP)",
    vendor: "Retell AI",
    kind: "voice",
    interfaces: ["telephony", "rest"],
    version: "1.9",
    contractVersion: CONTRACT_VERSION,
    capabilities: ["isPARequired", "submitPA", "getStatus"],
    standards: ["SIP", "Telephony"],
  };

  describe() {
    return this.manifest;
  }

  async test(_conn: ConnectionRef): Promise<HealthResult> {
    const ms = jitter(1200);
    await delay(ms);
    return {
      healthy: true,
      checkedAt: new Date().toISOString(),
      latencyMs: ms,
      message: "SIP trunk registered on the dedicated outbound line. Recording enabled.",
    };
  }

  async submitPA(conn: ConnectionRef, req: SubmissionRequest) {
    const ms = jitter(480_000);
    await delay(2600);
    const ref = nextRef("CALL");
    return ok<SubmissionReceipt>(
      {
        accepted: true,
        externalRef: ref,
        submittedAt: new Date().toISOString(),
        status: "in-review",
        note: `Call completed in ${Math.round(ms / 1000)}s including hold. Representative issued reference ${ref}. Recording and transcript stored against case ${req.caseNumber}.`,
      },
      this.manifest,
      conn,
      ms,
      ref,
    );
  }

  async getStatus(conn: ConnectionRef, externalRef: string) {
    const ms = jitter(360_000);
    await delay(2000);
    return ok<StatusResult>(
      { status: "in-review", checkedAt: new Date().toISOString(), externalRef },
      this.manifest,
      conn,
      ms,
      externalRef,
    );
  }
}
