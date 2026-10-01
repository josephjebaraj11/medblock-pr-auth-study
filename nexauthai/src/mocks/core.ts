/**
 * Synthetic organisations, payers, plans, providers, patients and coverages.
 *
 * ALL DATA HERE IS INVENTED. No real patient, provider, member ID, MRN or NPI
 * appears in this file, and none ever should. NPIs are formatted plausibly but
 * are not allocated numbers; payer IDs are fictional.
 *
 * The shape of the data follows the source material's pilot scope: one
 * provider tenant (a multi-specialty practice), five payers spanning the
 * regulatory categories that matter under CMS-0057-F, and an imaging-heavy
 * CPT mix built around lumbar-spine MRI (72148) — the client's own worked
 * example.
 */

import type {
  Coverage,
  Organization,
  Patient,
  Payer,
  PayerPlan,
  Provider,
  Tenant,
} from "@/types";

export const PROVIDER_TENANT = "t-northside";
export const PAYER_TENANT = "t-meridian";

export const tenants: Tenant[] = [
  {
    id: PROVIDER_TENANT,
    name: "Northside Orthopaedic & Spine",
    kind: "provider",
    tier: "growth",
    deploymentMode: "multi-tenant",
    region: "us-east-1",
    status: "active",
    createdAt: "2026-03-02T09:00:00Z",
  },
  {
    id: PAYER_TENANT,
    name: "Meridian Health Plan",
    kind: "payer",
    tier: "enterprise",
    deploymentMode: "dedicated",
    region: "us-east-1",
    status: "active",
    createdAt: "2026-05-18T09:00:00Z",
  },
  {
    id: "t-cascade",
    name: "Cascade Valley Rehab",
    kind: "provider",
    tier: "starter",
    deploymentMode: "multi-tenant",
    region: "us-west-2",
    status: "onboarding",
    createdAt: "2026-09-21T09:00:00Z",
  },
  {
    id: "t-harbor",
    name: "Harbor Point Imaging",
    kind: "provider",
    tier: "scale",
    deploymentMode: "multi-tenant",
    region: "us-east-1",
    status: "active",
    createdAt: "2026-06-11T09:00:00Z",
  },
];

export const organizations: Organization[] = [
  {
    id: "org-northside",
    tenantId: PROVIDER_TENANT,
    name: "Northside Orthopaedic & Spine",
    npi: "1538294017",
    taxId: "84-2910473",
    type: "practice",
    address: {
      line1: "4120 Rivermont Parkway",
      line2: "Suite 300",
      city: "Columbus",
      state: "OH",
      postalCode: "43215",
    },
    phone: "(614) 555-0142",
  },
  {
    id: "org-northside-imaging",
    tenantId: PROVIDER_TENANT,
    name: "Northside Imaging Center",
    npi: "1740382956",
    taxId: "84-2910473",
    type: "imaging-center",
    address: {
      line1: "4120 Rivermont Parkway",
      line2: "Suite 110",
      city: "Columbus",
      state: "OH",
      postalCode: "43215",
    },
    phone: "(614) 555-0188",
  },
];

/* ------------------------------------------------------------------ *
 * Payers
 *
 * Capability mix is deliberately uneven, because that is the real 2026
 * picture the research describes: a few payers live on the full Da Vinci
 * stack, most on X12 and portals, some portal-only.
 * ------------------------------------------------------------------ */

