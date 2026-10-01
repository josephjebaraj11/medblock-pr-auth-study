/**
 * Billing fixtures.
 *
 * The commercial model is the one the source material documents, not a
 * per-PA price: a tiered annual license, a flat monthly managed-services
 * and cloud fee, one-time onboarding and net-new integration charges, and
 * variable pass-through costs (clearinghouse transactions, voice minutes,
 * model usage) that a tenant may take itemised or folded into the flat fee.
 *
 * Stripe is the system of record for money; every reference below is a
 * Stripe object id. Card and bank details never reach this application —
 * only a brand and a last four, read back from Stripe.
 *
 * Every pass-through line traces to usage records, and every usage record
 * names the case that caused it. That is what makes an invoice auditable
 * down to the exact cases behind a number.
 */

import type { BillingAccount, Invoice, UsageRecord } from "@/types";
import { PROVIDER_TENANT } from "./core";

export const billingAccounts: BillingAccount[] = [
  {
    tenantId: PROVIDER_TENANT,
    stripeCustomerRef: "cus_NxA7northside01",
    plan: "growth",
    licensedPhysicians: 24,
    annualLicenseUsd: 28_800,
    managedServicesMonthlyUsd: 3_000,
    onboardingOneTimeUsd: 7_500,
    passThroughMode: "itemised",
    currency: "USD",
    billingEmail: "ap@northside.example",
    paymentMethod: {
      kind: "ach",
      last4: "4417",
      brand: "ACH · Riverstone Bank",
      stripeRef: "pm_1QhNorthsideAch",
    },
    renewsAt: "2027-03-02",
    status: "active",
  },
  {
    tenantId: "t-harbor",
    stripeCustomerRef: "cus_NxA7harbor02",
    plan: "scale",
    licensedPhysicians: 61,
    annualLicenseUsd: 58_560,
    managedServicesMonthlyUsd: 3_000,
    onboardingOneTimeUsd: 12_000,
    passThroughMode: "included",
    currency: "USD",
    billingEmail: "finance@harborpoint.example",
    paymentMethod: {
      kind: "card",
      last4: "8822",
      brand: "Visa",
      expMonth: 11,
      expYear: 2028,
      stripeRef: "pm_1QhHarborCard",
    },
    renewsAt: "2027-06-11",
    status: "active",
  },
  {
    tenantId: "t-cascade",
    stripeCustomerRef: "cus_NxA7cascade03",
    plan: "starter",
    licensedPhysicians: 8,
    annualLicenseUsd: 12_000,
    managedServicesMonthlyUsd: 3_000,
    onboardingOneTimeUsd: 3_500,
    passThroughMode: "itemised",
    currency: "USD",
    billingEmail: "billing@cascadevalley.example",
    paymentMethod: {
      kind: "card",
      last4: "1009",
      brand: "Mastercard",
      expMonth: 4,
      expYear: 2027,
      stripeRef: "pm_1QhCascadeCard",
    },
    renewsAt: "2027-09-21",
    status: "trialing",
  },
  {
    tenantId: "t-stillwater",
    stripeCustomerRef: "cus_NxA7stillwater04",
    plan: "enterprise",
    licensedPhysicians: 213,
    annualLicenseUsd: 148_300,
    managedServicesMonthlyUsd: 3_000,
    onboardingOneTimeUsd: 20_000,
    passThroughMode: "itemised",
    currency: "USD",
    billingEmail: "accountspayable@stillwaterhealth.example",
    paymentMethod: { kind: "invoice-net30", stripeRef: "pm_1QhStillwaterInv" },
    renewsAt: "2027-05-18",
    status: "past-due",
  },
];

