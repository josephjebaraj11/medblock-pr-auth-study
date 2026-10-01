/**
 * Mock data barrel, plus the in-memory store the service layer mutates.
 *
 * Everything here is synthetic. The store is deliberately mutable so the
 * prototype's actions (submit, approve, deny, file an appeal) have somewhere
 * to land and the UI reflects them — a page refresh resets the demo.
 */

export * from "./core";
export * from "./users";
export * from "./criteria";
export * from "./connectors";
export * from "./documents";
export * from "./requests";
export * from "./assessments";
export * from "./workflow";
export * from "./billing";

import type {
  AIAssessment,
  Appeal,
  AuditEvent,
  ClinicalDocument,
  Communication,
  BillingAccount,
  ConnectorInstance,
  Decision,
  Invoice,
  Notification,
  NotificationPreference,
  PeerToPeer,
  PolicyConfig,
  PriorAuthRequest,
  QuestionnaireResponse,
  Task,
  User,
  WebPushSubscription,
} from "@/types";

import { connectorInstances } from "./connectors";
import { clinicalDocuments } from "./documents";
import { priorAuthRequests } from "./requests";
import {
  aiAssessments,
  appeals,
  communications,
  decisions,
  peerToPeers,
  questionnaireResponses,
} from "./assessments";
import {
  auditEvents,
  notificationPreferences,
  notifications,
  policyConfig,
  tasks,
  webPushSubscriptions,
} from "./workflow";
import { billingAccounts, invoices } from "./billing";
import { users } from "./users";

/**
 * Mutable session state. Seeded from the fixtures above on first import, and
 * never persisted — reloading the page starts the demo over.
 */
export interface Store {
  requests: PriorAuthRequest[];
  documents: ClinicalDocument[];
  assessments: AIAssessment[];
  decisions: Decision[];
  appeals: Appeal[];
  peerToPeers: PeerToPeer[];
  communications: Communication[];
  questionnaireResponses: QuestionnaireResponse[];
  tasks: Task[];
  audit: AuditEvent[];
  notifications: Notification[];
  notificationPreferences: NotificationPreference[];
  webPush: WebPushSubscription[];
  connectorInstances: ConnectorInstance[];
  policy: PolicyConfig;
  users: User[];
  billing: BillingAccount[];
  invoices: Invoice[];
}

export const store: Store = {
  requests: structuredClone(priorAuthRequests),
  documents: structuredClone(clinicalDocuments),
  assessments: structuredClone(aiAssessments),
  decisions: structuredClone(decisions),
  appeals: structuredClone(appeals),
  peerToPeers: structuredClone(peerToPeers),
  communications: structuredClone(communications),
  questionnaireResponses: structuredClone(questionnaireResponses),
  tasks: structuredClone(tasks),
  audit: structuredClone(auditEvents),
  notifications: structuredClone(notifications),
  notificationPreferences: structuredClone(notificationPreferences),
  webPush: structuredClone(webPushSubscriptions),
  connectorInstances: structuredClone(connectorInstances),
  policy: structuredClone(policyConfig),
  users: structuredClone(users),
  billing: structuredClone(billingAccounts),
  invoices: structuredClone(invoices),
};
