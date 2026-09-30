import payers from "./payers.json";
import policies from "./policies.json";
import patients from "./patients.json";
import clinical from "./clinical.json";
import STATUS from "./STATUS.json";
import baseCases from "./cases.json";
import agents from "./agents.json";
import arch from "./arch.json";
import lanes from "./lanes.json";
import flow from "./flow.json";
import journey from "./journey.json";
import integrations from "./integrations.json";
import core from "./core.json";
import buildplan from "./buildplan.json";
import ops from "./ops.json";
import scenarios from "./scenarios.json";
import { TENANTS, ORGS, PLATFORM_ORG, USERS, ROLES, PERM, can, SCENARIO_TENANT, EXTRA_CASES } from "./tenants.js";

const cases = [...baseCases, ...EXTRA_CASES];

/* Attach the owning tenant to every case, so scoping is a property of the data
   rather than something each screen has to remember to apply. */
const tenantOfCase = {};
TENANTS.forEach((t) => t.caseIds.forEach((id) => (tenantOfCase[id] = t.id)));
cases.forEach((c) => (c.tenantId = tenantOfCase[c.id] || "springfield"));

const by = (arr, k = "id") => Object.fromEntries(arr.map((x) => [x[k], x]));

export const DB = {
  payers, policies, patients, clinical, STATUS, cases, agents, arch, lanes,
  flow, journey, integrations, scenarios, core, buildplan, ops,
  /* tenants is provider organisations only — the vendor's own org is not a
     customer and must not appear where a tenant is expected. orgs is both. */
  tenants: TENANTS, orgs: ORGS, platformOrg: PLATFORM_ORG, users: USERS,
  evById: by(clinical), ptById: by(patients), payById: by(payers),
  polById: by(policies), caseById: by(cases), tenantById: by(ORGS), userById: by(USERS),
  coreById: by(core.comps),
};

export { ROLES, PERM, can, SCENARIO_TENANT, TENANTS, ORGS, PLATFORM_ORG, USERS };

export const isPlatformOrg = (t) => t?.kind === "platform";

/* --- tenant-scoped selectors: every screen reads through these --- */
export const casesFor = (tenantId) => DB.cases.filter((c) => c.tenantId === tenantId);
export const usersFor = (tenantId) => DB.users.filter((u) => u.tenantId === tenantId);
export const payersFor = (tenantId) =>
  (DB.tenantById[tenantId]?.payerIds || []).map((id) => DB.payById[id]).filter(Boolean);
export const patientsFor = (tenantId) =>
  (DB.tenantById[tenantId]?.patientIds || []).map((id) => DB.ptById[id]).filter(Boolean);
export const scenariosFor = (tenantId) =>
  Object.keys(DB.scenarios).filter((k) => SCENARIO_TENANT[k] === tenantId);
export const tenantOfScenario = (k) => DB.tenantById[SCENARIO_TENANT[k]];

export const pct = (n) => Math.round(n * 100) + "%";
export const confTone = (n) => (n >= 0.85 ? "ok" : n >= 0.65 ? "warn" : "bad");
