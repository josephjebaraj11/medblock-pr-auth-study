/**
 * Roles and demo users for the role switcher.
 *
 * There is no real authentication here. Picking a role on the login screen
 * swaps the active user; the app then renders from that user's scopes, the
 * same way the production app would render from Keycloak token scopes.
 *
 * `canMakeClinicalDetermination` is the field that enforces the folder's
 * most-repeated rule. Only two roles carry it, and the UI uses it to decide
 * whether to even offer a deny control.
 */

import type { Role, User } from "@/types";
import { PAYER_TENANT, PROVIDER_TENANT } from "./core";

export const roles: Role[] = [
  {
    id: "provider-staff",
    label: "Provider / Clinic Staff",
    side: "provider",
    description:
      "Creates prior-auth requests, attaches clinical documents, tracks status and responds to payer requests for information.",
    scopes: [
      "request:read",
      "request:create",
      "request:submit",
      "request:approve-submission",
      "queue:work",
      "policy:read",
    ],
    landingPath: "/provider",
    canMakeClinicalDetermination: false,
  },
  {
    id: "ordering-physician",
    label: "Ordering Physician",
    side: "provider",
    description:
      "Reviews AI-drafted medical-necessity justifications, signs off on submissions, and handles peer-to-peer reviews.",
    scopes: [
      "request:read:own",
      "request:create",
      "clinical:attest",
      "appeal:approve",
      "p2p:schedule",
      "policy:read",
    ],
    landingPath: "/physician",
    canMakeClinicalDetermination: false,
  },
  {
    id: "payer-intake",
    label: "Payer Intake Reviewer",
    side: "payer",
    description:
      "Works the intake queue, checks each submission for completeness, and triages to the right clinical reviewer.",
    scopes: ["request:read", "queue:work", "queue:assign", "policy:read"],
    landingPath: "/payer/queue",
    canMakeClinicalDetermination: false,
  },
  {
    id: "payer-clinical",
    label: "Payer Clinical Reviewer",
    side: "payer",
    description:
      "Licensed medical director. Reviews the AI criteria match and approves, denies or partially approves with reasons.",
    scopes: [
      "request:read",
      "queue:work",
      "clinical:decide",
      "appeal:approve",
      "p2p:schedule",
      "policy:read",
    ],
    landingPath: "/payer/clinical",
    canMakeClinicalDetermination: true,
  },
  {
    id: "patient",
    label: "Patient",
    side: "patient",
    description:
      "Read-only view of their own authorization status and timeline. Mirrors what the CMS Patient Access API must expose from 2027.",
    scopes: ["patient:read:self"],
    landingPath: "/patient",
    canMakeClinicalDetermination: false,
  },
  {
    id: "platform-admin",
    label: "Platform Admin",
    side: "platform",
    description:
      "Manages payers, connectors, field mappings, rules, users and the audit log. Never sees clinical detail.",
    // Deliberately no `request:read`. The Vision & Scope is explicit that the
    // platform operator sees cross-tenant health and configuration, never PHI.
    scopes: [
      "policy:read",
      "policy:write",
      "connector:read",
      "connector:write",
      "user:manage",
      "audit:read",
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
    roleIds: ["provider-staff"],
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
    roleIds: ["ordering-physician"],
    providerId: "prv-okafor",
    title: "Orthopaedic Surgeon",
    initials: "AO",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T12:05:00Z",
    status: "active",
  },
  {
    id: "usr-reyes",
    tenantId: PAYER_TENANT,
    name: "Marcus Reyes",
    email: "m.reyes@meridianhealth.example",
    roleIds: ["payer-intake"],
    payerId: "pay-meridian",
    title: "Utilization Management Intake Specialist",
    initials: "MR",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T13:55:00Z",
    status: "active",
  },
  {
    id: "usr-halvorsen",
    tenantId: PAYER_TENANT,
    name: "Dr. Ingrid Halvorsen",
    email: "i.halvorsen@meridianhealth.example",
    roleIds: ["payer-clinical"],
    payerId: "pay-meridian",
    title: "Associate Medical Director",
    initials: "IH",
    mfaEnrolled: true,
    lastActiveAt: "2026-10-01T13:20:00Z",
    status: "active",
  },
  {
    id: "usr-brooks",
    tenantId: PROVIDER_TENANT,
    name: "Owen Brooks",
    email: "o.brooks@example.com",
    roleIds: ["patient"],
    patientId: "pat-001",
    title: "Patient",
    initials: "OB",
    mfaEnrolled: false,
    lastActiveAt: "2026-09-30T18:02:00Z",
    status: "active",
  },
  {
    id: "usr-admin",
    tenantId: PROVIDER_TENANT,
    name: "Priyanka Raghunathan",
    email: "p.raghunathan@nexauth.example",
    roleIds: ["platform-admin"],
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
    roleIds: ["ordering-physician"],
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
    roleIds: ["ordering-physician"],
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
    roleIds: ["provider-staff"],
    title: "Front Desk Lead",
    initials: "RT",
    mfaEnrolled: false,
    lastActiveAt: "2026-09-29T11:15:00Z",
    status: "invited",
  },
  {
    id: "usr-abara",
    tenantId: PAYER_TENANT,
    name: "Dr. Chidi Abara",
    email: "c.abara@meridianhealth.example",
    roleIds: ["payer-clinical"],
    payerId: "pay-meridian",
    title: "Medical Director",
    initials: "CA",
    mfaEnrolled: true,
    lastActiveAt: "2026-09-30T17:22:00Z",
    status: "active",
  },
];

/** Users offered on the login screen, one per role, in switcher order. */
export const demoUserByRole: Record<string, string> = {
  "provider-staff": "usr-dana",
  "ordering-physician": "usr-okafor",
  "payer-intake": "usr-reyes",
  "payer-clinical": "usr-halvorsen",
  patient: "usr-brooks",
  "platform-admin": "usr-admin",
};
