/**
 * Admin surface: connectors, field mappings, automation policy, users,
 * audit and notifications.
 */

import { getConnection, getConnector } from "@/connectors/registry";
import { connectorMappings, connectors, store, tenants, usageRecords } from "@/mocks";
import type {
  AuditEvent,
  BillingAccount,
  Connector,
  ConnectorInstance,
  ConnectorMapping,
  Invoice,
  Notification,
  NotificationChannel,
  NotificationEventType,
  NotificationPreference,
  PolicyConfig,
  Tenant,
  TrustMode,
  UsageRecord,
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

  /**
   * Tenants.
   *
   * A platform admin sees every tenant; a tenant admin sees only their own.
   * Same screen, same call, different reach — which is the whole point of
   * merging the two admin personas into one.
   */
  async listTenants(scope: "tenant" | "platform" = "platform", tenantId?: string): Promise<Tenant[]> {
    return simulate(
      () => snapshot(scope === "platform" ? tenants : tenants.filter((t) => t.id === tenantId)),
      140,
      320,
    );
  },

  async getTenant(id: string): Promise<Tenant | undefined> {
    return simulate(() => snapshot(tenants.find((t) => t.id === id)), 110, 260);
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

  /* ---------------------------------------------------------------- *
   * Delivery preferences — email and web push
   *
   * In-app delivery is not a preference; it is the queue itself. These two
   * channels are what leaves the building, and each is opt-out per event
   * type. Turning one off suppresses delivery only — the event still fires,
   * the in-app row still appears, the audit entry is still written.
   * ---------------------------------------------------------------- */

  async listPreferences(userId: string): Promise<NotificationPreference[]> {
    return simulate(
      () => snapshot(store.notificationPreferences.filter((p) => p.userId === userId)),
      120,
      280,
    );
  },

  async setPreference(
    userId: string,
    eventType: NotificationEventType,
    channel: Exclude<NotificationChannel, "in-app">,
    enabled: boolean,
  ): Promise<NotificationPreference> {
    return simulate(() => {
      let pref = store.notificationPreferences.find(
        (p) => p.userId === userId && p.eventType === eventType,
      );
      if (!pref) {
        pref = { userId, eventType, email: true, webPush: true };
        store.notificationPreferences.push(pref);
      }
      if (channel === "email") pref.email = enabled;
      else pref.webPush = enabled;
      return snapshot(pref);
    }, 180, 420);
  },

  async getWebPush(userId: string) {
    return simulate(
      () => snapshot(store.webPush.find((w) => w.userId === userId)) ?? { userId, permission: "default" as const },
      100,
      240,
    );
  },

  /**
   * Stands in for the browser permission prompt plus the service-worker
   * registration. In production this is `Notification.requestPermission()`
   * followed by `pushManager.subscribe()`, and the endpoint it returns is
   * what the notification service posts to.
   */
  async enableWebPush(userId: string) {
    return simulate(() => {
      let sub = store.webPush.find((w) => w.userId === userId);
      if (!sub) {
        sub = { userId, permission: "granted" };
        store.webPush.push(sub);
      }
      sub.permission = "granted";
      sub.endpointRef = `wps_${Math.random().toString(16).slice(2, 10)}`;
      sub.deviceLabel = "This browser";
      sub.subscribedAt = new Date().toISOString();
      return snapshot(sub);
    }, 500, 1100);
  },

  async disableWebPush(userId: string) {
    return simulate(() => {
      const sub = store.webPush.find((w) => w.userId === userId);
      if (sub) {
        sub.permission = "default";
        sub.endpointRef = undefined;
        sub.subscribedAt = undefined;
      }
      return true;
    }, 220, 480);
  },
};

/**
 * Billing.
 *
 * Money lives at Stripe; this service reads back what Stripe holds and
 * never touches an instrument. A pass-through invoice line can be expanded
 * into the usage records behind it, and each of those names the case that
 * caused the spend — the submission waterfall, priced.
 */
export const billingService = {
  async getAccount(tenantId: string): Promise<BillingAccount | undefined> {
    return simulate(() => snapshot(store.billing.find((b) => b.tenantId === tenantId)), 160, 380);
  },

  async listAccounts(): Promise<BillingAccount[]> {
    return simulate(() => snapshot(store.billing), 180, 420);
  },

  async listInvoices(tenantId: string): Promise<Invoice[]> {
    return simulate(
      () =>
        snapshot(
          store.invoices
            .filter((i) => i.tenantId === tenantId)
            .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1)),
        ),
      200,
      480,
    );
  },

  /** The metered consumption behind a pass-through line. */
  async usageFor(tenantId: string, kind?: UsageRecord["kind"]): Promise<UsageRecord[]> {
    return simulate(
      () =>
        snapshot(
          usageRecords.filter((u) => u.tenantId === tenantId && (!kind || u.kind === kind)),
        ),
      160,
      360,
    );
  },

  /**
   * Settles an open invoice. In production this is a Stripe payment intent
   * against the stored payment method; nothing here handles card data.
   */
  async payInvoice(invoiceId: string, userId: string): Promise<Invoice> {
    const invoice = store.invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new ApiError("Invoice not found", 404, "not_found");
    if (invoice.status === "paid") throw new ApiError("Invoice is already paid", 409, "conflict");

    return simulate(() => {
      invoice.status = "paid";
      appendAudit({
        tenantId: invoice.tenantId,
        actorId: userId,
        actorName: store.users.find((u) => u.id === userId)?.name ?? "Admin",
        actorType: "user",
        action: "invoice.paid",
        targetType: "Invoice",
        targetId: invoice.id,
        externalRef: invoice.stripeInvoiceRef,
        summary: `Invoice ${invoice.number} settled`,
        metadata: { totalUsd: invoice.totalUsd },
      });
      return snapshot(invoice);
    }, 900, 1800);
  },

  async updatePassThroughMode(
    tenantId: string,
    mode: BillingAccount["passThroughMode"],
    userId: string,
  ): Promise<BillingAccount> {
    const account = store.billing.find((b) => b.tenantId === tenantId);
    if (!account) throw new ApiError("Billing account not found", 404, "not_found");
    return simulate(() => {
      account.passThroughMode = mode;
      appendAudit({
        tenantId,
        actorId: userId,
        actorName: store.users.find((u) => u.id === userId)?.name ?? "Admin",
        actorType: "user",
        action: "billing.changed",
        targetType: "BillingAccount",
        targetId: tenantId,
        summary: `Pass-through usage set to ${mode}`,
        metadata: { mode },
      });
      return snapshot(account);
    }, 400, 900);
  },
};
