/**
 * The new prior-authorization wizard.
 *
 * Eight steps, matching the order the real workflow runs in: patient →
 * coverage → service → is PA required → documentation questionnaire →
 * attachments → AI summary → submit.
 *
 * Two steps do something more interesting than collect input. Step 4 calls
 * the payer's CRD surface through a connector and can end the whole case
 * with an evidenced "no authorization required" — which is a real outcome,
 * recorded with its source and reference number, not a silent skip. Step 8
 * runs the submission waterfall and shows which channel resolved it.
 */

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiPanel } from "@/components/AiPanel";
import { ChannelBadge, PayerChip } from "@/components/case";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  ConfidenceBar,
  Field,
  LoadingBlock,
  PageHeader,
  inputClass,
} from "@/components/ui";
import { age, fullDate, latency } from "@/lib/format";
import { useSession } from "@/lib/session";
import { DIAGNOSIS_CATALOG, SERVICE_CATALOG, providers, store } from "@/mocks";
import type { ConnectorResult, RequirementResult } from "@/connectors/types";
import { directoryService } from "@/services/directory";
import { ApiError } from "@/services/http";
import { paService } from "@/services/paService";
import type {
  AIAssessment,
  Channel,
  ClinicalDocument,
  Coverage,
  Patient,
  PriorAuthRequest,
  Questionnaire,
  Urgency,
} from "@/types";

const STEPS = [
  "Patient",
  "Coverage",
  "Service",
  "PA required?",
  "Documentation",
  "Attachments",
  "AI summary",
  "Submit",
];

