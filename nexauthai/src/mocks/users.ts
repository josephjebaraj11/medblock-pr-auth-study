/**
 * The three personas, and the demo users behind them.
 *
 * There is no real authentication here. Picking a persona on the sign-in
 * screen swaps the active user; the app then renders from that user's
 * scopes, the same way the production app renders from Keycloak token
 * scopes. One portal, three personas, every tenant — nothing about the
 * application changes between them except what the token grants.
 *
 * `canMakeClinicalDetermination` is the field that enforces the source
 * material's most-repeated rule. Exactly one persona carries it, and the UI
 * uses it to decide whether to offer a clinical control at all.
 */

import type { Role, User } from "@/types";
import { PROVIDER_TENANT } from "./core";

export const roles: Role[] = [
  {
    id: "staff-operations",
    label: "Staff / Operations",
    side: "operations",
    description:
      "The practice's queue workers — billing and front desk combined. Places authorization requests, works the exception queue, releases held submissions, answers payer information requests and chases expiring approvals.",
    sees: "Status, submissions, document follow-up, administrative exceptions.",
    scopes: [
      "request:read",
      "request:create",
      "request:submit",
      "request:approve-submission",
      "queue:work",
      "policy:read",
    ],
    landingPath: "/ops",
    canMakeClinicalDetermination: false,
  },
  {
    id: "clinical-reviewer",
    label: "Clinical Reviewer",
    side: "clinical",
    description:
      "A licensed clinician. Everything that is a medical judgement arrives here and nowhere else: evidence gaps, denials, appeals and peer-to-peer reviews. Kept a distinct persona on purpose, so only licensed people make — and are audited for — medical calls.",
    sees: "Medical-necessity gaps, denials, appeals, peer-to-peer.",
    scopes: [
      "request:read",
      "clinical:attest",
      "clinical:decide",
      "appeal:approve",
      "appeal:file",
      "p2p:schedule",
      "queue:work",
      "policy:read",
    ],
    landingPath: "/clinical",
    canMakeClinicalDetermination: true,
  },
  {
    id: "admin",
    label: "Admin",
    side: "admin",
    description:
      "Users and roles, automation rules and thresholds, payer matrix, connections, billing and the audit log. A tenant admin manages one practice; a platform admin manages every tenant and the shared connector registry from the same screens. Neither holds a PHI scope.",
    sees: "Tenants, users, rules, connections, billing, audit — never clinical detail.",
    // Deliberately no `request:read`. Admin is configuration and oversight;
    // the case contents are not an admin concern on either reach.
    scopes: [
      "policy:read",
      "policy:write",
      "connector:read",
      "connector:write",
      "user:manage",
      "audit:read",
      "tenant:manage",
      "billing:manage",
      "platform:admin",
    ],
    landingPath: "/admin",
    canMakeClinicalDetermination: false,
  },
];

export const users: User[] = [
  {
    id: "usr-dana",
    tenantId: PROVIDER_TENANT,
    name: "Dana Whitaker",
    email: "d.whitaker@northside.example",
    roleIds: ["staff-operations"],
    title: "Prior Authorization Coordinator",
    initials: "DW",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T13:40:00Z",
    status: "active",
  },
  {
    id: "usr-okafor",
    tenantId: PROVIDER_TENANT,
    name: "Dr. Adaeze Okafor",
    email: "a.okafor@northside.example",
    roleIds: ["clinical-reviewer"],
    providerId: "prv-okafor",
    title: "Orthopaedic Surgeon · Clinical Reviewer",
    initials: "AO",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T12:05:00Z",
    status: "active",
  },
  {
    id: "usr-admin",
    tenantId: PROVIDER_TENANT,
    name: "Priyanka Raghunathan",
    email: "p.raghunathan@nexauth.example",
    roleIds: ["admin"],
    adminScope: "platform",
    title: "Platform Operations Lead",
    initials: "PR",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T14:10:00Z",
    status: "active",
  },

  // Additional directory entries, shown on the admin Users screen.
  {
    id: "usr-castellanos",
    tenantId: PROVIDER_TENANT,
    name: "Mateo Castellanos, NP",
    email: "m.castellanos@northside.example",
    roleIds: ["clinical-reviewer"],
    providerId: "prv-castellanos",
    title: "Nurse Practitioner",
    initials: "MC",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T09:48:00Z",
    status: "active",
  },
  {
    id: "usr-lindqvist",
    tenantId: PROVIDER_TENANT,
    name: "Dr. Nils Lindqvist",
    email: "n.lindqvist@northside.example",
    roleIds: ["clinical-reviewer"],
    providerId: "prv-lindqvist",
    title: "PM&R Physician",
    initials: "NL",
    mfaEnrolled: true,
    lastActiveAt: "2026-09-30T16:30:00Z",
    status: "active",
  },
  {
    id: "usr-tennant",
    tenantId: PROVIDER_TENANT,
    name: "Rosalind Tennant",
    email: "r.tennant@northside.example",
    roleIds: ["staff-operations"],
    title: "Front Desk Lead",
    initials: "RT",
    mfaEnrolled: false,
    lastActiveAt: "2026-09-29T11:15:00Z",
    status: "invited",
  },
  {
    // One person, two personas. A solo or lean practice does this routinely,
    // and the portal renders the union of their scopes.
    id: "usr-bellweather",
    tenantId: PROVIDER_TENANT,
    name: "Georgia Bellweather",
    email: "g.bellweather@northside.example",
    roleIds: ["staff-operations", "admin"],
    adminScope: "tenant",
    title: "Practice Manager",
    initials: "GB",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T11:02:00Z",
    status: "active",
  },
  {
    id: "usr-vance",
    tenantId: "t-harbor",
    name: "Oluwafemi Vance",
    email: "o.vance@harborpoint.example",
    roleIds: ["admin"],
    adminScope: "tenant",
    title: "Revenue Cycle Director",
    initials: "OV",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T08:14:00Z",
    status: "active",
  },
  {
    id: "usr-amara",
    tenantId: "t-cascade",
    name: "Amara Deshpande",
    email: "a.deshpande@cascadevalley.example",
    roleIds: ["staff-operations"],
    title: "Authorization Specialist",
    initials: "AD",
    mfaEnrolled: true,
    lastActiveAt: "2026-09-30T15:41:00Z",
    status: "active",
  },
];

/** Users offered on the sign-in screen, one per persona, in switcher order. */
export const demoUserByRole: Record<string, string> = {
  "staff-operations": "usr-dana",
  "clinical-reviewer": "usr-okafor",
  admin: "usr-admin",
};
