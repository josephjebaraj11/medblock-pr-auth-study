/* ---------------------------------------------------------------------------
   Multi-tenancy, users and roles — all fabricated.
   A tenant is a provider organisation with its own connections, payer
   contracts, policy pack, case queue and agent memory. Nothing crosses.
   --------------------------------------------------------------------------- */

export const PERM = {
  VIEW: "case.view",
  WORK: "case.work",
  SUBMIT: "packet.approveSubmit",
  SIGN_APPEAL: "appeal.sign",
  ANSWER_CLINICAL: "questionnaire.answerClinical",
  MANAGE: "tenant.manage",
  AUDIT: "audit.view",
  REGISTRY: "platform.registry",
  OPS: "platform.operate",
};

export const ROLES = {
  coordinator: {
    id: "coordinator", label: "Pre-auth coordinator", tone: "acc",
    perms: [PERM.VIEW, PERM.WORK, PERM.SUBMIT],
    can: "Works the queue and approves packets for submission.",
    cannot: "Cannot sign an appeal — that is a clinical assertion over a clinician's name.",
  },
  clinician: {
    id: "clinician", label: "Clinician", tone: "hum",
    perms: [PERM.VIEW, PERM.WORK, PERM.SUBMIT, PERM.SIGN_APPEAL, PERM.ANSWER_CLINICAL],
    can: "Everything a coordinator can, plus answering clinical questionnaire items and signing appeals.",
    cannot: "Cannot manage connections or tenant configuration.",
  },
  admin: {
    id: "admin", label: "Platform administrator", tone: "ag",
    perms: [PERM.VIEW, PERM.MANAGE, PERM.AUDIT],
    can: "Manages connections, policy packs, thresholds and users. Reads the full audit log.",
    cannot: "Cannot approve a submission. Separation of duties, deliberately — the person who configures the thresholds is not the person who clears the packet.",
  },
  observer: {
    id: "observer", label: "Observer (read-only)", tone: "f",
    perms: [PERM.VIEW, PERM.AUDIT],
    can: "Reads cases and the audit trail.",
    cannot: "Cannot work a case, approve, or change anything.",
  },
  operator: {
    id: "operator", label: "Platform operator (vendor)", tone: "ag",
    perms: [PERM.REGISTRY, PERM.OPS],
    can: "Runs the platform itself: the connector registry, connection health across every tenant, pull-run telemetry and endpoint discovery drift.",
    cannot: "Cannot open a case, a patient or any clinical content in any tenant. The operator role carries no case.view permission at all — it is not a filtered view of PHI, it is an absence of the permission.",
  },
};

export const can = (user, perm) => !!user && ROLES[user.role].perms.includes(perm);

