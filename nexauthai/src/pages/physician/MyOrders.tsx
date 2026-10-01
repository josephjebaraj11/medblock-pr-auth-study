import { Plus, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RequestTable } from "@/components/case";
import {
  Button,
  Callout,
  Card,
  CardHeader,
  LoadingBlock,
  PageHeader,
  Stat,
} from "@/components/ui";
import { useSession } from "@/lib/session";
import { computeKpis, paService } from "@/services/paService";
import type { PriorAuthRequest, Task } from "@/types";

export default function MyOrders() {
  const { user } = useSession();
  const [requests, setRequests] = useState<PriorAuthRequest[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!user?.providerId) return;
    let active = true;
    Promise.all([
      paService.list({ orderingProviderId: user.providerId }),
      paService.listTasks("ordering-physician"),
    ]).then(([rows, taskRows]) => {
      if (!active) return;
      setRequests(rows);
      setTasks(taskRows.filter((t) => t.status === "open"));
    });
    return () => {
      active = false;
    };
  }, [user]);

  const kpis = requests ? computeKpis(requests) : null;
  const needsMe = (requests ?? []).filter((r) =>
    ["clinical-review", "denied", "peer-to-peer"].includes(r.status),
  );

  return (
    <>
      <PageHeader
        eyebrow="Ordering physician"
        title="My orders"
        description="You placed these. The agent handles the paperwork and brings you only the questions that need a clinician."
        actions={
          <Button variant="primary" icon={<Plus size={15} />}>
            <Link to="/provider/new">New order</Link>
          </Button>
        }
      />

      {!kpis ? (
        <Card>
          <LoadingBlock label="Loading your orders" />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="In flight" value={kpis.pending} />
            <Stat label="Approved" value={kpis.approved} tone="accent" />
            <Stat label="Denied" value={kpis.denied} tone="danger" />
            <Stat
              label="Waiting on you"
              value={tasks.length}
              tone={tasks.length ? "signal" : "neutral"}
              to="/physician/review"
            />
          </div>

          {needsMe.length > 0 && (
            <Callout
              tone="signal"
              icon={<Stethoscope size={15} />}
              title={`${needsMe.length} case${needsMe.length === 1 ? "" : "s"} need a clinical judgement`}
            >
              The agent has assembled everything it can and stopped short of the
              medical question. It never decides medical necessity.{" "}
              <Link to="/physician/review" className="font-semibold underline">
                Review them
              </Link>
              .
            </Callout>
          )}

          <Card className="mt-6">
            <CardHeader title="All my orders" description={`${requests?.length ?? 0} orders.`} />
            <RequestTable
              requests={requests ?? []}
              linkBase="/physician/orders"
              emptyMessage="You have no orders in the system."
            />
          </Card>
        </>
      )}
    </>
  );
}
