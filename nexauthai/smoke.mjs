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

/* ============ Provider / clinic staff ============ */
await pickRole("Provider / Clinic Staff");
await visit("/provider", "Pending with payers", "provider-dashboard");
await visit("/provider/requests", "Requests", "provider-requests");
await visit("/provider/worklist", "Worklist", "provider-worklist");
await visit("/provider/requests/req-1047", "NA-1047", "provider-case-1047");

// Tabs on the case page
for (const tab of ["AI assist", "Documents", "Channels", "Messages", "Audit"]) {
  await page.getByRole("tab", { name: tab }).click();
  await page.waitForTimeout(500);
  const body = await page.locator("body").innerText();
  note(`case-tab-${tab.replace(/\s+/g, "-")}`, body.length > 400);
}

// J6 — resupply a requested document on the pended case
await page.goto(BASE + "/provider/requests/req-1052", { waitUntil: "networkidle" });
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
await page.goto(BASE + "/provider/requests/req-1044", { waitUntil: "networkidle" });
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
await page.goto(BASE + "/provider/requests/req-1065", { waitUntil: "networkidle" });
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
await page.goto(BASE + "/provider/new", { waitUntil: "networkidle" });
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
await page.goto(BASE + "/provider/new", { waitUntil: "networkidle" });
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

/* ============ Ordering physician ============ */
await pickRole("Ordering Physician");
await visit("/physician", "My orders", "physician-orders");
await visit("/physician/review", "Clinical review", "physician-review");

// J3 — attest on NA-1047
await page.goto(BASE + "/physician/orders/req-1047", { waitUntil: "networkidle" });
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
await page.goto(BASE + "/physician/orders/req-1048", { waitUntil: "networkidle" });
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

/* ============ Payer intake ============ */
await pickRole("Payer Intake Reviewer");
await visit("/payer/queue", "Intake queue", "payer-queue");
const triage = page.getByRole("button", { name: /^Triage$/i });
if (await triage.count()) {
  await triage.first().click();
  await page.waitForTimeout(2500);
  note("payer-triage", true);
} else {
  note("payer-triage", false, "no triage button");
}

/* ============ Payer clinical ============ */
await pickRole("Payer Clinical Reviewer");
await visit("/payer/clinical", "Clinical review", "payer-clinical");
body = await page.locator("body").innerText();
const caseMatch = body.match(/NA-\d+/);
if (caseMatch) {
  await page.getByRole("link", { name: caseMatch[0] }).first().click();
  await page.waitForTimeout(1800);
  const b = await page.locator("body").innerText();
  note("payer-case-detail", b.includes("Issue determination"), caseMatch[0]);
  if (SHOT) await page.screenshot({ path: `${SHOT}/payer-determination.png`, fullPage: true });

  // Record an approval
  await page.getByLabel(/Rationale/i).fill("Criteria met on the submitted documentation.");
  await page.waitForTimeout(300);
  const rec = page.getByRole("button", { name: /Record determination/i });
  if (await rec.count()) {
    await rec.click();
    await page.waitForTimeout(3000);
    note("payer-approve", !/error/i.test(await page.locator("body").innerText()));
  } else note("payer-approve", false, "no record button");
} else {
  note("payer-case-detail", false, "no case in queue");
}

/* ============ Patient ============ */
await pickRole("Patient");
await visit("/patient", "My authorizations", "patient-portal");

/* ============ Admin ============ */
await pickRole("Platform Admin");
await visit("/admin", "Platform overview", "admin-overview");
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
await visit("/admin/audit", "Audit log", "admin-audit");
body = await page.locator("body").innerText();
note("audit-chain-intact", /Hash chain intact/i.test(body));

await visit("/notifications", "What needs you", "notifications");

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
