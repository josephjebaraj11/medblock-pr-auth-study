import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const SHOT = process.env.SHOT_DIR;
const errors = [];
const results = [];

function note(label, ok, detail = "") {
  results.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? " — " + detail : ""}`);
}

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[console] ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

async function pickRole(label) {
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  // Clear any persisted role first.
  await page.evaluate(() => localStorage.removeItem("nexauthai.session.role"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: new RegExp(label, "i") }).first().click();
  await page.waitForLoadState("networkidle");
}

async function visit(path, expectText, label) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const body = await page.locator("body").innerText();
  const ok = body.includes(expectText);
  note(label, ok, ok ? "" : `expected "${expectText}"`);
  if (SHOT) await page.screenshot({ path: `${SHOT}/${label.replace(/[^a-z0-9]+/gi, "-")}.png` });
  return body;
}

/* ============ Staff / Operations ============ */
await pickRole("Staff / Operations");
await visit("/ops", "Pending with payers", "ops-dashboard");
await visit("/ops/requests", "Requests", "ops-requests");
await visit("/ops/worklist", "Worklist", "ops-worklist");
await visit("/ops/requests/req-1047", "NA-1047", "ops-case-1047");

// Tabs on the case page
for (const tab of ["AI assist", "Documents", "Channels", "Messages", "Audit"]) {
  await page.getByRole("tab", { name: tab }).click();
  await page.waitForTimeout(500);
  const body = await page.locator("body").innerText();
  note(`case-tab-${tab.replace(/\s+/g, "-")}`, body.length > 400);
}

// J6 — resupply a requested document on the pended case
await page.goto(BASE + "/ops/requests/req-1052", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const resupply = page.getByRole("button", { name: /Resupply requested document/i });
if (await resupply.count()) {
  await resupply.click();
  await page.waitForTimeout(2200);
  const body = await page.locator("body").innerText();
  note("J6-rfi-resupply", /resupplied|resumed/i.test(body));
} else {
  note("J6-rfi-resupply", false, "button not found");
}

// J8 — extension on the expiring approval
await page.goto(BASE + "/ops/requests/req-1044", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const extend = page.getByRole("button", { name: /Request date extension/i });
if (await extend.count()) {
  await extend.click();
  await page.waitForTimeout(2000);
  note("J8-extension", /Extension granted/i.test(await page.locator("body").innerText()));
} else {
  note("J8-extension", false, "button not found");
}

// J4 — release a held submission
await page.goto(BASE + "/ops/requests/req-1065", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const release = page.getByRole("button", { name: /Release .* submit/i });
if (await release.count()) {
  await release.click();
  await page.waitForTimeout(9000);
  note("J4-release-held", /Released/i.test(await page.locator("body").innerText()));
} else {
  note("J4-release-held", false, "button not found");
}

/* ============ Wizard — J1 ============ */
await page.goto(BASE + "/ops/new", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Owen Brooks/i }).first().click();
await page.waitForTimeout(1200);
note("wizard-step2-coverage", (await page.locator("body").innerText()).includes("Coverage and eligibility"));

await page.getByRole("button", { name: /Run eligibility check/i }).click();
await page.waitForTimeout(3500);
note("wizard-eligibility", /Coverage active/i.test(await page.locator("body").innerText()));

await page.getByRole("button", { name: /^Continue$/i }).click();
await page.waitForTimeout(800);
note("wizard-step3-service", (await page.locator("body").innerText()).includes("Service and diagnosis"));

await page.getByRole("button", { name: /^Continue$/i }).click();
await page.waitForTimeout(800);
note("wizard-step4-required", (await page.locator("body").innerText()).includes("Does this need prior authorization"));

await page.getByRole("button", { name: /Check requirement/i }).click();
await page.waitForTimeout(5000);
let body = await page.locator("body").innerText();
note("wizard-crd-answer", /Prior authorization is required|No prior authorization required/i.test(body));

if (/Prior authorization is required/i.test(body)) {
  // Fill any unanswered required DTR fields
  const selects = await page.locator("select").all();
  for (const s of selects) {
    const v = await s.inputValue();
    if (!v) {
      const opts = await s.locator("option").all();
      if (opts.length > 1) await s.selectOption({ index: 1 });
    }
  }
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Continue$/i }).click();
  await page.waitForTimeout(900);
  note("wizard-step6-attachments", (await page.locator("body").innerText()).includes("Attachments"));

  await page.getByRole("button", { name: /Run AI assessment/i }).click();
  await page.waitForTimeout(5000);
  body = await page.locator("body").innerText();
  note("wizard-ai-assessment", /AI assist|Confidence/i.test(body));
  if (SHOT) await page.screenshot({ path: `${SHOT}/wizard-ai.png`, fullPage: true });

  const submitBtn = page.getByRole("button", { name: /Submit to payer/i });
  if (await submitBtn.count()) {
    await submitBtn.click();
    await page.waitForTimeout(7000);
    body = await page.locator("body").innerText();
    note("wizard-submitted", /Submitted|Held for release|No authorization required/i.test(body));
    if (SHOT) await page.screenshot({ path: `${SHOT}/wizard-outcome.png`, fullPage: true });
  } else {
    note("wizard-submitted", false, "submit button missing");
  }
}

/* ============ J10 — duplicate prevention ============ */
await page.goto(BASE + "/ops/new", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Sofia Marino/i }).first().click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Run eligibility check/i }).click();
await page.waitForTimeout(3500);
await page.getByRole("button", { name: /^Continue$/i }).click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: /^Continue$/i }).click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: /Check requirement/i }).click();
await page.waitForTimeout(5000);
{
  const selects = await page.locator("select").all();
  for (const s of selects) {
    const v = await s.inputValue();
    if (!v) {
      const opts = await s.locator("option").all();
      if (opts.length > 1) await s.selectOption({ index: 1 });
    }
  }
  const cont = page.getByRole("button", { name: /^Continue$/i });
  if (await cont.count()) {
    await cont.click();
    await page.waitForTimeout(900);
    const run = page.getByRole("button", { name: /Run AI assessment/i });
    if (await run.count()) {
      await run.click();
      await page.waitForTimeout(3500);
      note("J10-duplicate-blocked", /already exists|duplicate/i.test(await page.locator("body").innerText()));
    } else note("J10-duplicate-blocked", false, "no assessment button");
  } else note("J10-duplicate-blocked", false, "no continue");
}

/* ============ Scope gating — Operations must not reach admin ============ */
await page.goto(BASE + "/admin/tenants", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
note(
  "ops-blocked-from-admin",
  !(await page.locator("body").innerText()).includes("No PHI on this screen"),
  page.url(),
);
await visit("/portal", "One portal", "one-portal-ops");

/* ============ Clinical reviewer (licensed) ============ */
await pickRole("Clinical Reviewer");
await visit("/clinical", "Clinical review", "clinical-queue");
await visit("/clinical/cases", "Requests", "clinical-all-cases");

// J3 — attest on NA-1047
await page.goto(BASE + "/clinical/req-1047", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const attest = page.getByRole("button", { name: /Attest evidence/i });
if (await attest.count()) {
  await attest.click();
  await page.waitForTimeout(2500);
  note("J3-clinical-attest", /Attested/i.test(await page.locator("body").innerText()));
} else {
  note("J3-clinical-attest", false, "attest button not found");
}

// J7 — appeal a denied case
await page.goto(BASE + "/clinical/req-1048", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const appeal = page.getByRole("button", { name: /Approve .* file appeal/i });
if (await appeal.count()) {
  await appeal.click();
  await page.waitForTimeout(3000);
  note("J7-appeal-filed", /Appeal filed/i.test(await page.locator("body").innerText()));
  if (SHOT) await page.screenshot({ path: `${SHOT}/appeal-filed.png`, fullPage: true });
} else {
  note("J7-appeal-filed", false, "appeal button not found");
}

// Scope gating: the clinical persona must not reach admin or ops-create screens.
await page.goto(BASE + "/admin/billing", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
note(
  "clinical-blocked-from-billing",
  !(await page.locator("body").innerText()).includes("Annual license"),
  page.url(),
);

/* ============ One portal — reachable from every persona ============ */
await visit("/portal", "One portal", "one-portal-clinical");

/* ============ Admin (tenant + platform reach merged) ============ */
await pickRole("Admin");
await visit("/admin", "Overview", "admin-overview");
body = await page.locator("body").innerText();
note("admin-one-persona-two-reaches", /One admin persona, two reaches/i.test(body));

await visit("/admin/tenants", "Tenants", "admin-tenants");
body = await page.locator("body").innerText();
note("admin-tenants-multi", /Northside/i.test(body) && /Harbor Point/i.test(body));
note("admin-tenants-no-phi", /No PHI on this screen/i.test(body));
note("admin-tenants-realm", /nexauth-northside/i.test(body));

await visit("/admin/connectors", "Connectors", "admin-connectors");
await visit("/admin/connectors/ci-athena-prod", "athenahealth", "admin-connector-detail");

const test = page.getByRole("button", { name: /Test connection/i });
if (await test.count()) {
  await test.click();
  await page.waitForTimeout(3000);
  note("admin-test-connection", /Connection (healthy|failed)/i.test(await page.locator("body").innerText()));
}
const reconnect = page.getByRole("button", { name: /^Reconnect$/i });
if (await reconnect.count()) {
  await reconnect.click();
  await page.waitForTimeout(3000);
  note("admin-reconnect", true);
}

await visit("/admin/payers", "Automation policy", "admin-payers");
// Flip a trust mode
const wider = page.getByRole("button", { name: /^Wider autonomy$/i });
if (await wider.count()) {
  await wider.first().click();
  await page.waitForTimeout(2200);
  note("admin-trust-ramp", /policy version/i.test(await page.locator("body").innerText()));
}
// Kill switch
const kill = page.getByRole("button", { name: /Engage kill switch/i });
if (await kill.count()) {
  await kill.click();
  await page.waitForTimeout(2200);
  note("admin-kill-switch", /Kill switch engaged/i.test(await page.locator("body").innerText()));
  await page.getByRole("button", { name: /Release kill switch/i }).click();
  await page.waitForTimeout(2000);
}

await visit("/admin/users", "Users", "admin-users");
body = await page.locator("body").innerText();
note("admin-users-three-personas", /Staff \/ Operations/.test(body) && /Clinical Reviewer/.test(body) && /Admin/.test(body));
note("admin-users-dual-persona", /Georgia Bellweather/i.test(body));

/* ============ Billing / payment ============ */
await visit("/admin/billing", "Billing", "admin-billing");
body = await page.locator("body").innerText();
note("billing-plan", /Annual license/i.test(body) && /Managed services/i.test(body));
note("billing-not-per-pa", /not a price per authorization/i.test(body));

const invoiceToggle = page.getByRole("button", { expanded: false }).filter({ hasText: /NXA-2026/ });
if (await invoiceToggle.count()) {
  await invoiceToggle.first().click();
  await page.waitForTimeout(700);
  body = await page.locator("body").innerText();
  note("billing-invoice-lines", /Pass-through/i.test(body) && /voice minutes/i.test(body));
} else {
  note("billing-invoice-lines", false, "no invoice row");
}

const payBtn = page.getByRole("button", { name: /Pay now/i });
if (await payBtn.count()) {
  await payBtn.first().click();
  await page.waitForTimeout(2600);
  note("billing-pay-invoice", /Payment recorded/i.test(await page.locator("body").innerText()));
} else {
  note("billing-pay-invoice", false, "no pay button");
}

const foldIn = page.getByRole("button", { name: /Fold into flat fee/i });
if (await foldIn.count()) {
  await foldIn.click();
  await page.waitForTimeout(1600);
  note("billing-passthrough-mode", /folded into the flat monthly fee/i.test(await page.locator("body").innerText()));
} else {
  note("billing-passthrough-mode", false, "no mode button");
}

// Navigate client-side, not with page.goto — a full reload reseeds the
// in-memory store, and the point of this check is that the payment just made
// is in the ledger.
await page.getByRole("link", { name: /^Audit log$/ }).first().click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);
body = await page.locator("body").innerText();
note("admin-audit", body.includes("Audit log"));
note("audit-chain-intact", /Hash chain intact/i.test(body));
note("audit-records-billing", /invoice\.paid/i.test(body));
if (SHOT) await page.screenshot({ path: `${SHOT}/admin-audit.png`, fullPage: true });

/* ============ Notifications — email + web push ============ */
await visit("/notifications", "What needs you", "notifications");
body = await page.locator("body").innerText();
note("notif-channels", /Email/.test(body) && /Web push/.test(body));
note("notif-no-phi-rule", /No clinical detail travels in these/i.test(body));

const enablePush = page.getByRole("button", { name: /Enable web push/i });
if (await enablePush.count()) {
  await enablePush.click();
  await page.waitForTimeout(1800);
  note("notif-enable-web-push", /Turn off on this device/i.test(await page.locator("body").innerText()));
} else {
  // Already enabled for this user.
  note("notif-enable-web-push", /Turn off on this device/i.test(body));
}

const emailSwitch = page.getByRole("switch").first();
if (await emailSwitch.count()) {
  const before = await emailSwitch.getAttribute("aria-checked");
  await emailSwitch.click();
  await page.waitForTimeout(900);
  const after = await emailSwitch.getAttribute("aria-checked");
  note("notif-toggle-preference", before !== after, `${before} → ${after}`);
} else {
  note("notif-toggle-preference", false, "no switch");
}

/* ============ One portal, seen as Admin ============ */
await visit("/portal", "One portal", "one-portal-admin");
body = await page.locator("body").innerText();
note("one-portal-statement", /There is only one portal/i.test(body));
note("one-portal-multitenant", /Keycloak realm per tenant/i.test(body) && /row-level security/i.test(body));
note("one-portal-personas", /Three personas, one navigation/i.test(body));
note("one-portal-notifications", /Notifications leave the portal/i.test(body));
note("one-portal-billing", /Billing is per tenant/i.test(body));

/* ============ Responsive + dark ============ */
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/admin/connectors", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
note("mobile-no-horizontal-scroll", overflow <= 1, `overflow ${overflow}px`);
if (SHOT) await page.screenshot({ path: `${SHOT}/mobile-connectors.png` });

await page.evaluate(() => localStorage.setItem("nexauthai.theme", "dark"));
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(BASE + "/admin", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
note("dark-theme", bg !== "rgb(245, 248, 252)", bg);
if (SHOT) await page.screenshot({ path: `${SHOT}/dark-admin.png` });

/* ============ Summary ============ */
console.log("\n================ SUMMARY ================");
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("\nFAILURES:");
  for (const f of failed) console.log(` - ${f.label}${f.detail ? ": " + f.detail : ""}`);
}
console.log(`\nConsole/page errors: ${errors.length}`);
for (const e of [...new Set(errors)].slice(0, 25)) console.log(" ! " + e);

await browser.close();
process.exit(failed.length || errors.length ? 1 : 0);