export const TENANTS = [
  {
    id: "springfield",
    name: "Springfield Health Partners",
    short: "Springfield",
    initials: "SH",
    type: "Integrated delivery network",
    blurb:
      "Four hospitals and 60 ambulatory sites on Epic. The reference tenant — every connector enabled, and the highest case volume.",
    ehr: "Epic",
    caseIds: ["PA-2026-0418", "PA-2026-0431", "PA-2026-0458", "PA-2026-0461", "PA-2026-0463"],
    patientIds: ["pt-1", "pt-4", "pt-5"],
    payerIds: ["pay-meridian", "pay-northstar", "pay-cascade"],
    sources: [
      { name: "Springfield Orthopaedic Group", vendor: "Epic", proto: "FHIR R4 · SMART Backend Services", state: "live", since: "2025-11-04" },
      { name: "Springfield Radiology", vendor: "Epic", proto: "FHIR R4 · ImagingStudy", state: "live", since: "2025-11-04" },
      { name: "Cedar Ridge Rehab", vendor: "WebPT", proto: "HL7 v2 MDM over MLLP", state: "live", since: "2026-01-19" },
      { name: "Pharmacy benefit", vendor: "NCPDP feed", proto: "NCPDP claims", state: "live", since: "2025-12-02" },
      { name: "Meridian Reference Laboratory", vendor: "Lab network", proto: "FHIR R4 Observation", state: "live", since: "2026-02-11" },
    ],
    flags: { networkExchange: true, portalAutomation: true, ocrIngestion: true, autoSubmit: false },
    memory: { cases: 4820, policies: 61, firstPass: 0.86, note: "20 months of determinations. The richest agent memory of the three." },
    seats: 14,
  },
  {
    id: "lakeside",
    name: "Lakeside Specialty Care",
    short: "Lakeside",
    initials: "LS",
    type: "Multi-specialty physician group",
    blurb:
      "Rheumatology, GI and oncology on athenahealth. Heavy medical-benefit drug volume, which is where the pends live.",
    ehr: "athenahealth",
    caseIds: ["PA-2026-0447", "PA-2026-0452", "PA-2026-0459", "PA-2026-0389", "PA-2026-0464"],
    patientIds: ["pt-2", "pt-6", "pt-7"],
    payerIds: ["pay-northstar", "pay-meridian"],
    sources: [
      { name: "Lakeside Rheumatology", vendor: "athenahealth", proto: "FHIR R4 · SMART", state: "live", since: "2026-03-22" },
      { name: "Lakeside Infusion Center", vendor: "athenahealth", proto: "FHIR R4", state: "live", since: "2026-03-22" },
      { name: "Meridian Reference Laboratory", vendor: "Lab network", proto: "FHIR R4 Observation", state: "live", since: "2026-04-02" },
      { name: "Pharmacy benefit", vendor: "NCPDP feed", proto: "NCPDP claims", state: "live", since: "2026-03-30" },
      { name: "Regional HIE", vendor: "QHIN", proto: "TEFCA exchange", state: "live", since: "2026-05-14" },
    ],
    flags: { networkExchange: true, portalAutomation: false, ocrIngestion: true, autoSubmit: false },
    memory: { cases: 1140, policies: 38, firstPass: 0.71, note: "Newer tenant. Specialty drugs pend more often, so first-pass rate is structurally lower." },
    seats: 6,
  },
  {
    id: "cascadevalley",
    name: "Cascade Valley Spine Institute",
    short: "Cascade Valley",
    initials: "CV",
    type: "Single-specialty surgical group",
    blurb:
      "One surgical specialty on Oracle Health, contracting mostly with a legacy payer. The hardest tenant to serve, and the most common shape in the market.",
    ehr: "Oracle Health",
    caseIds: ["PA-2026-0455", "PA-2026-0460", "PA-2026-0402", "PA-2026-0465", "PA-2026-0466"],
    patientIds: ["pt-3", "pt-8"],
    payerIds: ["pay-cascade", "pay-meridian"],
    sources: [
      { name: "Cascade Valley Spine Institute", vendor: "Oracle Health", proto: "FHIR R4 · SMART", state: "live", since: "2026-06-08" },
      { name: "Cascade Valley Imaging", vendor: "Oracle Health", proto: "FHIR R4 · DiagnosticReport", state: "live", since: "2026-06-08" },
      { name: "Cascade Valley Rehab", vendor: "Raintree", proto: "HL7 v2, normalised", state: "live", since: "2026-07-01" },
      { name: "Cascade Valley Health Coaching", vendor: "Custom", proto: "FHIR R4 · limited scope", state: "degraded", since: "2026-07-19" },
      { name: "Regional HIE", vendor: "QHIN", proto: "TEFCA exchange", state: "not connected", since: null },
    ],
    flags: { networkExchange: false, portalAutomation: true, ocrIngestion: true, autoSubmit: false },
    memory: { cases: 310, policies: 12, firstPass: 0.58, note: "Three months of history. Not enough memory yet to raise first-pass materially — worth being honest about in a pilot." },
    seats: 4,
  },
];

/* The vendor's own organisation. Not a provider tenant: it has no patients, no
   cases and no payer contracts, and the role that lives here holds no case.view
   permission. It exists to make the three-tier admin model real — a platform
   operator who runs the connectors for everybody and can see none of their PHI. */
export const PLATFORM_ORG = {
  id: "platform",
  kind: "platform",
  name: "Relay Health AI — platform operations",
  short: "Platform ops",
  initials: "RH",
  type: "Vendor · platform operator",
  blurb:
    "The organisation that builds and runs the clinical data platform underneath all three tenants. Sees the connector registry and connection health across every tenant, and no clinical content in any of them.",
  ehr: "n/a",
  caseIds: [],
  patientIds: [],
  payerIds: [],
  sources: [],
  flags: { networkExchange: false, portalAutomation: false, ocrIngestion: false, autoSubmit: false },
  memory: { cases: 0, policies: 0, firstPass: 0, note: "Agent memory belongs to a tenant. The platform operator has none and must never aggregate any." },
  seats: 3,
};

export const ORGS = [...TENANTS, PLATFORM_ORG];

