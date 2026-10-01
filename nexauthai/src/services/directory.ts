/**
 * Read-only reference data: patients, coverage, payers, providers, policies.
 */

import {
  coverages,
  organizations,
  patients,
  payerCriteria,
  payerPlans,
  payers,
  providers,
  questionnaires,
  tenants,
} from "@/mocks";
import type { Coverage, Patient, Payer, PayerCriteria, Provider } from "@/types";
import { simulate, snapshot } from "./http";

export const directoryService = {
  async listPatients(query?: string): Promise<Patient[]> {
    return simulate(() => {
      if (!query) return snapshot(patients);
      const q = query.toLowerCase();
      return snapshot(
        patients.filter(
          (p) =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
            p.mrn.toLowerCase().includes(q) ||
            p.dateOfBirth.includes(q),
        ),
      );
    }, 120, 320);
  },

  async getPatient(id: string): Promise<Patient | undefined> {
    return simulate(() => snapshot(patients.find((p) => p.id === id)), 90, 220);
  },

  async coverageForPatient(patientId: string): Promise<Coverage[]> {
    return simulate(
      () => snapshot(coverages.filter((c) => c.patientId === patientId)),
      140,
      360,
    );
  },

  async listPayers(): Promise<Payer[]> {
    return simulate(() => snapshot(payers), 80, 200);
  },

  async listProviders(): Promise<Provider[]> {
    return simulate(() => snapshot(providers), 80, 200);
  },

  /** Policy matching: payer + service code, honouring the effective window. */
  async findCriteria(payerId: string, serviceCodes: string[]): Promise<PayerCriteria | undefined> {
    return simulate(
      () =>
        snapshot(
          payerCriteria.find(
            (c) =>
              c.payerId === payerId &&
              serviceCodes.some((code) => c.serviceCodes.includes(code)),
          ),
        ),
      200,
      500,
    );
  },

  async listCriteria(): Promise<PayerCriteria[]> {
    return simulate(() => snapshot(payerCriteria), 120, 300);
  },

  async getQuestionnaireFor(criteriaId: string) {
    return simulate(
      () => snapshot(questionnaires.find((q) => q.criteriaId === criteriaId)),
      260,
      620,
    );
  },

  /** Synchronous lookups for render-time joins, where a round trip is wrong. */
  sync: {
    patient: (id: string) => patients.find((p) => p.id === id),
    payer: (id: string) => payers.find((p) => p.id === id),
    plan: (id: string) => payerPlans.find((p) => p.id === id),
    coverage: (id: string) => coverages.find((c) => c.id === id),
    provider: (id: string) => providers.find((p) => p.id === id),
    organization: (id: string) => organizations.find((o) => o.id === id),
    tenant: (id: string) => tenants.find((t) => t.id === id),
    criteria: (id: string) => payerCriteria.find((c) => c.id === id),
    patientName: (id: string) => {
      const p = patients.find((x) => x.id === id);
      return p ? `${p.firstName} ${p.lastName}` : "Unknown patient";
    },
    providerName: (id: string) => {
      const p = providers.find((x) => x.id === id);
      return p ? `Dr. ${p.firstName} ${p.lastName}`.replace("Dr. ", p.credential === "MD" || p.credential === "DO" ? "Dr. " : "") : "Unknown";
    },
  },
};
