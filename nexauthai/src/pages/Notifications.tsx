/**
 * Notification centre.
 *
 * Every payload here carries an ID and a type and nothing else. No patient
 * name, no diagnosis, no CPT code, no payer rationale — a message says a case
 * needs attention and links back into the app, where access is re-checked.
 * That rule comes straight from the source material, and it is the reason
 * these messages read as deliberately vague.
 */

import { Bell, BellOff, Check, Mail, MonitorSmartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHeader,
  EmptyState,
  LoadingBlock,
  PageHeader,
} from "@/components/ui";
import { relative } from "@/lib/format";
import { useSession } from "@/lib/session";
import { notificationService } from "@/services/adminService";
import type { Notification } from "@/types";

const CHANNEL_ICON = {
  "in-app": <Bell size={11} />,
  email: <Mail size={11} />,
  "web-push": <MonitorSmartphone size={11} />,
} as const;

export default function Notifications() {
  const { user } = useSession();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    notificationService.list(user.id).then(setItems);
  }, [user]);

  useEffect(load, [load]);

  const markAll = async () => {
    if (!user) return;
    setBusy(true);
    await notificationService.markAllRead(user.id);
    load();
    setBusy(false);
  };

  const unread = (items ?? []).filter((n) => !n.readAt);

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="What needs you"
        description="Alerts for the cases assigned to you."
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
        where your access is checked again.
      </Callout>

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