export const USERS = [
  // Springfield
  { id: "u-mbeki", tenantId: "springfield", name: "Kofi Mbeki", role: "coordinator", title: "Senior pre-auth coordinator", initials: "KM", email: "k.mbeki@springfieldhp.example" },
  { id: "u-halvorsen", tenantId: "springfield", name: "Dr. Sigrid Halvorsen", role: "clinician", title: "Orthopaedic surgeon", initials: "SH", email: "s.halvorsen@springfieldhp.example", npi: "1234567890 (fabricated)" },
  { id: "u-whitfield", tenantId: "springfield", name: "Alma Reyes-Whitfield", role: "admin", title: "Director, revenue cycle systems", initials: "AR", email: "a.reyes@springfieldhp.example" },
  { id: "u-oyelaran", tenantId: "springfield", name: "Grace Oyelaran", role: "observer", title: "VP operations", initials: "GO", email: "g.oyelaran@springfieldhp.example" },
  // Lakeside
  { id: "u-osei", tenantId: "lakeside", name: "Rina Osei", role: "coordinator", title: "Pharmacy technician, prior auth", initials: "RO", email: "r.osei@lakesidesc.example" },
  { id: "u-ferreira", tenantId: "lakeside", name: "Dr. Camille Ferreira", role: "clinician", title: "Rheumatologist", initials: "CF", email: "c.ferreira@lakesidesc.example", npi: "2345678901 (fabricated)" },
  { id: "u-puri", tenantId: "lakeside", name: "Devendra Puri", role: "admin", title: "Practice systems manager", initials: "DP", email: "d.puri@lakesidesc.example" },
  // Cascade Valley
  { id: "u-nowicki", tenantId: "cascadevalley", name: "Marta Nowicki", role: "coordinator", title: "Surgical scheduler", initials: "MN", email: "m.nowicki@cascadevalley.example" },
  { id: "u-abbasi", tenantId: "cascadevalley", name: "Dr. Noor Abbasi", role: "clinician", title: "Spine surgeon", initials: "NA", email: "n.abbasi@cascadevalley.example", npi: "3456789012 (fabricated)" },
  { id: "u-brenner", tenantId: "cascadevalley", name: "Ivo Brenner", role: "admin", title: "Practice administrator", initials: "IB", email: "i.brenner@cascadevalley.example" },
  // Platform operations — the vendor, not a customer
  { id: "u-okonkwo", tenantId: "platform", name: "Tunde Okonkwo", role: "operator", title: "Platform reliability engineer", initials: "TO", email: "t.okonkwo@relayhealth.example" },
  { id: "u-lindqvist", tenantId: "platform", name: "Vera Lindqvist", role: "operator", title: "Head of integrations", initials: "VL", email: "v.lindqvist@relayhealth.example" },
];

/* Which tenant owns each scripted scenario. Switching tenant changes the queue,
   which is the point — a case belonging to another tenant is not merely hidden
   from the list, it is not reachable at all. */
export const SCENARIO_TENANT = {
  approved: "springfield",
  pended: "lakeside",
  denied: "cascadevalley",
};

export const EXTRA_CASES = [
  { id:"PA-2026-0463", patientId:"pt-4", payerId:"pay-meridian", policyId:null,
    service:{ code:"CPT 42826", desc:"Tonsillectomy, age 12 or over", icd:"J35.1" },
    ordering:"Dr. Priya Raghunathan, MD", status:"review", priority:"Standard",
    created:"2026-09-28T16:12", updated:"2026-09-29T07:55", sla:"2026-10-05T16:12", confidence:0.87,
    owner:"K. Mbeki (coordinator)",
    note:"Follows the sleep study. Packet assembled and waiting on a human; the sleep study result is attached as the supporting evidence." },
  { id:"PA-2026-0464", patientId:"pt-7", payerId:"pay-northstar", policyId:null,
    service:{ code:"CPT 45378", desc:"Colonoscopy, diagnostic", icd:"K50.10" },
    ordering:"Dr. Camille Ferreira, MD", status:"approved", priority:"Standard",
    created:"2026-09-20T09:41", updated:"2026-09-21T11:02", sla:null, confidence:0.92,
    owner:"R. Osei (pharmacy tech)", authNo:"NBA-AUTH-33780",
    note:"Surveillance colonoscopy for known Crohn's. Straightforward; approved inside a day." },
  { id:"PA-2026-0465", patientId:"pt-8", payerId:"pay-cascade", policyId:null,
    service:{ code:"CPT 93458", desc:"Left heart catheterisation with coronary angiography", icd:"I25.10" },
    ordering:"Dr. Marisol Vance, MD", status:"submitted", priority:"Expedited",
    created:"2026-09-27T07:30", updated:"2026-09-28T14:18", sla:"2026-10-02T07:30", confidence:0.83,
    owner:"M. Nowicki (scheduler)",
    note:"Follows the CT angiography request. Submitted through the portal; status checked by scripted login twice daily." },
  { id:"PA-2026-0466", patientId:"pt-3", payerId:"pay-cascade", policyId:null,
    service:{ code:"HCPCS E0143", desc:"Walker, folding, wheeled", icd:"M48.061" },
    ordering:"Dr. Noor Abbasi, MD", status:"draft", priority:"Standard",
    created:"2026-09-29T10:44", updated:"2026-09-29T10:44", sla:"2026-10-13T10:44", confidence:null,
    owner:"Unassigned",
    note:"Low-value DME request. Included because a real queue is mostly small items, not the interesting ones." },
];
