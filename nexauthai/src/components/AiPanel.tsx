/**
 * The AI assist panel.
 *
 * Four things, in the order a reviewer needs them: what the agent extracted
 * (with provenance), how the case scores against each criterion, what is
 * missing, and the drafted letter.
 *
 * What is deliberately absent is as important as what is here. There is no
 * "deny" action, no medical-necessity verdict, and no way to send the letter
 * without a human approving it. Every extracted fact names the document and
 * span it came from, so a reviewer checks the agent rather than trusting it.
 */

import clsx from "clsx";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileText,
  HelpCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  AssumptionNote,
  Badge,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  ConfidenceBar,
} from "./ui";
import { dateTime, percent } from "@/lib/format";
import type { AIAssessment, ClinicalDocument } from "@/types";

const RECOMMENDATION_COPY = {
  "ready-to-submit": {
    tone: "accent" as const,
    label: "Ready to submit",
    icon: <Check size={14} />,
  },
  "gather-more-documentation": {
    tone: "signal" as const,
    label: "Gather more documentation",
    icon: <FileText size={14} />,
  },
  "escalate-clinical-review": {
    tone: "signal" as const,
    label: "Escalate to clinical review",
    icon: <AlertTriangle size={14} />,
  },
};

const MATCH_STYLE = {
  met: { tone: "accent" as const, icon: <Check size={13} />, label: "Met" },
  "not-met": { tone: "danger" as const, icon: <X size={13} />, label: "Not met" },
  unclear: { tone: "signal" as const, icon: <HelpCircle size={13} />, label: "Unclear" },
};