export const payers: Payer[] = [
  {
    id: "pay-meridian",
    name: "Meridian Health Plan",
    payerIdX12: "MRDN1",
    regulatoryCategory: "medicare-advantage",
    cms0057Impacted: true,
    capabilities: {
      crd: true,
      dtr: true,
      pas: true,
      cdex: true,
      x12_278: true,
      portal: true,
      fax: false,
      igVersion: "2.2.1",
    },
    automatedCallerPermitted: true,
    portalUrl: "https://provider.meridianhealth.example",
    phone: "(800) 555-0101",
    logoInitials: "MH",
    accent: "brand",
  },
  {
    id: "pay-atlas",
    name: "Atlas Mutual",
    payerIdX12: "ATLS9",
    regulatoryCategory: "commercial",
    cms0057Impacted: false,
    capabilities: {
      crd: false,
      dtr: false,
      pas: false,
      cdex: false,
      x12_278: true,
      portal: true,
      fax: true,
    },
    automatedCallerPermitted: false,
    portalUrl: "https://providers.atlasmutual.example",
    phone: "(800) 555-0177",
    logoInitials: "AM",
    accent: "signal",
  },
  {
    id: "pay-granite",
    name: "Granite State Blue",
    payerIdX12: "GSB44",
    regulatoryCategory: "qhp-ffe",
    cms0057Impacted: true,
    capabilities: {
      crd: true,
      dtr: false,
      pas: true,
      cdex: false,
      x12_278: true,
      portal: true,
      fax: true,
      igVersion: "2.0.1",
    },
    automatedCallerPermitted: true,
    portalUrl: "https://portal.granitestateblue.example",
    phone: "(800) 555-0133",
    logoInitials: "GB",
    accent: "aqua",
  },
  {
    id: "pay-caldera",
    name: "Caldera Medicaid Partners",
    payerIdX12: "CLDR7",
    regulatoryCategory: "medicaid-managed-care",
    cms0057Impacted: true,
    capabilities: {
      crd: false,
      dtr: false,
      pas: false,
      cdex: false,
      x12_278: true,
      portal: true,
      fax: true,
    },
    automatedCallerPermitted: true,
    portalUrl: "https://calderamp.example/providers",
    phone: "(800) 555-0166",
    logoInitials: "CM",
    accent: "accent",
  },
  {
    id: "pay-pinnacle",
    name: "Pinnacle Choice",
    payerIdX12: "PNCL3",
    regulatoryCategory: "commercial",
    cms0057Impacted: false,
    capabilities: {
      crd: false,
      dtr: false,
      pas: false,
      cdex: false,
      x12_278: false,
      portal: true,
      fax: true,
    },
    automatedCallerPermitted: false,
    phone: "(800) 555-0199",
    logoInitials: "PC",
    accent: "ink",
  },
];

export const payerPlans: PayerPlan[] = [
  { id: "plan-mh-adv", payerId: "pay-meridian", name: "Meridian Advantage Complete", productLine: "Medicare Advantage", groupNumber: "MA-44812" },
  { id: "plan-mh-ppo", payerId: "pay-meridian", name: "Meridian Select PPO", productLine: "PPO", groupNumber: "SE-20194" },
  { id: "plan-atlas-ppo", payerId: "pay-atlas", name: "Atlas Premier PPO", productLine: "PPO", groupNumber: "AP-77301" },
  { id: "plan-atlas-hmo", payerId: "pay-atlas", name: "Atlas Essential HMO", productLine: "HMO", groupNumber: "AE-77455" },
  { id: "plan-granite-silver", payerId: "pay-granite", name: "Granite Silver 2600", productLine: "EPO", groupNumber: "GS-10288" },
  { id: "plan-caldera-mcd", payerId: "pay-caldera", name: "Caldera Managed Medicaid", productLine: "Medicaid", groupNumber: "CM-00931" },
  { id: "plan-pinnacle-pos", payerId: "pay-pinnacle", name: "Pinnacle Choice POS", productLine: "POS", groupNumber: "PP-51200" },
];

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

export const providers: Provider[] = [
  { id: "prv-okafor", tenantId: PROVIDER_TENANT, organizationId: "org-northside", firstName: "Adaeze", lastName: "Okafor", credential: "MD", npi: "1629384756", specialty: "Orthopaedic Surgery", isLicensedReviewer: true },
  { id: "prv-lindqvist", tenantId: PROVIDER_TENANT, organizationId: "org-northside", firstName: "Nils", lastName: "Lindqvist", credential: "MD", npi: "1738495867", specialty: "Physical Medicine & Rehabilitation", isLicensedReviewer: true },
  { id: "prv-rahman", tenantId: PROVIDER_TENANT, organizationId: "org-northside", firstName: "Yusra", lastName: "Rahman", credential: "DO", npi: "1847506978", specialty: "Pain Management", isLicensedReviewer: true },
  { id: "prv-castellanos", tenantId: PROVIDER_TENANT, organizationId: "org-northside", firstName: "Mateo", lastName: "Castellanos", credential: "NP", npi: "1956617089", specialty: "Orthopaedics", isLicensedReviewer: false },
  { id: "prv-whitfield", tenantId: PROVIDER_TENANT, organizationId: "org-northside-imaging", firstName: "Greer", lastName: "Whitfield", credential: "MD", npi: "1065728190", specialty: "Diagnostic Radiology", isLicensedReviewer: true },
];