export const invoices: Invoice[] = [
  {
    id: "inv-2026-10",
    tenantId: PROVIDER_TENANT,
    stripeInvoiceRef: "in_1QhOct26Northside",
    number: "NXA-2026-0417",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
    issuedAt: "2026-10-01T06:00:00Z",
    dueAt: "2026-10-31T23:59:00Z",
    status: "open",
    subtotalUsd: 6_132.4,
    taxUsd: 0,
    totalUsd: 6_132.4,
    lines: [
      { id: "ln-1", kind: "license", description: "Growth annual license — monthly instalment, 24 physicians", quantity: 1, unitPriceUsd: 2_400, amountUsd: 2_400 },
      { id: "ln-2", kind: "managed-services", description: "Managed services and cloud — flat monthly", quantity: 1, unitPriceUsd: 3_000, amountUsd: 3_000 },
      { id: "ln-3", kind: "pass-through", description: "Electronic transactions (270/271, 278, PAS)", quantity: 1_260, unit: "transaction", unitPriceUsd: 0.14, amountUsd: 176.4, usageKind: "electronic-transaction" },
      { id: "ln-4", kind: "pass-through", description: "Payer portal automation sessions", quantity: 184, unit: "session", unitPriceUsd: 0.45, amountUsd: 82.8, usageKind: "portal-session" },
      { id: "ln-5", kind: "pass-through", description: "Outbound voice minutes", quantity: 612, unit: "minute", unitPriceUsd: 0.62, amountUsd: 379.44, usageKind: "voice-minute" },
      { id: "ln-6", kind: "pass-through", description: "Model usage — extraction and drafting", quantity: 18.4, unit: "M tokens", unitPriceUsd: 4.5, amountUsd: 82.8, usageKind: "model-tokens" },
      { id: "ln-7", kind: "pass-through", description: "Fax pages (last-resort channel)", quantity: 44, unit: "page", unitPriceUsd: 0.25, amountUsd: 11, usageKind: "fax-page" },
    ],
  },
  {
    id: "inv-2026-09",
    tenantId: PROVIDER_TENANT,
    stripeInvoiceRef: "in_1QhSep26Northside",
    number: "NXA-2026-0388",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-30",
    issuedAt: "2026-09-01T06:00:00Z",
    dueAt: "2026-09-30T23:59:00Z",
    status: "paid",
    subtotalUsd: 6_041.9,
    taxUsd: 0,
    totalUsd: 6_041.9,
    lines: [
      { id: "ln-1", kind: "license", description: "Growth annual license — monthly instalment, 24 physicians", quantity: 1, unitPriceUsd: 2_400, amountUsd: 2_400 },
      { id: "ln-2", kind: "managed-services", description: "Managed services and cloud — flat monthly", quantity: 1, unitPriceUsd: 3_000, amountUsd: 3_000 },
      { id: "ln-3", kind: "pass-through", description: "Electronic transactions (270/271, 278, PAS)", quantity: 1_141, unit: "transaction", unitPriceUsd: 0.14, amountUsd: 159.74, usageKind: "electronic-transaction" },
      { id: "ln-4", kind: "pass-through", description: "Payer portal automation sessions", quantity: 203, unit: "session", unitPriceUsd: 0.45, amountUsd: 91.35, usageKind: "portal-session" },
      { id: "ln-5", kind: "pass-through", description: "Outbound voice minutes", quantity: 639, unit: "minute", unitPriceUsd: 0.62, amountUsd: 396.18, usageKind: "voice-minute" },
    ],
  },
  {
    id: "inv-2026-03-onb",
    tenantId: PROVIDER_TENANT,
    stripeInvoiceRef: "in_1QhMar26NorthsideOnb",
    number: "NXA-2026-0012",
    periodStart: "2026-03-02",
    periodEnd: "2026-03-02",
    issuedAt: "2026-03-02T06:00:00Z",
    dueAt: "2026-04-01T23:59:00Z",
    status: "paid",
    subtotalUsd: 9_900,
    taxUsd: 0,
    totalUsd: 9_900,
    lines: [
      { id: "ln-1", kind: "onboarding", description: "Onboarding — Growth tier (1 EHR, 3 payer routes, 2 portals)", quantity: 1, unitPriceUsd: 7_500, amountUsd: 7_500 },
      { id: "ln-2", kind: "integration", description: "Net-new integration — Epic write-back profile", quantity: 48, unit: "hour", unitPriceUsd: 50, amountUsd: 2_400 },
    ],
  },
];

/**
 * A sample of the metered consumption behind this month's pass-through
 * lines. Each row names the case that caused it — the waterfall priced
 * honestly, cheapest channel first.
 */
export const usageRecords: UsageRecord[] = [
  { id: "usg-001", tenantId: PROVIDER_TENANT, kind: "electronic-transaction", quantity: 3, unit: "transaction", unitCostUsd: 0.14, requestId: "req-1047", recordedAt: "2026-09-28T14:02:00Z" },
  { id: "usg-002", tenantId: PROVIDER_TENANT, kind: "model-tokens", quantity: 0.042, unit: "M tokens", unitCostUsd: 4.5, requestId: "req-1047", recordedAt: "2026-09-28T14:03:00Z" },
  { id: "usg-003", tenantId: PROVIDER_TENANT, kind: "portal-session", quantity: 1, unit: "session", unitCostUsd: 0.45, requestId: "req-1061", recordedAt: "2026-09-11T10:22:00Z" },
  { id: "usg-004", tenantId: PROVIDER_TENANT, kind: "voice-minute", quantity: 22.3, unit: "minute", unitCostUsd: 0.62, requestId: "req-1061", recordedAt: "2026-09-11T10:48:00Z" },
  { id: "usg-005", tenantId: PROVIDER_TENANT, kind: "electronic-transaction", quantity: 2, unit: "transaction", unitCostUsd: 0.14, requestId: "req-1052", recordedAt: "2026-09-30T09:15:00Z" },
  { id: "usg-006", tenantId: PROVIDER_TENANT, kind: "voice-minute", quantity: 18.9, unit: "minute", unitCostUsd: 0.62, requestId: "req-1042", recordedAt: "2026-09-01T16:40:00Z" },
  { id: "usg-007", tenantId: PROVIDER_TENANT, kind: "fax-page", quantity: 6, unit: "page", unitCostUsd: 0.25, requestId: "req-1042", recordedAt: "2026-09-01T17:05:00Z" },
  { id: "usg-008", tenantId: PROVIDER_TENANT, kind: "electronic-transaction", quantity: 2, unit: "transaction", unitCostUsd: 0.14, requestId: "req-1063", recordedAt: "2026-09-30T12:31:00Z" },
];

/** What each tier costs, for the plan comparison on the billing screen. */
export const planCatalog = [
  { plan: "starter" as const, physicians: "up to 10", annualLicenseUsd: 15_000, onboardingUsd: 3_500, perPhysicianMonthlyUsd: 125 },
  { plan: "growth" as const, physicians: "11–40", annualLicenseUsd: 28_800, onboardingUsd: 7_500, perPhysicianMonthlyUsd: 100 },
  { plan: "scale" as const, physicians: "41–100", annualLicenseUsd: 58_560, onboardingUsd: 12_000, perPhysicianMonthlyUsd: 80 },
  { plan: "enterprise" as const, physicians: "100+", annualLicenseUsd: 148_300, onboardingUsd: 20_000, perPhysicianMonthlyUsd: 58 },
];
