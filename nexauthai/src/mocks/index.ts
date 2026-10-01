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

import type {
  AIAssessment,
  Appeal,
  AuditEvent,
  ClinicalDocument,
  Communication,
  ConnectorInstance,
  Decision,
  Notification,
  PeerToPeer,
  PolicyConfig,
  PriorAuthRequest,
  QuestionnaireResponse,
  Task,
  User,
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
import { auditEvents, notifications, policyConfig, tasks } from "./workflow";
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
  connectorInstances: ConnectorInstance[];
  policy: PolicyConfig;
  users: User[];
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
  connectorInstances: structuredClone(connectorInstances),
  policy: structuredClone(policyConfig),
  users: structuredClone(users),
};
