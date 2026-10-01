/**
 * Billing.
 *
 * The commercial model the source material documents: a tiered annual
 * license priced on physician count, a flat monthly managed-services and
 * cloud fee, one-time onboarding and net-new integration charges, and
 * variable pass-through usage. It is a SaaS subscription — not a price per
 * prior authorization.
 *
 * Stripe is the system of record for money. This screen reads back the plan,
 * the invoices and the metered usage; it never touches a card number. The
 * only instrument detail that reaches the browser is a brand and a last four.
 *
 * The part worth demonstrating is the last table: a pass-through line
 * expands into the usage behind it, and every usage row names the case that
 * caused the spend. That is the submission waterfall, priced honestly — an
 * electronic check costs a fraction of a voice call, and the invoice shows it.
 */

import {
  Banknote,
  Check,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  Scale,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  LoadingBlock,
  PageHeader,
  Stat,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { fullDate } from "@/lib/format";
import { planCatalog, store } from "@/mocks";
import { useSession } from "@/lib/session";
import { billingService } from "@/services/adminService";
import type { BillingAccount, Invoice, UsageRecord } from "@/types";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const STATUS_TONE = {
  paid: "accent",
  open: "signal",
  "past-due": "danger",
  draft: "neutral",
  void: "neutral",
} as const;

const LINE_LABEL = {
  license: "License",
  "managed-services": "Managed services",
  onboarding: "Onboarding",
  integration: "Integration",
  "pass-through": "Pass-through",
} as const;

const METHOD_ICON = {
  card: <CreditCard size={15} />,
  ach: <Landmark size={15} />,
  "invoice-net30": <Receipt size={15} />,
} as const;

export default function AdminBilling() {
  const { user } = useSession();
  const [account, setAccount] = useState<BillingAccount | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const tenantId = user?.tenantId ?? "";

  const load = useCallback(() => {
    if (!tenantId) return;
    let active = true;
    Promise.all([
      billingService.getAccount(tenantId),
      billingService.listInvoices(tenantId),
      billingService.usageFor(tenantId),
    ]).then(([acc, inv, use]) => {
      if (!active) return;
      setAccount(acc ?? null);
      setInvoices(inv);
      setUsage(use);
    });
    return () => {
      active = false;
    };
  }, [tenantId]);

  useEffect(load, [load]);

  const pay = async (invoiceId: string) => {
    if (!user) return;
    setBusy(invoiceId);
    setNote(null);
    try {
      await billingService.payInvoice(invoiceId, user.id);
      setNote("Payment recorded. Stripe settled against the stored method, and the audit log has the entry.");
      load();
    } finally {
      setBusy(null);
    }
  };

  const setMode = async (mode: BillingAccount["passThroughMode"]) => {
    if (!user) return;
    setBusy("mode");
    setNote(null);
    try {
      const updated = await billingService.updatePassThroughMode(tenantId, mode, user.id);
      setAccount(updated);
      setNote(
        mode === "itemised"
          ? "Pass-through costs will be itemised per channel on the next invoice."
          : "Pass-through costs will be folded into the flat monthly fee from the next invoice.",
      );
    } finally {
      setBusy(null);
    }
  };

  const current = invoices?.find((i) => i.status === "open" || i.status === "past-due");

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Billing"
        description="Plan, invoices and the metered usage behind them. One Stripe customer per tenant."
      />

      {!account || !invoices ? (
        <Card>
          <LoadingBlock label="Loading billing" />
        </Card>
      ) : (
        <>
          <Callout tone="brand" icon={<Scale size={15} />} title="A subscription, not a price per authorization">
            A tiered annual license on physician count, a flat monthly
            managed-services and cloud fee, one-time onboarding and net-new
            integration work, and variable pass-through usage. The{" "}
            <strong>$4-per-PA</strong> figure in the market model is a sizing
            device, never the billing mechanism.
          </Callout>

          {note && (
            <Callout tone="accent" icon={<Check size={15} />} title="Done" className="mt-4">
              {note}
            </Callout>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Plan"
              value={<span className="capitalize">{account.plan}</span>}
              hint={`${account.licensedPhysicians} licensed physicians`}
            />
            <Stat
              label="Annual license"
              value={usd(account.annualLicenseUsd)}
              hint={`Renews ${fullDate(account.renewsAt)}`}
            />
            <Stat
              label="Managed services"
              value={`${usd(account.managedServicesMonthlyUsd)}/mo`}
              hint="Flat — hosting, platform, baseline run cost"
            />
            <Stat
              label={current ? "Current invoice" : "Nothing outstanding"}
              value={current ? usd(current.totalUsd) : "—"}
              tone={current?.status === "past-due" ? "danger" : current ? "signal" : "accent"}
              hint={current ? `Due ${fullDate(current.dueAt)}` : undefined}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {/* ------------------------- account ------------------------- */}
            <Card>
              <CardHeader title="Account" description="Held at Stripe, read back here." />
              <CardBody className="space-y-3 text-sm">
                <dl className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-content-muted">Stripe customer</dt>
                    <dd className="font-mono text-xs text-content">{account.stripeCustomerRef}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-content-muted">Billing email</dt>
                    <dd className="text-right text-content">{account.billingEmail}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-content-muted">Status</dt>
                    <dd>
                      <Badge tone={account.status === "active" ? "accent" : account.status === "past-due" ? "danger" : "signal"} dot>
                        {account.status}
                      </Badge>
                    </dd>
                  </div>
                </dl>

                <div className="rounded-lg border border-line bg-surface-inset px-3 py-2.5">
                  <p className="flex items-center gap-2 text-sm font-medium text-content">
                    <span className="text-content-muted" aria-hidden>
                      {METHOD_ICON[account.paymentMethod.kind]}
                    </span>
                    {account.paymentMethod.kind === "invoice-net30"
                      ? "Invoice · net 30"
                      : `${account.paymentMethod.brand} ···· ${account.paymentMethod.last4}`}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-content-muted">
                    {account.paymentMethod.expMonth
                      ? `Expires ${String(account.paymentMethod.expMonth).padStart(2, "0")}/${account.paymentMethod.expYear}. `
                      : ""}
                    The instrument lives at Stripe under{" "}
                    <code className="font-mono">{account.paymentMethod.stripeRef}</code>. No card or
                    bank number ever reaches this application.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* ------------------------- usage mode ------------------------- */}
            <Card>
              <CardHeader
                title="Variable costs"
                description="Clearinghouse transactions, portal sessions, voice minutes, model usage and fax pages."
              />
              <CardBody className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(["itemised", "included"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setMode(mode)}
                      disabled={busy === "mode"}
                      aria-pressed={account.passThroughMode === mode}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                        account.passThroughMode === mode
                          ? "border-brand-500 bg-tint-brand text-tint-brand-on"
                          : "border-line bg-surface-raised text-content-secondary hover:bg-surface-inset"
                      }`}
                    >
                      {mode === "itemised" ? "Itemise per channel" : "Fold into flat fee"}
                    </button>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-content-secondary">
                  Itemising prices the waterfall honestly: an electronic check
                  costs a fraction of a cent, a voice call costs dollars. A
                  tenant that would rather see one predictable number can fold
                  it in instead — the metering still runs, so the usage table
                  below is populated either way.
                </p>
              </CardBody>
            </Card>

            {/* ------------------------- plans ------------------------- */}
            <Card>
              <CardHeader title="Tiers" description="Priced by physician count, not by authorization." />
              <TableWrap>
                  <thead>
                    <tr>
                      <Th>Tier</Th>
                      <Th>Physicians</Th>
                      <Th className="text-right">License / yr</Th>
                      <Th className="text-right">Onboarding</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {planCatalog.map((p) => (
                      <tr
                        key={p.plan}
                        className={p.plan === account.plan ? "bg-tint-brand/40" : undefined}
                      >
                        <Td className="font-medium capitalize text-content">
                          {p.plan}
                          {p.plan === account.plan && (
                            <Badge tone="brand" className="ml-2">
                              Yours
                            </Badge>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap">{p.physicians}</Td>
                        <Td className="text-right tabular-nums">{usd(p.annualLicenseUsd)}</Td>
                        <Td className="text-right tabular-nums">{usd(p.onboardingUsd)}</Td>
                      </tr>
                    ))}
                  </tbody>
              </TableWrap>
            </Card>
          </div>

          {/* ------------------------- invoices ------------------------- */}
          <Card className="mt-5">
            <CardHeader
              title="Invoices"
              description="Open one to see its lines. Every pass-through line traces back to the transaction ledger."
            />
            <ul className="divide-y divide-line-subtle">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                      aria-expanded={expanded === inv.id}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <FileText size={16} className="shrink-0 text-content-muted" aria-hidden />
                      <span className="min-w-0">
                        <span className="block font-mono text-sm font-semibold text-content-brand">
                          {inv.number}
                        </span>
                        <span className="block text-xs text-content-muted">
                          {fullDate(inv.periodStart)} – {fullDate(inv.periodEnd)} ·{" "}
                          <span className="font-mono">{inv.stripeInvoiceRef}</span>
                        </span>
                      </span>
                    </button>

                    <span className="flex items-center gap-3">
                      <Badge tone={STATUS_TONE[inv.status]} dot>
                        {inv.status}
                      </Badge>
                      <span className="tabular-nums text-sm font-semibold text-content">
                        {usd(inv.totalUsd)}
                      </span>
                      {(inv.status === "open" || inv.status === "past-due") && (
                        <Button
                          variant="primary"
                          icon={<Banknote size={15} />}
                          loading={busy === inv.id}
                          onClick={() => pay(inv.id)}
                        >
                          Pay now
                        </Button>
                      )}
                    </span>
                  </div>

                  {expanded === inv.id && (
                    <div className="border-t border-line-subtle bg-surface-inset/50 px-4 py-3">
                      <TableWrap>
                          <thead>
                            <tr>
                              <Th>Type</Th>
                              <Th>Description</Th>
                              <Th className="text-right">Qty</Th>
                              <Th className="text-right">Unit</Th>
                              <Th className="text-right">Amount</Th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.lines.map((line) => (
                              <tr key={line.id}>
                                <Td>
                                  <Badge tone={line.kind === "pass-through" ? "aqua" : "neutral"}>
                                    {LINE_LABEL[line.kind]}
                                  </Badge>
                                </Td>
                                <Td className="text-content-secondary">{line.description}</Td>
                                <Td className="text-right tabular-nums">
                                  {line.quantity.toLocaleString()}
                                  {line.unit ? ` ${line.unit}` : ""}
                                </Td>
                                <Td className="text-right tabular-nums">{usd(line.unitPriceUsd)}</Td>
                                <Td className="text-right font-medium tabular-nums text-content">
                                  {usd(line.amountUsd)}
                                </Td>
                              </tr>
                            ))}
                            <tr>
                              <Td className="font-semibold text-content">Total</Td>
                              <Td>{null}</Td>
                              <Td>{null}</Td>
                              <Td>{null}</Td>
                              <Td className="text-right font-semibold tabular-nums text-content">
                                {usd(inv.totalUsd)}
                              </Td>
                            </tr>
                          </tbody>
                      </TableWrap>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {/* ------------------------- usage ------------------------- */}
          <Card className="mt-5">
            <CardHeader
              title="Usage behind the pass-through lines"
              description="A sample of this period's metering. Each row names the case that caused the spend."
            />
            <TableWrap>
                <thead>
                  <tr>
                    <Th>Recorded</Th>
                    <Th>Kind</Th>
                    <Th className="text-right">Quantity</Th>
                    <Th className="text-right">Unit cost</Th>
                    <Th className="text-right">Cost</Th>
                    <Th>Case</Th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((u) => {
                    const request = store.requests.find((r) => r.id === u.requestId);
                    return (
                      <tr key={u.id}>
                        <Td className="whitespace-nowrap text-content-muted">
                          {fullDate(u.recordedAt)}
                        </Td>
                        <Td>{u.kind.replace(/-/g, " ")}</Td>
                        <Td className="text-right tabular-nums">
                          {u.quantity} {u.unit}
                        </Td>
                        <Td className="text-right tabular-nums">{usd(u.unitCostUsd)}</Td>
                        <Td className="text-right tabular-nums text-content">
                          {usd(u.quantity * u.unitCostUsd)}
                        </Td>
                        <Td className="font-mono text-xs text-content-muted">
                          {request?.caseNumber ?? "—"}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
            </TableWrap>
            <p className="px-4 pb-4 pt-1 text-xs leading-relaxed text-content-muted">
              Admin holds no PHI scope, so a case number is as far as this goes.
              The number is enough to reconcile an invoice; opening the case is
              Operations' or the Clinical Reviewer's job, not an admin's.
            </p>
          </Card>
        </>
      )}
    </>
  );
}