/* ------------------------------------------------------------------ *
 * Patients — 15, all synthetic
 * ------------------------------------------------------------------ */

const addr = (line1: string, city: string, state: string, postalCode: string) => ({
  line1,
  city,
  state,
  postalCode,
});

export const patients: Patient[] = [
  { id: "pat-001", tenantId: PROVIDER_TENANT, mrn: "NS-410228", firstName: "Owen", lastName: "Brooks", dateOfBirth: "1968-04-17", sex: "male", phone: "(614) 555-0231", email: "o.brooks@example.com", address: addr("812 Hawthorne Lane", "Columbus", "OH", "43206"), sourceIds: [{ system: "epic", value: "E1002284" }] },
  { id: "pat-002", tenantId: PROVIDER_TENANT, mrn: "NS-410229", firstName: "Sofia", lastName: "Marino", dateOfBirth: "1981-11-02", sex: "female", phone: "(614) 555-0244", email: "s.marino@example.com", address: addr("27 Kestrel Court", "Dublin", "OH", "43017"), sourceIds: [{ system: "epic", value: "E1002291" }] },
  { id: "pat-003", tenantId: PROVIDER_TENANT, mrn: "NS-410230", firstName: "Robert", lastName: "Hayes", dateOfBirth: "1955-02-28", sex: "male", phone: "(614) 555-0257", address: addr("1140 Sycamore Ridge", "Westerville", "OH", "43081"), sourceIds: [{ system: "epic", value: "E1002305" }] },
  { id: "pat-004", tenantId: PROVIDER_TENANT, mrn: "NS-410231", firstName: "Kwame", lastName: "Mensah", dateOfBirth: "1973-07-09", sex: "male", phone: "(614) 555-0263", email: "k.mensah@example.com", address: addr("559 Linden Mill Road", "Columbus", "OH", "43220"), sourceIds: [{ system: "cerner", value: "C880142" }] },
  { id: "pat-005", tenantId: PROVIDER_TENANT, mrn: "NS-410232", firstName: "Priya", lastName: "Venkatesan", dateOfBirth: "1990-09-23", sex: "female", phone: "(614) 555-0275", email: "p.venkatesan@example.com", address: addr("64 Alder Street", "Hilliard", "OH", "43026"), sourceIds: [{ system: "epic", value: "E1002318" }] },
  { id: "pat-006", tenantId: PROVIDER_TENANT, mrn: "NS-410233", firstName: "Eleanor", lastName: "Whitmore", dateOfBirth: "1947-12-14", sex: "female", phone: "(614) 555-0288", address: addr("3301 Beechwold Boulevard", "Columbus", "OH", "43214"), sourceIds: [{ system: "epic", value: "E1002326" }] },
  { id: "pat-007", tenantId: PROVIDER_TENANT, mrn: "NS-410234", firstName: "Darius", lastName: "Feldman", dateOfBirth: "1986-03-30", sex: "male", phone: "(614) 555-0291", email: "d.feldman@example.com", address: addr("918 Pinecrest Drive", "Gahanna", "OH", "43230"), sourceIds: [{ system: "athena", value: "A55710" }] },
  { id: "pat-008", tenantId: PROVIDER_TENANT, mrn: "NS-410235", firstName: "Imani", lastName: "Sowande", dateOfBirth: "1995-06-05", sex: "female", phone: "(614) 555-0304", email: "i.sowande@example.com", address: addr("76 Garnet Way", "Columbus", "OH", "43209"), sourceIds: [{ system: "epic", value: "E1002340" }] },
  { id: "pat-009", tenantId: PROVIDER_TENANT, mrn: "NS-410236", firstName: "Harold", lastName: "Petrakis", dateOfBirth: "1951-08-19", sex: "male", phone: "(614) 555-0317", address: addr("2204 Olentangy View", "Worthington", "OH", "43085"), sourceIds: [{ system: "cerner", value: "C880166" }] },
  { id: "pat-010", tenantId: PROVIDER_TENANT, mrn: "NS-410237", firstName: "Camille", lastName: "Dubois", dateOfBirth: "1978-01-11", sex: "female", phone: "(614) 555-0329", email: "c.dubois@example.com", address: addr("487 Marigold Crossing", "Powell", "OH", "43065"), sourceIds: [{ system: "epic", value: "E1002355" }] },
  { id: "pat-011", tenantId: PROVIDER_TENANT, mrn: "NS-410238", firstName: "Tobias", lastName: "Nkemdirim", dateOfBirth: "2001-05-27", sex: "male", phone: "(614) 555-0333", email: "t.nkem@example.com", address: addr("15 Quarry Bend", "Columbus", "OH", "43215"), sourceIds: [{ system: "athena", value: "A55742" }] },
  { id: "pat-012", tenantId: PROVIDER_TENANT, mrn: "NS-410239", firstName: "Marguerite", lastName: "Oyelaran", dateOfBirth: "1963-10-08", sex: "female", phone: "(614) 555-0346", address: addr("1902 Fieldstone Pass", "Reynoldsburg", "OH", "43068"), sourceIds: [{ system: "epic", value: "E1002369" }] },
  { id: "pat-013", tenantId: PROVIDER_TENANT, mrn: "NS-410240", firstName: "Stefan", lastName: "Varga", dateOfBirth: "1984-02-16", sex: "male", phone: "(614) 555-0358", email: "s.varga@example.com", address: addr("630 Copperleaf Terrace", "Grove City", "OH", "43123"), sourceIds: [{ system: "cerner", value: "C880183" }] },
  { id: "pat-014", tenantId: PROVIDER_TENANT, mrn: "NS-410241", firstName: "Lucia", lastName: "Ferreira", dateOfBirth: "1992-12-01", sex: "female", phone: "(614) 555-0362", email: "l.ferreira@example.com", address: addr("244 Birchmont Avenue", "Upper Arlington", "OH", "43221"), sourceIds: [{ system: "epic", value: "E1002381" }] },
  { id: "pat-015", tenantId: PROVIDER_TENANT, mrn: "NS-410242", firstName: "Augustine", lastName: "Baptiste", dateOfBirth: "1959-04-03", sex: "male", phone: "(614) 555-0375", address: addr("1077 Thornbury Lane", "Columbus", "OH", "43232"), sourceIds: [{ system: "athena", value: "A55768" }] },
];

