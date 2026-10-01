/**
 * Connector registry and routing.
 *
 * The registry answers two questions the submission waterfall asks on every
 * case: *which connectors can reach this payer*, and *in what order should I
 * try them*. Ordering is by channel cost — electronic, then portal, then
 * voice, then a human — which is the spine of the whole design.
 */

import { payers } from "@/mocks";
import { store } from "@/mocks";
import type { Channel } from "@/types";
import type { ConnectionRef, Connector } from "./types";
import {
  MockAthenaConnector,
  MockCernerConnector,
  MockEpicConnector,
  MockGenericFhirConnector,
  MockGranitePASConnector,
  MockMeridianPASConnector,
  MockPortalRpaConnector,
  MockVoiceConnector,
  MockX12ClearinghouseConnector,
} from "./mocks";

/** Live adapter instances, keyed by the registry's connector id. */
export const connectorRegistry: Record<string, Connector> = {
  "con-epic": new MockEpicConnector(),
  "con-cerner": new MockCernerConnector(),
  "con-athena": new MockAthenaConnector(),
  "con-generic-fhir": new MockGenericFhirConnector(),
  "con-meridian-pas": new MockMeridianPASConnector(),
  "con-granite-pas": new MockGranitePASConnector(),
  "con-availity-x12": new MockX12ClearinghouseConnector(),
  "con-voice": new MockVoiceConnector(),
};

/**
 * Portal adapters are per-payer because each one drives a different site —
 * and one of them is currently broken, which is exactly the point.
 */
const portalConnectors: Record<string, Connector> = {
  "pay-atlas": new MockPortalRpaConnector("Atlas Mutual", true),
  "pay-pinnacle": new MockPortalRpaConnector("Pinnacle Choice"),
  "pay-caldera": new MockPortalRpaConnector("Caldera Medicaid Partners"),
  "pay-granite": new MockPortalRpaConnector("Granite State Blue"),
  "pay-meridian": new MockPortalRpaConnector("Meridian Health Plan"),
};

export function getConnector(connectorId: string, payerId?: string): Connector | undefined {
  if (connectorId === "con-portal-rpa" && payerId) return portalConnectors[payerId];
  return connectorRegistry[connectorId];
}

/** Build the connection reference for a tenant's configured instance. */
export function getConnection(instanceId: string): ConnectionRef | undefined {
  const inst = store.connectorInstances.find((c) => c.id === instanceId);
  if (!inst) return undefined;
  return {
    instanceId: inst.id,
    tenantId: inst.tenantId,
    credentialRef: inst.credentialRef,
    environment: inst.environment,
  };
}

export interface Route {
  channel: Channel;
  connectorId: string;
  instanceId: string;
  label: string;
  /** Why this route sits where it does in the waterfall. */
  rationale: string;
}

/**
 * The waterfall for one payer, in cost order.
 *
 * Only routes whose connection is actually usable are included — a
 * disconnected or refresh-failed instance is skipped rather than attempted,
 * because acting on connection *state* is the whole reason that field
 * exists.
 */
export function routesForPayer(payerId: string): Route[] {
  const payer = payers.find((p) => p.id === payerId);
  if (!payer) return [];

  const routes: Route[] = [];
  const usable = (id: string) => {
    const inst = store.connectorInstances.find((c) => c.id === id);
    return inst && ["active", "degraded"].includes(inst.state) ? inst : undefined;
  };

  // 1 — Electronic: the payer's own FHIR surface first, clearinghouse second.
  if (payer.capabilities.pas) {
    const direct =
      payerId === "pay-meridian"
        ? usable("ci-meridian-pas")
        : payerId === "pay-granite"
          ? usable("ci-granite-pas")
          : undefined;
    if (direct) {
      routes.push({
        channel: "electronic",
        connectorId: direct.connectorId,
        instanceId: direct.id,
        label: `${payer.name} — Da Vinci PAS`,
        rationale: "Cheapest and fastest. Structured decision, full audit trail, attachments carried natively.",
      });
    }
  }

  if (payer.capabilities.x12_278) {
    const ch = usable("ci-availity");
    if (ch) {
      routes.push({
        channel: "electronic",
        connectorId: ch.connectorId,
        instanceId: ch.id,
        label: "Availity — X12 278",
        rationale: "Electronic, but carries no attachments; supporting documents follow by the payer's stated channel.",
      });
    }
  }

  // 2 — Portal.
  if (payer.capabilities.portal) {
    const instId = payerId === "pay-atlas" ? "ci-portal-atlas" : "ci-portal-pinnacle";
    const inst = usable(instId);
    if (inst) {
      routes.push({
        channel: "portal",
        connectorId: "con-portal-rpa",
        instanceId: inst.id,
        label: `${payer.name} portal`,
        rationale: "Browser automation. Works, but breaks whenever the payer changes its UI — highest maintenance cost.",
      });
    }
  }

  // 3 — Voice.
  const voice = usable("ci-voice");
  if (voice) {
    routes.push({
      channel: "voice",
      connectorId: "con-voice",
      instanceId: voice.id,
      label: payer.automatedCallerPermitted
        ? `Call ${payer.name} (automated caller permitted)`
        : `Call ${payer.name} (agent must not self-identify as automated)`,
      rationale: payer.automatedCallerPermitted
        ? "Expensive and slow, but resolves what no API can. This payer permits an automated caller."
        : "This payer does not permit an automated caller, so the disclosure script is suppressed and the call is handled accordingly.",
    });
  }

  // 4 — Human, always available as the floor.
  routes.push({
    channel: "human",
    connectorId: "manual",
    instanceId: "manual",
    label: "Hand to a staff member",
    rationale: "Last resort. The case stays the same object; only the actor changes.",
  });

  return routes;
}

/** All adapters, for the admin connector screen. */
export function allAdapters(): Connector[] {
  return [...Object.values(connectorRegistry), portalConnectors["pay-atlas"]];
}
