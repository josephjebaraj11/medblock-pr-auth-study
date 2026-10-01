/**
 * Notification centre.
 *
 * Three channels, one payload rule. In-app is the queue itself and is never
 * a preference; **email** and **web push** are what actually leave the
 * building, and each is opt-out per event type.
 *
 * Every payload here carries an ID and a type and nothing else. No patient
 * name, no diagnosis, no CPT code, no payer rationale — a message says a case
 * needs attention and links back into the app, where access is re-checked.
 * That rule comes straight from the source material, and it is the reason
 * these messages read as deliberately vague. It does not relax for email or
 * for push: an inbox and a lock screen are the two places PHI must never sit.
 */

import {
  Bell,
  BellOff,
  Check,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingBlock,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { relative } from "@/lib/format";
import { useSession } from "@/lib/session";
import { notifiableEvents } from "@/mocks";
import { notificationService } from "@/services/adminService";
import type {
  Notification,
  NotificationPreference,
  RoleId,
  WebPushSubscription,
} from "@/types";

/**
 * Which personas a given event can reach.
 *
 * The notification service scopes its fan-out the same way, so this table is
 * a mirror of a server-side rule rather than a presentation choice.
 */
const EVENT_AUDIENCE: Record<string, RoleId[]> = {
  "case.clinical-review-required": ["clinical-reviewer"],
  "case.approval-required": ["staff-operations"],
  "case.rfi-received": ["staff-operations"],
  "case.decision-received": ["staff-operations", "clinical-reviewer"],
  "case.approval-expiring": ["staff-operations"],
  "case.sla-at-risk": ["staff-operations"],
  "case.appeal-outcome": ["clinical-reviewer"],
  "case.p2p-scheduled": ["clinical-reviewer"],
  "connection.state-changed": ["staff-operations", "admin"],
  "policy.changed": ["admin"],
  "billing.invoice-issued": ["admin"],
  "tenant.onboarding-step": ["admin"],
};

const CHANNEL_ICON = {
  "in-app": <Bell size={11} />,
  email: <Mail size={11} />,
  "web-push": <MonitorSmartphone size={11} />,
} as const;

/** A small accessible switch, used for the per-event channel toggles. */
function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-brand-600" : "bg-line"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-surface-raised shadow-soft transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
        aria-hidden
      />
    </button>
  );
}

