/**
 * Payers, their real capability surface, the policy catalog, and the tenant's
 * automation policy.
 *
 * The automation controls here are the ones the source material insists must
 * be configuration rather than a code change — threshold, kill switch and the
 * per-payer trust ramp — and every change writes a new policy version into
 * the audit log.
 */

import { AlertTriangle, Check, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PayerChip } from "@/components/case";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardBody,
  LoadingBlock,
  PageHeader,
  TableWrap,
  Tabs,
  Td,
  Th,
} from "@/components/ui";
import { dateTime, fullDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import { payerCriteria, payers } from "@/mocks";
import { adminService } from "@/services/adminService";
import type { PolicyConfig, TrustMode } from "@/types";

const TRUST_COPY: Record<TrustMode, { label: string; tone: "neutral" | "brand" | "accent"; note: string }> = {
  shadow: {
    label: "Shadow",
    tone: "neutral",
    note: "The agent proposes every action; a human releases each one.",
  },
  supervised: {
    label: "Supervised",
    tone: "brand",
    note: "Low-risk actions go live automatically; anything above the threshold still waits for a person.",
  },
  wider: {
    label: "Wider autonomy",
    tone: "accent",
    note: "Broader auto-submit. Granted only by explicit written sign-off, per payer and per workflow.",
  },
};

export default function AdminPayers() {
  const { user } = useSession();
  const [tab, setTab] = useState<"automation" | "payers" | "policies">("automation");
  const [policy, setPolicy] = useState<PolicyConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    adminService.getPolicy().then((p) => active && setPolicy(p));
    return () => {
      active = false;
    };
  }, []);

  const update = async (
    patch: Parameters<typeof adminService.updatePolicy>[0],
    note: string,
  ) => {
    setBusy(true);
    setSaved(null);
    try {
      const next = await adminService.updatePolicy({ ...patch, changeNote: note }, user!.id);
      setPolicy(next);
      setSaved(`Saved as policy version ${next.version}. The change is in the audit log.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Payers &amp; rules"
        description="What each payer can actually do, which policies apply, and how much the agent is trusted to do unattended."
      />

      <Card>
        <div className="px-4 pt-1">
          <Tabs
            label="Payer views"
            active={tab}
            onChange={setTab}
            tabs={[
              { id: "automation", label: "Automation policy" },
              { id: "payers", label: "Payers", count: payers.length },
              { id: "policies", label: "Policy catalog", count: payerCriteria.length },
            ]}
          />
        </div>

        {/* ---------------- Automation ---------------- */}
        {tab === "automation" &&
          (!policy ? (
            <LoadingBlock label="Loading policy" />
          ) : (
            <CardBody className="space-y-6">
              {saved && (
                <Callout tone="accent" icon={<Check size={15} />}>
                  {saved}
                </Callout>
              )}

              {policy.killSwitch && (
                <Callout
                  tone="danger"
                  icon={<ShieldAlert size={15} />}
                  title="Kill switch engaged"
                >
                  Nothing submits automatically. Every case waits for a human
                  release, whatever its confidence score or the payer's trust
                  mode.
                </Callout>
              )}

              <section>
                <h3 className="text-sm font-semibold text-content">Auto-submit threshold</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-content-muted">
                  A case submits unattended only at or above this confidence. Below
                  it, the case waits for a person — pre-loaded with the agent's
                  findings, so they correct rather than start over.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label htmlFor="threshold" className="sr-only">
                    Auto-submit threshold
                  </label>
                  <input
                    id="threshold"
                    type="range"
                    min={0.5}
                    max={0.99}
                    step={0.01}
                    value={policy.autoSubmitThreshold}
                    onChange={(e) =>
                      setPolicy({ ...policy, autoSubmitThreshold: Number(e.target.value) })
                    }
                    onMouseUp={(e) =>
                      update(
                        { autoSubmitThreshold: Number((e.target as HTMLInputElement).value) },
                        "Threshold adjusted from the admin console.",
                      )
                    }
                    className="h-2 w-full max-w-sm cursor-pointer appearance-none rounded-full bg-surface-inset accent-brand-600"
                  />
                  <span className="text-2xl font-semibold tabular-nums text-content">
                    {policy.autoSubmitThreshold.toFixed(2)}
                  </span>
                </div>
              </section>

              <section className="border-t border-line-subtle pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-content">Kill switch</h3>
                    <p className="mt-0.5 max-w-lg text-xs leading-relaxed text-content-muted">
                      Stops all unattended submission immediately, across every
                      payer. Intended for a payer outage, a suspected extraction
                      fault, or any moment where you want everything to pause.
                    </p>
                  </div>
                  <Button
                    variant={policy.killSwitch ? "primary" : "danger"}
                    loading={busy}
                    onClick={() =>
                      update(
                        { killSwitch: !policy.killSwitch },
                        policy.killSwitch ? "Kill switch released." : "Kill switch engaged.",
                      )
                    }
                  >
                    {policy.killSwitch ? "Release kill switch" : "Engage kill switch"}
                  </Button>
                </div>
              </section>

              <section className="border-t border-line-subtle pt-5">
                <h3 className="text-sm font-semibold text-content">Trust ramp, per payer</h3>
                <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-content-muted">
                  Autonomy is granted per payer and per workflow, never all at
                  once, and only as the exception rate proves it out. Promotion to
                  wider autonomy needs explicit written sign-off.
                </p>

                <ul className="mt-3 space-y-2">
                  {payers.map((p) => {
                    const mode = policy.trustByPayer[p.id] ?? "shadow";
                    return (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-3"
                      >
                        <div className="min-w-0">
                          <PayerChip payerId={p.id} />
                          <p className="mt-1 text-xs leading-relaxed text-content-muted">
                            {TRUST_COPY[mode].note}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          {(["shadow", "supervised", "wider"] as TrustMode[]).map((m) => (
                            <button
                              key={m}
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                update(
                                  { trustByPayer: { [p.id]: m } },
                                  `${p.name} moved to ${m}.`,
                                )
                              }
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                mode === m
                                  ? "bg-brand-600 text-white"
                                  : "bg-surface-inset text-content-secondary hover:bg-surface hover:text-content"
                              }`}
                            >
                              {TRUST_COPY[m].label}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="border-t border-line-subtle pt-5">
                <h3 className="text-sm font-semibold text-content">Decision timers</h3>
                <dl className="mt-2 grid gap-x-6 gap-y-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-medium text-content-muted">Expedited</dt>
                    <dd className="mt-0.5 text-sm text-content">
                      {policy.expeditedDecisionHours} hours
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-content-muted">Standard</dt>
                    <dd className="mt-0.5 text-sm text-content">
                      {policy.standardDecisionHours} hours (7 calendar days)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-content-muted">Current version</dt>
                    <dd className="mt-0.5 text-sm text-content">
                      v{policy.version} · changed {dateTime(policy.changedAt)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs leading-relaxed text-content-muted">
                  These mirror the CMS-0057-F decision timeframes that have applied
                  to impacted payers since 1 January 2026. Verify against current
                  regulation before relying on them.
                </p>
              </section>
            </CardBody>
          ))}

        {/* ---------------- Payers ---------------- */}
        {tab === "payers" && (
          <TableWrap>
            <caption className="sr-only">Payer capabilities</caption>
            <thead>
              <tr>
                <Th>Payer</Th>
                <Th>Regulatory category</Th>
                <Th>CRD</Th>
                <Th>DTR</Th>
                <Th>PAS</Th>
                <Th>CDex</Th>
                <Th>278</Th>
                <Th>Portal</Th>
                <Th>Automated caller</Th>
              </tr>
            </thead>
            <tbody>
              {payers.map((p) => {
                const cell = (ok: boolean) =>
                  ok ? (
                    <Check size={15} className="text-tint-accent-on" aria-label="Supported" />
                  ) : (
                    <X size={15} className="text-content-muted" aria-label="Not supported" />
                  );
                return (
                  <tr key={p.id}>
                    <Td>
                      <PayerChip payerId={p.id} />
                      {p.capabilities.igVersion && (
                        <span className="mt-0.5 block text-xs text-content-muted">
                          Da Vinci IG {p.capabilities.igVersion}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="text-xs text-content">
                        {p.regulatoryCategory.replace(/-/g, " ")}
                      </span>
                      <Badge tone={p.cms0057Impacted ? "brand" : "neutral"} className="ml-1.5">
                        {p.cms0057Impacted ? "Impacted" : "Not impacted"}
                      </Badge>
                    </Td>
                    <Td>{cell(p.capabilities.crd)}</Td>
                    <Td>{cell(p.capabilities.dtr)}</Td>
                    <Td>{cell(p.capabilities.pas)}</Td>
                    <Td>{cell(p.capabilities.cdex)}</Td>
                    <Td>{cell(p.capabilities.x12_278)}</Td>
                    <Td>{cell(p.capabilities.portal)}</Td>
                    <Td>
                      {p.automatedCallerPermitted ? (
                        <Badge tone="accent">Permitted</Badge>
                      ) : (
                        <Badge tone="signal">
                          <AlertTriangle size={11} aria-hidden />
                          Not permitted
                        </Badge>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}

        {/* ---------------- Policies ---------------- */}
        {tab === "policies" && (
          <ul className="divide-y divide-line-subtle">
            {payerCriteria.map((c) => (
              <li key={c.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-content">{c.title}</p>
                    <p className="mt-0.5 text-xs text-content-muted">
                      {c.policyNumber} v{c.version} ·{" "}
                      {payers.find((p) => p.id === c.payerId)?.name} · effective{" "}
                      {fullDate(c.effectiveFrom)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={c.paRequired ? "brand" : "accent"}>
                      {c.paRequired ? "PA required" : "No PA required"}
                    </Badge>
                    <Badge tone="neutral">Reviewed {fullDate(c.lastReviewedAt)}</Badge>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.serviceCodes.map((code) => (
                    <code
                      key={code}
                      className="rounded bg-surface-inset px-1.5 py-0.5 font-mono text-[11px] text-content"
                    >
                      {code}
                    </code>
                  ))}
                </div>

                {c.criteria.length > 0 && (
                  <ol className="mt-3 space-y-1.5">
                    {c.criteria.map((item) => (
                      <li key={item.id} className="flex gap-2 text-xs">
                        <span className="shrink-0 text-content-muted">
                          {item.required ? "Required" : "Optional"}
                        </span>
                        <span className="text-content-secondary">
                          <span className="font-medium text-content">{item.label}</span> —{" "}
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <p className="mt-2 text-xs text-content-muted">
                  Channel preference: {c.channelPreference.join(" → ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {tab === "policies" && (
        <p className="mt-4 text-xs leading-relaxed text-content-muted">
          These policies are invented for the prototype. The source folder
          contains no real payer medical-policy content, and the material is
          explicit that a stale payer-requirement matrix is the single biggest
          source of wrong submissions — in production this catalog needs a named
          owner and a review schedule.
        </p>
      )}
    </>
  );
}