/* ------------------------------------------------------------------ *
 * Coverage
 * ------------------------------------------------------------------ */

const cov = (
  id: string,
  patientId: string,
  payerId: string,
  planId: string,
  memberId: string,
  status: Coverage["status"] = "active",
  periodEnd?: string,
): Coverage => ({
  id,
  tenantId: PROVIDER_TENANT,
  patientId,
  payerId,
  planId,
  memberId,
  relationship: "self",
  status,
  periodStart: "2026-01-01",
  periodEnd,
  verifiedAt: "2026-09-30T14:12:00Z",
  verificationRef: `271-${id.toUpperCase()}`,
  order: 1,
});

export const coverages: Coverage[] = [
  cov("cvg-001", "pat-001", "pay-meridian", "plan-mh-ppo", "MRD884102731"),
  cov("cvg-002", "pat-002", "pay-meridian", "plan-mh-ppo", "MRD884102844"),
  cov("cvg-003", "pat-003", "pay-atlas", "plan-atlas-ppo", "ATL5590113", "terminated", "2026-08-31"),
  cov("cvg-004", "pat-004", "pay-granite", "plan-granite-silver", "GSB7741028"),
  cov("cvg-005", "pat-005", "pay-atlas", "plan-atlas-hmo", "ATL5590288"),
  cov("cvg-006", "pat-006", "pay-meridian", "plan-mh-adv", "MRD884103019"),
  cov("cvg-007", "pat-007", "pay-pinnacle", "plan-pinnacle-pos", "PNC3310477"),
  cov("cvg-008", "pat-008", "pay-caldera", "plan-caldera-mcd", "CLD1180293"),
  cov("cvg-009", "pat-009", "pay-meridian", "plan-mh-adv", "MRD884103155"),
  cov("cvg-010", "pat-010", "pay-granite", "plan-granite-silver", "GSB7741390"),
  cov("cvg-011", "pat-011", "pay-caldera", "plan-caldera-mcd", "CLD1180411"),
  cov("cvg-012", "pat-012", "pay-atlas", "plan-atlas-ppo", "ATL5590501"),
  cov("cvg-013", "pat-013", "pay-pinnacle", "plan-pinnacle-pos", "PNC3310622"),
  cov("cvg-014", "pat-014", "pay-meridian", "plan-mh-ppo", "MRD884103277"),
  cov("cvg-015", "pat-015", "pay-granite", "plan-granite-silver", "GSB7741488"),
];
