import React from "react";
import { Card, Grid, Kpi, Note, Section, WarnBox, Chip } from "../components/ui.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { casesFor } from "../data/index.js";

const PROBLEMS = [
  ["It begins with a question nobody could ask", "Before any of the delay starts, somebody has to know that prior authorisation is needed at all. Until CRD there was no standard way to ask. It lived in a coordinator's memory, a stale payer PDF, or a phone call — and it is the step that has never been measured because it never existed as a step."],
  ["The work is manual, and it is clinical", "Finding the right note, the right lab, the right prior study, then retyping facts that already exist in the chart into a payer's form. It needs clinical judgement, which is why it cannot simply be offshored, and it is repetitive, which is why nobody senior wants to do it."],
  ["Delay lands entirely on the patient", "The operational cost is staff hours. The clinical cost is a patient living with an untreated problem while paperwork moves between two organisations that cannot see each other's systems."],
  ["Denials are frequently about documents, not medicine", "A large share of adverse determinations cite documentation that existed all along and was not attached, or was attached in a form the reviewer did not accept. That is an information-retrieval failure wearing a clinical costume."],
  ["The more-info loop is the silent killer", "A pend request arrives by fax or portal, sits in a queue, and blows the clock. Nobody polls reliably, because polling is nobody's job."],
  ["And the deadline is real", "CMS-0057-F requires covered plans to expose prior-authorisation APIs by 1 January 2027, with expedited decisions inside 72 hours. Clinicians are pulled in a year later through a MIPS measure that can only be satisfied with certified software."],
];

const KPIS = [
  ["Turnaround, order to decision", "3 days", "→ under 4 hours", "Median, standard requests against a payer with a PAS endpoint. The expedited statutory clock is 72 hours; the aim is to be well inside it.", 0.85],
  ["First-pass approval rate", "62%", "→ 85%", "Approved without a pend or a denial. Driven almost entirely by whether the right document was attached the first time.", 0.85],
  ["Coordinator minutes per case", "38 min", "→ 9 min", "Of which most of the nine is the review step, which stays human on purpose.", 0.76],
  ["Cases per coordinator per day", "22", "→ 70", "Capacity, not headcount reduction — most organisations have a backlog long before they have surplus staff.", 0.7],
  ["Pended cases resolved within 48 h", "31%", "→ 80%", "The more-info loop, which today depends on someone remembering to check a portal.", 0.8],
  ["Appeals filed within the window", "not tracked", "→ 100%", "Deadline tracking is the least clever and most valuable thing in the whole system.", 1],
  ["Evidence found outside the ordering EHR", "—", "→ 1 in 6 cases", "Records that decide a case and live somewhere the practice is not connected to. Needs a platform to find; impossible for an agent with one EHR connection.", 0.17],
  ["Human approval rate before submission", "—", "100%, permanently", "Not a metric to improve. A property of the design.", 1],
];