export default function Notifications() {
  const { user, role } = useSession();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [push, setPush] = useState<WebPushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    notificationService.list(user.id).then(setItems);
    notificationService.listPreferences(user.id).then(setPrefs);
    notificationService.getWebPush(user.id).then(setPush);
  }, [user]);

  useEffect(load, [load]);

  const markAll = async () => {
    if (!user) return;
    setBusy(true);
    await notificationService.markAllRead(user.id);
    load();
    setBusy(false);
  };

  const togglePref = async (
    eventType: NotificationPreference["eventType"],
    channel: "email" | "webPush",
    next: boolean,
  ) => {
    if (!user) return;
    // Optimistic: the switch should not wait on a round trip.
    setPrefs((rows) =>
      rows.map((p) => (p.eventType === eventType ? { ...p, [channel]: next } : p)),
    );
    await notificationService.setPreference(
      user.id,
      eventType,
      channel === "email" ? "email" : "web-push",
      next,
    );
  };

  const togglePush = async () => {
    if (!user) return;
    setPushBusy(true);
    const updated =
      push?.permission === "granted"
        ? (await notificationService.disableWebPush(user.id), await notificationService.getWebPush(user.id))
        : await notificationService.enableWebPush(user.id);
    setPush(updated);
    setPushBusy(false);
  };

  const unread = (items ?? []).filter((n) => !n.readAt);
  const pushOn = push?.permission === "granted";
  const prefFor = (type: string) => prefs.find((p) => p.eventType === type);

  // Only the events this persona can actually receive are worth showing —
  // the same role-scoping the notification service applies when it fans out.
  const myEvents = notifiableEvents.filter((e) =>
    role ? EVENT_AUDIENCE[e.type].includes(role.id) : true,
  );

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="What needs you"
        description="Alerts for the cases assigned to you, and where each one is delivered."
        actions={
          unread.length > 0 && (
            <Button icon={<Check size={15} />} loading={busy} onClick={markAll}>
              Mark all read
            </Button>
          )
        }
      />

      <Callout tone="brand" icon={<BellOff size={15} />} title="No clinical detail travels in these">
        A notification carries an ID and an event type. It never carries a
        patient name, a diagnosis or a procedure code — so nothing clinical
        sits in an inbox or a push message. The link brings you back here,
        where your access is checked again. The rule is identical on all three
        channels.
      </Callout>

      {/* ----------------------- delivery ----------------------- */}
      <Card className="mt-5">
        <CardHeader
          title="Delivery"
          description="In-app is the queue and is always on. Email and web push are what leave the building."
        />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface-inset px-3.5 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-content">
                <Mail size={15} className="text-content-muted" aria-hidden />
                Email
              </p>
              <p className="mt-1 text-xs leading-relaxed text-content-secondary">
                Transactional, sent to{" "}
                <span className="font-medium text-content">{user?.email}</span>. Subject and body are
                generated from the event type alone, so the message is safe to sit in an inbox.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-surface-inset px-3.5 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-content">
                  <MonitorSmartphone size={15} className="text-content-muted" aria-hidden />
                  Web push
                </p>
                <Badge tone={pushOn ? "accent" : "neutral"} dot>
                  {pushOn ? "Enabled" : push?.permission === "denied" ? "Blocked" : "Not enabled"}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-content-secondary">
                {pushOn
                  ? `Delivered through a browser service worker to ${push?.deviceLabel ?? "this browser"}.`
                  : "A browser service worker delivers these without the dashboard being open."}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Button
                  variant={pushOn ? "secondary" : "primary"}
                  loading={pushBusy}
                  disabled={push?.permission === "denied"}
                  onClick={togglePush}
                >
                  {pushOn ? "Turn off on this device" : "Enable web push"}
                </Button>
                {push?.endpointRef && (
                  <code className="font-mono text-[10px] text-content-muted">
                    {push.endpointRef}
                  </code>
                )}
              </div>
            </div>
          </div>

          <TableWrap>
              <thead>
                <tr>
                  <Th>Event</Th>
                  <Th>Who gets it</Th>
                  <Th className="text-center">Email</Th>
                  <Th className="text-center">Web push</Th>
                </tr>
              </thead>
              <tbody>
                {myEvents.map((e) => {
                  const pref = prefFor(e.type);
                  return (
                    <tr key={e.type}>
                      <Td>
                        <span className="block font-medium text-content">{e.label}</span>
                        <span className="block text-xs text-content-muted">{e.description}</span>
                        <code className="mt-0.5 block font-mono text-[10px] text-content-muted">
                          {e.type}
                        </code>
                      </Td>
                      <Td className="text-xs text-content-secondary">{e.audience}</Td>
                      <Td className="text-center">
                        <Toggle
                          checked={pref?.email ?? true}
                          label={`Email for ${e.label}`}
                          onChange={(next) => togglePref(e.type, "email", next)}
                        />
                      </Td>
                      <Td className="text-center">
                        <Toggle
                          checked={(pref?.webPush ?? true) && pushOn}
                          disabled={!pushOn}
                          label={`Web push for ${e.label}`}
                          onChange={(next) => togglePref(e.type, "webPush", next)}
                        />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
          </TableWrap>

          <p className="flex gap-2 text-xs leading-relaxed text-content-muted">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              Turning a channel off suppresses <em>delivery</em> only. The domain
              event still fires, the in-app row still appears here, and the audit
              entry is still written — a preference can never make something
              disappear from the record.
            </span>
          </p>
        </CardBody>
      </Card>

      {/* ----------------------- feed ----------------------- */}
      <Card className="mt-5">
        <CardHeader
          title="Recent"
          description={`${unread.length} unread of ${items?.length ?? 0}.`}
        />

        {!items ? (
          <LoadingBlock label="Loading notifications" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} />}
            title="Nothing here"
            description="You have no notifications."
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.link}
                  onClick={() => notificationService.markRead(n.id)}
                  className={`block px-4 py-3.5 transition-colors hover:bg-surface-inset/60 ${
                    n.readAt ? "" : "bg-tint-brand/30"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="flex items-center gap-2">
                      {!n.readAt && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
                          aria-label="Unread"
                        />
                      )}
                      <span className="text-sm font-semibold text-content">{n.title}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {n.priority === "high" && <Badge tone="signal">High</Badge>}
                      <span className="whitespace-nowrap text-xs text-content-muted">
                        {relative(n.createdAt)}
                      </span>
                    </span>
                  </div>

                  <p className="mt-0.5 text-sm text-content-secondary">{n.body}</p>

                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-content-muted">
                    <code className="font-mono text-[10px]">{n.eventType}</code>
                    {n.channel.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1">
                        {CHANNEL_ICON[c]}
                        {c}
                      </span>
                    ))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
