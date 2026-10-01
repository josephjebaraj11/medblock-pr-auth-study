import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RequestTable } from "@/components/case";
import { Card, LoadingBlock, PageHeader, inputClass } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/format";
import { payers } from "@/mocks";
import { paService } from "@/services/paService";
import type { PaStatus, PriorAuthRequest } from "@/types";

const GROUPS: Record<string, PaStatus[]> = {
  all: [],
  pending: ["submitted", "in-review", "pended", "submitting", "needs-approval"],
  "needs-person": ["clinical-review", "needs-approval", "eligibility-check", "peer-to-peer"],
  decided: ["approved", "partially-approved", "denied"],
  closed: ["no-auth-required", "withdrawn", "expired"],
};

/**
 * The case list.
 *
 * Operations works it from `/ops/requests`; the Clinical Reviewer browses the
 * same list from `/clinical/cases`. One screen, one API call — `linkBase` is
 * the only thing that differs, because the case detail route each persona
 * returns to is their own.
 */
export default function RequestsList({ linkBase = "/ops/requests" }: { linkBase?: string } = {}) {
  const [params, setParams] = useSearchParams();
  const [requests, setRequests] = useState<PriorAuthRequest[] | null>(null);

  const group = params.get("status") ?? "all";
  const payerId = params.get("payer") ?? "";
  const search = params.get("q") ?? "";

  useEffect(() => {
    let active = true;
    paService.list().then((rows) => active && setRequests(rows));
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let rows = requests ?? [];
    const statuses = GROUPS[group] ?? [];
    if (statuses.length) rows = rows.filter((r) => statuses.includes(r.status));
    if (payerId) rows = rows.filter((r) => r.payerId === payerId);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.caseNumber.toLowerCase().includes(q) ||
          r.serviceLines.some(
            (s) => s.code.includes(q) || s.display.toLowerCase().includes(q),
          ),
      );
    }
    return rows;
  }, [requests, group, payerId, search]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        eyebrow="Staff / Operations"
        title="Requests"
        description="Every authorization case for this practice, whatever stage it is at."
      />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-line-subtle px-4 py-3">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="req-search" className="sr-only">
              Search requests
            </label>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
                aria-hidden
              />
              <input
                id="req-search"
                type="search"
                value={search}
                onChange={(e) => setParam("q", e.target.value)}
                placeholder="Case number, CPT code or service"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="req-status"
              className="mb-1 block text-xs font-semibold text-content-secondary"
            >
              Status
            </label>
            <select
              id="req-status"
              value={group}
              onChange={(e) => setParam("status", e.target.value === "all" ? "" : e.target.value)}
              className={inputClass}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending with payer</option>
              <option value="needs-person">Needs a person</option>
              <option value="decided">Decided</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="req-payer"
              className="mb-1 block text-xs font-semibold text-content-secondary"
            >
              Payer
            </label>
            <select
              id="req-payer"
              value={payerId}
              onChange={(e) => setParam("payer", e.target.value)}
              className={inputClass}
            >
              <option value="">All payers</option>
              {payers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <p className="ml-auto pb-2 text-xs tabular-nums text-content-muted">
            {filtered.length} of {requests?.length ?? 0}
          </p>
        </div>

        {!requests ? (
          <LoadingBlock label="Loading requests" />
        ) : (
          <RequestTable requests={filtered} linkBase={linkBase} />
        )}
      </Card>

      <details className="mt-4 rounded-xl border border-line bg-surface-raised px-4 py-3">
        <summary className="cursor-pointer text-xs font-semibold text-content-secondary">
          What each status means
        </summary>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
          {(Object.keys(STATUS_LABEL) as PaStatus[]).map((s) => (
            <div key={s} className="flex gap-2">
              <dt className="shrink-0 font-medium text-content">{STATUS_LABEL[s]}</dt>
              <dd className="text-content-muted">
                {s === "no-auth-required"
                  ? "— evidenced, with a source and reference number"
                  : s === "clinical-review"
                    ? "— waiting on a licensed clinician"
                    : s === "needs-approval"
                      ? "— held by the automation gate"
                      : s === "pended"
                        ? "— payer asked for more"
                        : ""}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </>
  );
}