export default function Overview({ onRoute }) {
  const { tenant, user, role } = useAuth();
  const n = casesFor(tenant.id).length;

  return (
    <>
      <WarnBox label="Read this first" className="mb-6">
        Every number, patient, payer, policy and authorisation in this prototype is fabricated. The outcome
        figures below are <b>targets we would hold ourselves to</b>, not measurements. Nothing here has been
        validated against a real book of business.
      </WarnBox>

      <Card className="mb-8" tone="acc">
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div className="min-w-[280px] flex-1">
            <h3 className="card-h">You are signed into {tenant.name}</h3>
            <p className="text-ink-soft text-[12.8px] m-0 max-w-[68ch]">
              {tenant.blurb} You are <b>{user.name}</b>, {role.label.toLowerCase()} — {role.can.toLowerCase()}{" "}
              <span className="text-bad">{role.cannot}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Chip tone="f">{n} open cases</Chip>
            <Chip tone="f">{tenant.sources.length} connected sources</Chip>
            <Chip tone={tenant.flags.networkExchange ? "ok" : "bad"}>
              network exchange {tenant.flags.networkExchange ? "on" : "off"}
            </Chip>
          </div>
        </div>
      </Card>

      <Section n="01" title="The problem">
        <Grid min={248}>
          {PROBLEMS.map(([h, b]) => (
            <Card key={h} title={h}>
              <p className="text-ink-soft text-[12.5px] m-0">{b}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section n="02" title="The approach — platform first, then workflows on it">
        <p className="text-ink-soft mb-[18px]">
          The tempting version of this product is a prior-authorisation agent that talks to an EHR. It demos
          well and it does not compound. Every new workflow re-solves identity, terminology, retrieval and
          audit from scratch, and none of them can see each other&rsquo;s data. The version worth building puts a
          clinical data platform underneath first, and makes prior authorisation the first tenant of it.
        </p>
        <Grid min={300}>
          <Card tone="bad">
            <div className="kick text-bad mb-2">The standalone agent</div>
            <ul className="text-[12.5px] text-ink-soft pl-[17px] m-0 leading-[1.7] space-y-1 marker:text-bad">
              <li>Its own EHR connection, its own token refresh, its own patient matching.</li>
              <li>Retrieval tuned for one workflow. The next workflow starts at zero.</li>
              <li>Audit is whatever the agent happened to log.</li>
              <li>Terminology handled with string matching and hope.</li>
              <li>Demos in six weeks. Second workflow costs as much as the first.</li>
            </ul>
          </Card>
          <Card tone="ok">
            <div className="kick text-ok mb-2">Workflows on a platform</div>
            <ul className="text-[12.5px] text-ink-soft pl-[17px] m-0 leading-[1.7] space-y-1 marker:text-ok">
              <li>One reconciled longitudinal record, shared by every workflow.</li>
              <li>Terminology, identity, consent and audit are services, not per-agent code.</li>
              <li>An agent that reads through platform APIs is audited by construction.</li>
              <li>Policies live as versioned structured criteria, reusable by referral management, quality reporting and risk adjustment.</li>
              <li>Multi-tenant by construction — three organisations, one platform, no shared state.</li>
            </ul>
          </Card>
        </Grid>
        <Note className="mt-4">
          Prior authorisation is the right first workflow precisely because it exercises nearly all of the
          platform: identity, consent, retrieval across sources, terminology, forms, rules, audit and outbound
          integration. If the platform can carry pre-auth, it can carry most of what comes next.
        </Note>
      </Section>

      <Section n="03" title="Outcomes we would target" right={<Chip tone="warn">ILLUSTRATIVE — NOT MEASURED</Chip>}>
        <Grid min={196}>
          {KPIS.map(([l, v, a, d, b]) => (
            <Kpi key={l} label={l} value={v} arrow={a} detail={d} bar={b} />
          ))}
        </Grid>
        <Note className="mt-4">
          The honest version of this slide in a real review names the baseline source. Ours would be the
          client&rsquo;s own last twelve months of determinations, not an industry average — the variance between
          organisations on every one of these is larger than the improvement being claimed.
        </Note>
      </Section>

      <Section n="04" title="What to look at, in what order">
        <Grid min={248}>
          {[
            ["arch", "02 · Architecture", "The five layers, and specifically which components belong to the platform rather than to this workflow."],
            ["agents", "03 · Agents", "Seven specialists, and the escalation rule each one carries."],
            ["demo", "06 · Live Demo", "Three cases end to end: approved, pended, denied and appealed. Start here if the room is short on time."],
          ].map(([r, t, d]) => (
            <Card key={r} as="button" title={t} onClick={() => onRoute(r)} className="text-left w-full cursor-pointer hover:border-accent">
              <p className="text-ink-soft text-[12.5px] m-0">{d}</p>
            </Card>
          ))}
        </Grid>
      </Section>
    </>
  );
}