export default function NewRequest() {
  const { user } = useSession();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step state
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [eligibility, setEligibility] = useState<{
    active: boolean;
    planName: string;
    transactionRef: string;
    latencyMs: number;
  } | null>(null);

  const [serviceCode, setServiceCode] = useState("72148");
  const [diagnosisCode, setDiagnosisCode] = useState("M54.16");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [serviceDate, setServiceDate] = useState("2026-10-20");
  const [providerId, setProviderId] = useState("prv-okafor");

  const [requirement, setRequirement] = useState<RequirementResult | null>(null);
  const [requirementMeta, setRequirementMeta] = useState<ConnectorResult<RequirementResult>["meta"] | null>(null);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const [created, setCreated] = useState<PriorAuthRequest | null>(null);
  const [assessment, setAssessment] = useState<AIAssessment | null>(null);
  const [result, setResult] = useState<{ resolvedBy?: Channel; request: PriorAuthRequest } | null>(
    null,
  );

  /* ----------------------------- search ---------------------------- */

  useEffect(() => {
    let active = true;
    directoryService.listPatients(query).then((rows) => active && setPatients(rows));
    return () => {
      active = false;
    };
  }, [query]);

  /* ------------------------------ steps ---------------------------- */

  const pickPatient = async (p: Patient) => {
    setPatient(p);
    setBusy(true);
    const rows = await directoryService.coverageForPatient(p.id);
    setCoverages(rows);
    setCoverage(rows[0] ?? null);
    setBusy(false);
    setStep(1);
  };

  const runEligibility = async () => {
    if (!patient || !coverage) return;
    setBusy(true);
    setError(null);
    try {
      const res = await paService.checkEligibility(patient.id, coverage.id);
      if (res.ok && res.data) {
        setEligibility({
          active: res.data.active,
          planName: res.data.planName,
          transactionRef: res.data.transactionRef,
          latencyMs: res.meta.latencyMs,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Eligibility check failed.");
    } finally {
      setBusy(false);
    }
  };

  const runRequirementCheck = async () => {
    if (!coverage) return;
    setBusy(true);
    setError(null);
    try {
      const { result: res } = await paService.checkRequirement(
        coverage.payerId,
        [serviceCode],
        [diagnosisCode],
      );
      if (res.ok && res.data) {
        setRequirement(res.data);
        setRequirementMeta(res.meta);

        if (res.data.paRequired === true && res.data.questionnaireAvailable) {
          const q = await paService.getQuestionnaire(coverage.payerId, [serviceCode]);
          if (q) {
            setQuestionnaire(q);
            // DTR pre-population: structured fields fill themselves.
            const prefill: Record<string, string> = {};
            for (const item of q.items) {
              if (item.prepopulable) {
                prefill[item.linkId] =
                  item.type === "integer"
                    ? "11"
                    : item.type === "date"
                      ? "2026-08-16"
                      : item.linkId === "q8"
                        ? (directoryService.sync.provider(providerId)?.npi ?? "")
                        : "";
              }
            }
            setAnswers(prefill);
          }
        }

        const docs = await paService.fetchDocuments(
          patient!.id,
          (res.data.requiredDocuments ?? []).map((d) => d.type),
        );
        setDocuments(docs);
        setSelectedDocs(new Set(docs.map((d) => d.id)));
      }
      setStep(4);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Requirement check failed.");
    } finally {
      setBusy(false);
    }
  };

  const createAndAssess = async () => {
    if (!patient || !coverage) return;
    setBusy(true);
    setError(null);
    try {
      const req = await paService.create({
        patientId: patient.id,
        coverageId: coverage.id,
        payerId: coverage.payerId,
        orderingProviderId: providerId,
        serviceCodes: [serviceCode],
        diagnosisCodes: [{ code: diagnosisCode, display: DIAGNOSIS_CATALOG[diagnosisCode] }],
        urgency,
        scheduledServiceDate: serviceDate,
        documentIds: [...selectedDocs],
        paRequired: requirement?.paRequired,
        requirementRef: requirement?.referenceNumber,
        requirementSource: requirement?.source,
      });
      setCreated(req);

      if (requirement?.paRequired === false) {
        setStep(7);
        setResult({ request: req });
        return;
      }

      const a = await paService.generateAssessment(req.id);
      setAssessment(a);
      setStep(6);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open the case.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!created) return;
    setBusy(true);
    setError(null);
    try {
      const res = await paService.submit(created.id);
      setResult({ resolvedBy: res.resolvedBy, request: res.request });
      setStep(7);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------- rendering -------------------------- */

  const payer = coverage ? directoryService.sync.payer(coverage.payerId) : null;

  const requiredAnswered = useMemo(() => {
    if (!questionnaire) return true;
    return questionnaire.items
      .filter((i) => i.required)
      .every((i) => (answers[i.linkId] ?? "").toString().trim().length > 0);
  }, [questionnaire, answers]);

  return (
    <>
      <PageHeader
        eyebrow="Provider / clinic staff"
        title="New prior authorization"
        description="The agent runs each check as you go. Where it can answer electronically, it does."
      />

      {/* Step rail */}
      <ol className="mb-6 flex flex-wrap gap-1.5" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label}>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                i < step
                  ? "bg-tint-accent text-tint-accent-on"
                  : i === step
                    ? "bg-tint-brand text-tint-brand-on ring-1 ring-brand-400"
                    : "bg-surface-inset text-content-muted"
              }`}
            >
              {i < step ? <Check size={12} aria-hidden /> : <span className="tabular-nums">{i + 1}</span>}
              {label}
            </span>
          </li>
        ))}
      </ol>

      {error && (
        <Callout tone="danger" icon={<X size={15} />} title="That didn't work">
          {error}
        </Callout>
      )}

      {/* ---------------- Step 1 — patient ---------------- */}
      {step === 0 && (
        <Card>
          <CardHeader title="Find the patient" description="15 synthetic patients are loaded." />
          <CardBody>
            <label htmlFor="patient-search" className="sr-only">
              Search patients
            </label>
            <div className="relative mb-4">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
                aria-hidden
              />
              <input
                id="patient-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, MRN or date of birth"
                className={`${inputClass} pl-9`}
              />
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {patients.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pickPatient(p)}
                    className="w-full rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:border-brand-400 hover:bg-tint-brand/40"
                  >
                    <span className="block text-sm font-medium text-content">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="mt-0.5 block text-xs text-content-muted">
                      {p.mrn} · {age(p.dateOfBirth)} years · {fullDate(p.dateOfBirth)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* ---------------- Step 2 — coverage ---------------- */}
      {step === 1 && patient && (
        <Card>
          <CardHeader
            title="Coverage and eligibility"
            description="Real-time eligibility runs over X12 270/271 through the clearinghouse."
          />
          <CardBody className="space-y-4">
            <fieldset>
              <legend className="text-xs font-semibold text-content-secondary">
                Coverage on file
              </legend>
              <div className="mt-2 space-y-2">
                {coverages.map((c) => {
                  const p = directoryService.sync.payer(c.payerId);
                  const plan = directoryService.sync.plan(c.planId);
                  return (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                        coverage?.id === c.id
                          ? "border-brand-500 bg-tint-brand"
                          : "border-line hover:bg-surface-inset"
                      }`}
                    >
                      <input
                        type="radio"
                        name="coverage"
                        checked={coverage?.id === c.id}
                        onChange={() => {
                          setCoverage(c);
                          setEligibility(null);
                        }}
                        className="mt-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-content">{p?.name}</span>
                          {c.status !== "active" && <Badge tone="danger">{c.status}</Badge>}
                        </span>
                        <span className="mt-0.5 block text-xs text-content-muted">
                          {plan?.name} · member {c.memberId} · group {plan?.groupNumber}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {eligibility ? (
              <Callout
                tone={eligibility.active ? "accent" : "danger"}
                icon={eligibility.active ? <Check size={15} /> : <AlertTriangle size={15} />}
                title={eligibility.active ? "Coverage active" : "Coverage not active"}
              >
                <p className="text-xs leading-relaxed">
                  {eligibility.planName} · transaction{" "}
                  <span className="font-mono">{eligibility.transactionRef}</span> ·{" "}
                  {latency(eligibility.latencyMs)}
                </p>
                {!eligibility.active && (
                  <p className="mt-1 text-xs">
                    The case cannot proceed until coverage is corrected. In the
                    product this raises an administrative exception rather than
                    failing silently.
                  </p>
                )}
              </Callout>
            ) : (
              <Button variant="primary" loading={busy} onClick={runEligibility}>
                Run eligibility check (270/271)
              </Button>
            )}

            <div className="flex justify-between gap-2 border-t border-line-subtle pt-4">
              <Button icon={<ArrowLeft size={15} />} onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                variant="primary"
                icon={<ArrowRight size={15} />}
                disabled={!eligibility?.active}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---------------- Step 3 — service ---------------- */}
      {step === 2 && (
        <Card>
          <CardHeader title="Service and diagnosis" description="CPT/HCPCS and ICD-10-CM." />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service code" required>
                {(props) => (
                  <select
                    {...props}
                    value={serviceCode}
                    onChange={(e) => setServiceCode(e.target.value)}
                    className={inputClass}
                  >
                    {Object.entries(SERVICE_CATALOG).map(([code, meta]) => (
                      <option key={code} value={code}>
                        {code} — {meta.display}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Primary diagnosis" required>
                {(props) => (
                  <select
                    {...props}
                    value={diagnosisCode}
                    onChange={(e) => setDiagnosisCode(e.target.value)}
                    className={inputClass}
                  >
                    {Object.entries(DIAGNOSIS_CATALOG).map(([code, display]) => (
                      <option key={code} value={code}>
                        {code} — {display}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Ordering provider" required>
                {(props) => (
                  <select
                    {...props}
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    className={inputClass}
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}, {p.credential} — {p.specialty}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Scheduled service date">
                {(props) => (
                  <input
                    {...props}
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
            </div>

            <fieldset>
              <legend className="text-xs font-semibold text-content-secondary">Urgency</legend>
              <div className="mt-2 flex gap-2">
                {(["standard", "expedited"] as const).map((u) => (
                  <label
                    key={u}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      urgency === u
                        ? "border-brand-500 bg-tint-brand text-tint-brand-on"
                        : "border-line text-content-secondary hover:bg-surface-inset"
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      checked={urgency === u}
                      onChange={() => setUrgency(u)}
                      className="sr-only"
                    />
                    {u}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-content-muted">
                Under CMS-0057-F, impacted payers must decide expedited requests
                within 72 hours and standard requests within 7 calendar days.
              </p>
            </fieldset>

            <div className="flex justify-between gap-2 border-t border-line-subtle pt-4">
              <Button icon={<ArrowLeft size={15} />} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" icon={<ArrowRight size={15} />} onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---------------- Step 4 — is PA required ---------------- */}
      {step === 3 && payer && (
        <Card>
          <CardHeader
            title="Does this need prior authorization?"
            description="Asked electronically, through the payer's own surface where it has one."
          />
          <CardBody className="space-y-4">
            <div className="rounded-lg bg-surface-inset px-3.5 py-3">
              <PayerChip payerId={payer.id} />
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {(
                  [
                    ["CRD", payer.capabilities.crd],
                    ["DTR", payer.capabilities.dtr],
                    ["PAS", payer.capabilities.pas],
                    ["CDex", payer.capabilities.cdex],
                    ["X12 278", payer.capabilities.x12_278],
                    ["Portal", payer.capabilities.portal],
                  ] as const
                ).map(([label, supported]) => (
                  <li key={label}>
                    <Badge tone={supported ? "accent" : "neutral"}>
                      {supported ? <Check size={11} /> : <X size={11} />}
                      {label}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-content-muted">
                {payer.cms0057Impacted
                  ? "An impacted payer under CMS-0057-F — obliged to expose a FHIR Prior Authorization API by 1 January 2027."
                  : "Not an impacted payer under CMS-0057-F. Any FHIR support here is voluntary."}
              </p>
            </div>

            {busy && <LoadingBlock label="Asking the payer" />}

            <Button variant="primary" loading={busy} onClick={runRequirementCheck}>
              Check requirement
            </Button>

            <div className="flex justify-between gap-2 border-t border-line-subtle pt-4">
              <Button icon={<ArrowLeft size={15} />} onClick={() => setStep(2)}>
                Back
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---------------- Step 5 — documentation ---------------- */}
      {step === 4 && requirement && (
        <Card>
          <CardHeader
            title={
              requirement.paRequired === true
                ? "Prior authorization is required"
                : requirement.paRequired === false
                  ? "No prior authorization required"
                  : "Could not determine"
            }
            description={`Answered via ${requirement.source.toUpperCase()} · reference ${requirement.referenceNumber}${
              requirementMeta ? ` · ${latency(requirementMeta.latencyMs)}` : ""
            }`}
            action={
              <Badge
                tone={
                  requirement.paRequired === true
                    ? "brand"
                    : requirement.paRequired === false
                      ? "accent"
                      : "signal"
                }
              >
                {requirement.paRequired === true
                  ? "Required"
                  : requirement.paRequired === false
                    ? "Not required"
                    : "Unknown"}
              </Badge>
            }
          />
          <CardBody className="space-y-4">
            <p className="text-sm leading-relaxed text-content-secondary">{requirement.note}</p>

            {requirement.paRequired === false && (
              <Callout tone="accent" icon={<Check size={15} />} title="This answer gets recorded">
                A "no" is an evidenced assertion, not a default. The source, the
                date and the reference number are written back to the chart, and
                the case closes here — no portal, no call.
              </Callout>
            )}

            {requirement.paRequired === "unknown" && (
              <Callout tone="signal" icon={<AlertTriangle size={15} />} title="No electronic route answered">
                The case routes to a person rather than assuming no authorization
                is needed. Defaulting to "not required" is how practices end up
                with unpaid claims.
              </Callout>
            )}

            {questionnaire && (
              <section>
                <h3 className="mb-1 text-sm font-semibold text-content">{questionnaire.title}</h3>
                <p className="mb-3 text-xs text-content-muted">
                  Da Vinci DTR · {questionnaire.canonicalUrl} · v{questionnaire.version}. Fields
                  marked pre-filled came from structured chart data; the rest need a human or
                  document extraction.
                </p>

                <div className="space-y-3">
                  {questionnaire.items.map((item) => (
                    <Field
                      key={item.linkId}
                      label={item.text}
                      required={item.required}
                      hint={
                        item.prepopulable
                          ? `Pre-filled from the chart${item.helpText ? ` — ${item.helpText}` : ""}`
                          : item.helpText
                      }
                    >
                      {(props) =>
                        item.type === "boolean" ? (
                          <select
                            {...props}
                            value={answers[item.linkId] ?? ""}
                            onChange={(e) =>
                              setAnswers((a) => ({ ...a, [item.linkId]: e.target.value }))
                            }
                            className={inputClass}
                          >
                            <option value="">Select…</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        ) : item.type === "choice" ? (
                          <select
                            {...props}
                            value={answers[item.linkId] ?? ""}
                            onChange={(e) =>
                              setAnswers((a) => ({ ...a, [item.linkId]: e.target.value }))
                            }
                            className={inputClass}
                          >
                            <option value="">Select…</option>
                            {item.options?.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : item.type === "text" ? (
                          <textarea
                            {...props}
                            rows={2}
                            value={answers[item.linkId] ?? ""}
                            onChange={(e) =>
                              setAnswers((a) => ({ ...a, [item.linkId]: e.target.value }))
                            }
                            className={inputClass}
                          />
                        ) : (
                          <input
                            {...props}
                            type={item.type === "integer" ? "number" : item.type === "date" ? "date" : "text"}
                            value={answers[item.linkId] ?? ""}
                            onChange={(e) =>
                              setAnswers((a) => ({ ...a, [item.linkId]: e.target.value }))
                            }
                            className={inputClass}
                          />
                        )
                      }
                    </Field>
                  ))}
                </div>
              </section>
            )}

            {requirement.paRequired === true && !questionnaire && (
              <Callout tone="neutral" icon={<FileText size={15} />} title="No DTR questionnaire">
                This payer does not publish a documentation questionnaire. The
                agent assembles the same packet from the published policy as a
                checklist instead.
              </Callout>
            )}

            <div className="flex justify-between gap-2 border-t border-line-subtle pt-4">
              <Button icon={<ArrowLeft size={15} />} onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                icon={<ArrowRight size={15} />}
                disabled={!requiredAnswered}
                onClick={() => (requirement.paRequired === false ? createAndAssess() : setStep(5))}
                loading={busy}
              >
                {requirement.paRequired === false ? "Record and close" : "Continue"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---------------- Step 6 — attachments ---------------- */}
      {step === 5 && (
        <Card>
          <CardHeader
            title="Attachments"
            description="Only the documents this payer's rule asks for. Prior authorization is a payment disclosure, so the whole chart must not travel."
          />
          <CardBody className="space-y-4">
            {documents.length === 0 ? (
              <Callout tone="signal" icon={<AlertTriangle size={15} />}>
                No matching documents were retrievable from the chart. The case
                will route to a person to supply them.
              </Callout>
            ) : (
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li key={d.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2.5 hover:bg-surface-inset">
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(d.id)}
                        onChange={(e) =>
                          setSelectedDocs((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(d.id);
                            else next.delete(d.id);
                            return next;
                          })
                        }
                        className="mt-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-content">{d.title}</span>
                          {d.requiredByRule && <Badge tone="accent">Required</Badge>}
                        </span>
                        <span className="mt-0.5 block text-xs text-content-muted">
                          {d.pages} pages · from {d.source} · {fullDate(d.uploadedAt)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-content-muted">
              Retrieved through the Epic connector, filtered to the document types
              the matched rule listed.
            </p>

            <div className="flex justify-between gap-2 border-t border-line-subtle pt-4">
              <Button icon={<ArrowLeft size={15} />} onClick={() => setStep(4)}>
                Back
              </Button>
              <Button
                variant="primary"
                icon={<Sparkles size={15} />}
                loading={busy}
                onClick={createAndAssess}
              >
                Run AI assessment
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---------------- Step 7 — AI summary ---------------- */}
      {step === 6 && assessment && created && (
        <div className="space-y-5">
          <AiPanel
            assessment={assessment}
            documents={store.documents.filter((d) => created.documentIds.includes(d.id))}
            threshold={store.policy.autoSubmitThreshold}
          />

          <Card>
            <CardHeader title="Automation gate" description="Kill switch, then trust mode, then confidence threshold." />
            <CardBody className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-content-muted">Kill switch</p>
                  <p className="mt-0.5 text-sm text-content">
                    {store.policy.killSwitch ? "Engaged — everything holds" : "Released"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-content-muted">Trust mode for this payer</p>
                  <p className="mt-0.5 text-sm capitalize text-content">
                    {store.policy.trustByPayer[created.payerId] ?? "shadow"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-content-muted">Confidence vs threshold</p>
                  <p className="mt-0.5 text-sm tabular-nums text-content">
                    {assessment.confidence.overall.toFixed(2)} vs{" "}
                    {store.policy.autoSubmitThreshold.toFixed(2)}
                  </p>
                </div>
              </div>
              <ConfidenceBar
                value={assessment.confidence.overall}
                threshold={store.policy.autoSubmitThreshold}
              />
            </CardBody>
          </Card>

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              icon={<ArrowLeft size={15} />}
              onClick={() => navigate(`/provider/requests/${created.id}`)}
            >
              Open case instead
            </Button>
            <Button variant="primary" loading={busy} onClick={submit}>
              Submit to payer
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- Step 8 — outcome ---------------- */}
      {step === 7 && result && (
        <Card>
          <CardHeader
            title={
              result.request.status === "no-auth-required"
                ? "No authorization required"
                : result.request.status === "needs-approval"
                  ? "Held for release"
                  : "Submitted"
            }
          />
          <CardBody className="space-y-4">
            {result.request.status === "no-auth-required" ? (
              <Callout tone="accent" icon={<Check size={15} />} title="Recorded and closed">
                Source, date and reference number written back to the chart. No
                portal, no call, and nothing for a person to do.
              </Callout>
            ) : result.request.status === "needs-approval" ? (
              <Callout tone="signal" icon={<AlertTriangle size={15} />} title="Waiting for a human">
                The automation gate held this one. It is in the worklist for a
                staff member to release.
              </Callout>
            ) : (
              <>
                <Callout tone="accent" icon={<Check size={15} />} title="Submitted to the payer">
                  <p className="text-xs leading-relaxed">
                    Resolved on the{" "}
                    {result.resolvedBy ? (
                      <span className="font-semibold">{result.resolvedBy}</span>
                    ) : (
                      "unknown"
                    )}{" "}
                    channel.
                  </p>
                </Callout>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
                    How the waterfall ran
                  </p>
                  <ol className="space-y-2">
                    {result.request.attempts.map((a, i) => (
                      <li
                        key={a.id}
                        className="flex items-start gap-3 rounded-lg border border-line px-3 py-2.5"
                      >
                        <span
                          className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-inset text-[10px] font-semibold tabular-nums"
                          aria-hidden
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <ChannelBadge channel={a.channel} />
                            <Badge tone={a.outcome === "succeeded" ? "accent" : "danger"}>
                              {a.outcome}
                            </Badge>
                            {a.externalRef && (
                              <span className="font-mono text-xs text-content-muted">
                                {a.externalRef}
                              </span>
                            )}
                          </div>
                          {a.errorMessage && (
                            <p className="mt-1 text-xs text-content-danger">{a.errorMessage}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2 border-t border-line-subtle pt-4">
              <Button variant="primary">
                <Link to={`/provider/requests/${result.request.id}`}>
                  Open {result.request.caseNumber}
                </Link>
              </Button>
              <Button onClick={() => window.location.reload()}>Start another</Button>
            </div>
          </CardBody>
        </Card>
      )}

      <p className="mt-6 text-xs text-content-muted">
        Signed in as {user?.name}. Every record created here is synthetic and
        disappears when you reload.
      </p>
    </>
  );
}
