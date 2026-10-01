/**
 * Admin surface: connectors, field mappings, automation policy, users,
 * audit and notifications.
 */

import { getConnection, getConnector } from "@/connectors/registry";
import { connectorMappings, connectors, store, tenants } from "@/mocks";
import type {
  AuditEvent,
  Connector,
  ConnectorInstance,
  ConnectorMapping,
  Notification,
  PolicyConfig,
  TrustMode,
  User,
} from "@/types";
import { ApiError, simulate, snapshot } from "./http";
import { appendAudit } from "./paService";

export const adminService = {
  async listConnectors(): Promise<Connector[]> {
    return simulate(() => snapshot(connectors), 140, 340);
  },

  async listInstances(): Promise<ConnectorInstance[]> {
    return simulate(() => snapshot(store.connectorInstances), 180, 420);
  },

  async getInstance(id: string): Promise<ConnectorInstance | undefined> {
    return simulate(() => snapshot(store.connectorInstances.find((c) => c.id === id)), 120, 280);
  },

  async getMapping(mappingId: string): Promise<ConnectorMapping | undefined> {
    return simulate(() => snapshot(connectorMappings.find((m) => m.id === mappingId)), 160, 380);
  },

  /**
   * Runs the adapter's own `test` method, then writes the result back onto
   * the instance — so the admin screen reflects real connector behaviour
   * rather than a hard-coded status.
   */
  async testConnection(instanceId: string) {
    const instance = store.connectorInstances.find((c) => c.id === instanceId);
    if (!instance) throw new ApiError("Connection not found", 404, "not_found");

    const conn = getConnection(instanceId);
    const payerId = instanceId.includes("atlas")
      ? "pay-atlas"
      : instanceId.includes("pinnacle")
        ? "pay-pinnacle"
        : undefined;
    const connector = getConnector(instance.connectorId, payerId);
    if (!conn || !connector) throw new ApiError("No adapter registered", 503, "not_supported");

    const health = await connector.test(conn);

    instance.lastTestedAt = health.checkedAt;
    instance.avgLatencyMs = health.latencyMs;
    if (health.healthy && instance.state !== "degraded") instance.state = "active";
    if (!health.healthy) {
      instance.state = health.errorCode === "auth_expired" ? "refresh-failed" : "failed";
    }

    appendAudit({
      tenantId: instance.tenantId,
      actorId: "usr-admin",
      actorName: "Priyanka Raghunathan",
      actorType: "user",
      action: "connection.tested",
      targetType: "ConnectorInstance",
      targetId: instanceId,
      summary: health.healthy ? "Connection test passed" : `Connection test failed: ${health.message}`,
      metadata: { latencyMs: health.latencyMs, healthy: health.healthy },
    });

    return health;
  },

  /** Re-authorize a connection whose token lapsed. */
  async reconnect(instanceId: string) {
    const instance = store.connectorInstances.find((c) => c.id === instanceId);
    if (!instance) throw new ApiError("Connection not found", 404, "not_found");
    return simulate(() => {
      instance.state = "active";
      instance.errors = [];
      instance.successRate = 0.99;
      instance.lastSyncAt = new Date().toISOString();
      instance.lastTestedAt = new Date().toISOString();
      appendAudit({
        tenantId: instance.tenantId,
        actorId: "usr-admin",
        actorName: "Priyanka Raghunathan",
        actorType: "user",
        action: "connection.state_changed",
        targetType: "ConnectorInstance",
        targetId: instanceId,
        summary: "Connection re-authorized",
        metadata: { to: "active" },
      });
      return snapshot(instance);
    }, 900, 1800);
  },

  /* ---------------------------------------------------------------- *
   * Policy — every change is a new version, and audited
   * ---------------------------------------------------------------- */

  async getPolicy(): Promise<PolicyConfig> {
    return simulate(() => snapshot(store.policy), 120, 300);
  },

  async updatePolicy(
    patch: Partial<Pick<PolicyConfig, "autoSubmitThreshold" | "killSwitch">> & {
      trustByPayer?: Record<string, TrustMode>;
      changeNote?: string;
    },
    userId: string,
  ): Promise<PolicyConfig> {
    return simulate(() => {
      const before = snapshot(store.policy);
      store.policy = {
        ...store.policy,
        ...("autoSubmitThreshold" in patch
          ? { autoSubmitThreshold: patch.autoSubmitThreshold! }
          : {}),
        ...("killSwitch" in patch ? { killSwitch: patch.killSwitch! } : {}),
        ...(patch.trustByPayer
          ? { trustByPayer: { ...store.policy.trustByPayer, ...patch.trustByPayer } }
          : {}),
        version: store.policy.version + 1,
        changedAt: new Date().toISOString(),
        changedByUserId: userId,
        changeNote: patch.changeNote,
      };

      const changes: string[] = [];
      if (patch.autoSubmitThreshold !== undefined && patch.autoSubmitThreshold !== before.autoSubmitThreshold)
        changes.push(`threshold ${before.autoSubmitThreshold} → ${patch.autoSubmitThreshold}`);
      if (patch.killSwitch !== undefined && patch.killSwitch !== before.killSwitch)
        changes.push(`kill switch ${patch.killSwitch ? "engaged" : "released"}`);
      if (patch.trustByPayer)
        for (const [payer, mode] of Object.entries(patch.trustByPayer))
          if (before.trustByPayer[payer] !== mode)
            changes.push(`${payer} ${before.trustByPayer[payer]} → ${mode}`);

      appendAudit({
        tenantId: store.policy.tenantId,
        actorId: userId,
        actorName: store.users.find((u) => u.id === userId)?.name ?? "Admin",
        actorType: "user",
        action: "policy.changed",
        targetType: "PolicyConfig",
        targetId: store.policy.id,
        summary: changes.length ? changes.join("; ") : "Policy saved with no effective change",
        metadata: { version: store.policy.version },
      });

      return snapshot(store.policy);
    }, 400, 900);
  },

  /* ---------------------------------------------------------------- *
   * Users, tenants, audit
   * ---------------------------------------------------------------- */

  async listUsers(): Promise<User[]> {
    return simulate(() => snapshot(store.users), 160, 380);
  },

  async listTenants() {
    return simulate(() => snapshot(tenants), 140, 320);
  },

  async listAudit(filter: { actorType?: string; action?: string; search?: string } = {}): Promise<AuditEvent[]> {
    return simulate(() => {
      let rows = store.audit;
      if (filter.actorType) rows = rows.filter((e) => e.actorType === filter.actorType);
      if (filter.action) rows = rows.filter((e) => e.action.startsWith(filter.action!));
      if (filter.search) {
        const q = filter.search.toLowerCase();
        rows = rows.filter(
          (e) =>
            e.summary.toLowerCase().includes(q) ||
            e.actorName.toLowerCase().includes(q) ||
            e.targetId.toLowerCase().includes(q) ||
            (e.externalRef ?? "").toLowerCase().includes(q),
        );
      }
      return snapshot(rows);
    }, 220, 520);
  },

  /** Verify the audit hash chain, so the viewer can state it rather than imply it. */
  verifyAuditChain(): { valid: boolean; checked: number; brokenAt?: string } {
    const chronological = [...store.audit].reverse();
    for (let i = 1; i < chronological.length; i += 1) {
      if (chronological[i].prevHash !== chronological[i - 1].hash) {
        return { valid: false, checked: chronological.length, brokenAt: chronological[i].id };
      }
    }
    return { valid: true, checked: chronological.length };
  },
};

export const notificationService = {
  async list(userId: string): Promise<Notification[]> {
    return simulate(
      () => snapshot(store.notifications.filter((n) => n.userId === userId)),
      140,
      340,
    );
  },

  async markRead(id: string) {
    return simulate(() => {
      const n = store.notifications.find((x) => x.id === id);
      if (n) n.readAt = new Date().toISOString();
      return true;
    }, 80, 180);
  },

  async markAllRead(userId: string) {
    return simulate(() => {
      for (const n of store.notifications) {
        if (n.userId === userId && !n.readAt) n.readAt = new Date().toISOString();
      }
      return true;
    }, 140, 320);
  },
};