export function AiPanel({
  assessment,
  documents,
  threshold,
  onApproveLetter,
  readOnly = false,
}: {
  assessment: AIAssessment;
  documents: ClinicalDocument[];
  threshold: number;
  onApproveLetter?: () => void;
  readOnly?: boolean;
}) {
  const [showComponents, setShowComponents] = useState(false);
  const [showLetter, setShowLetter] = useState(false);

  const rec = RECOMMENDATION_COPY[assessment.recommendation];
  const docTitle = (id: string) =>
    documents.find((d) => d.id === id)?.title ?? "Document no longer attached";

  return (
    <Card>
      <CardHeader
        icon={<Sparkles size={16} />}
        title="AI assist"
        description={`${assessment.modelVersion} · prompt ${assessment.promptVersion} · generated ${dateTime(assessment.generatedAt)}`}
        action={
          <Badge tone={rec.tone}>
            {rec.icon}
            {rec.label}
          </Badge>
        }
      />

      <CardBody className="space-y-5">
        {/* ---- Confidence ---- */}
        <section aria-labelledby="ai-confidence">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 id="ai-confidence" className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              Confidence
            </h3>
            <span className="text-sm tabular-nums text-content-secondary">
              <span className="text-lg font-semibold text-content">
                {assessment.confidence.overall.toFixed(2)}
              </span>
              <span className="ml-1.5 text-xs">threshold {threshold.toFixed(2)}</span>
            </span>
          </div>

          <ConfidenceBar value={assessment.confidence.overall} threshold={threshold} />

          <button
            type="button"
            onClick={() => setShowComponents((v) => !v)}
            aria-expanded={showComponents}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-content-brand hover:underline"
          >
            <ChevronDown
              size={13}
              className={clsx("transition-transform", showComponents && "rotate-180")}
              aria-hidden
            />
            {showComponents ? "Hide" : "Show"} how this score is made up
          </button>

          {showComponents && (
            <ul className="mt-3 space-y-2.5 rounded-lg bg-surface-inset p-3">
              {assessment.confidence.components.map((c) => (
                <li key={c.key}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-medium text-content">{c.label}</span>
                    <span className="shrink-0 tabular-nums text-content-muted">
                      {c.score.toFixed(2)} × {percent(c.weight)}
                    </span>
                  </div>
                  <ConfidenceBar value={c.score} className="mt-1" />
                  <p className="mt-1 text-xs leading-relaxed text-content-muted">{c.explanation}</p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-sm leading-relaxed text-content-secondary">
            {assessment.rationale}
          </p>
        </section>

        {/* ---- Extracted facts ---- */}
        {assessment.extractedFacts.length > 0 && (
          <section aria-labelledby="ai-facts">
            <h3
              id="ai-facts"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted"
            >
              Extracted clinical facts
            </h3>
            <ul className="divide-y divide-line-subtle rounded-lg border border-line">
              {assessment.extractedFacts.map((f) => (
                <li key={f.id} className="px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-content-muted">{f.label}</span>
                    <span className="font-mono text-[11px] tabular-nums text-content-muted">
                      {f.confidence.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-content">{f.value}</p>
                  <p className="mt-1 text-xs text-content-muted">
                    <FileText size={11} className="mr-1 inline" aria-hidden />
                    {docTitle(f.sourceDocumentId)} · {f.sourceSpan}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---- Criteria match ---- */}
        {assessment.criteriaMatches.length > 0 && (
          <section aria-labelledby="ai-criteria">
            <h3
              id="ai-criteria"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted"
            >
              Payer criteria match
            </h3>
            <ul className="space-y-2">
              {assessment.criteriaMatches.map((m) => {
                const style = MATCH_STYLE[m.status];
                return (
                  <li
                    key={m.criterionId}
                    className="rounded-lg border border-line px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-content">{m.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[11px] tabular-nums text-content-muted">
                          {m.confidence.toFixed(2)}
                        </span>
                        <Badge tone={style.tone}>
                          {style.icon}
                          {style.label}
                        </Badge>
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-content-secondary">{m.note}</p>
                    {m.evidence.length > 0 && (
                      <p className="mt-1.5 text-xs text-content-muted">
                        Evidence:{" "}
                        {m.evidence.map((e, i) => (
                          <span key={`${e.documentId}-${i}`}>
                            {i > 0 && "; "}
                            {docTitle(e.documentId)} · {e.span}
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ---- Missing items ---- */}
        {(assessment.missingDocuments.length > 0 || assessment.evidenceGaps.length > 0) && (
          <section aria-labelledby="ai-missing">
            <h3
              id="ai-missing"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted"
            >
              Missing documentation and evidence gaps
            </h3>
            <ul className="space-y-2">
              {[...assessment.missingDocuments, ...assessment.evidenceGaps].map((m) => (
                <li key={m.id}>
                  <Callout
                    tone={m.severity === "blocking" ? "signal" : "neutral"}
                    icon={<AlertTriangle size={14} />}
                    title={m.label}
                  >
                    <p className="text-xs leading-relaxed">{m.reason}</p>
                    <p className="mt-1 text-xs opacity-80">
                      {m.resolvableBy === "agent"
                        ? "The agent can retrieve this."
                        : m.resolvableBy === "staff"
                          ? "A staff member needs to supply this."
                          : "This needs a clinician's judgement."}
                    </p>
                  </Callout>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---- Drafted letter ---- */}
        {assessment.draftLetter && (
          <section aria-labelledby="ai-letter">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3
                id="ai-letter"
                className="text-xs font-semibold uppercase tracking-wide text-content-muted"
              >
                Drafted medical-necessity letter
              </h3>
              <button
                type="button"
                onClick={() => setShowLetter((v) => !v)}
                aria-expanded={showLetter}
                className="flex items-center gap-1 text-xs font-medium text-content-brand hover:underline"
              >
                <ChevronDown
                  size={13}
                  className={clsx("transition-transform", showLetter && "rotate-180")}
                  aria-hidden
                />
                {showLetter ? "Hide" : "Read"} draft
              </button>
            </div>

            {showLetter && (
              <div className="rounded-lg border border-line bg-surface-inset p-3">
                <p className="mb-2 text-sm font-semibold text-content">
                  {assessment.draftLetter.subject}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-content-secondary">
                  {assessment.draftLetter.body}
                </p>

                {assessment.draftLetter.approvedAt ? (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-tint-accent-on">
                    <Check size={13} aria-hidden />
                    Approved {dateTime(assessment.draftLetter.approvedAt)}
                  </p>
                ) : (
                  !readOnly &&
                  onApproveLetter && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="primary" onClick={onApproveLetter}>
                        Approve letter
                      </Button>
                      <span className="text-xs text-content-muted">
                        A drafted letter is never sent until a person approves it.
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        <AssumptionNote>
          The payer criteria matched here are invented for the prototype. The
          source material contains no real payer medical policy, so these are
          shaped to resemble a real imaging policy rather than reproduce one.
        </AssumptionNote>
      </CardBody>
    </Card>
  );
}
