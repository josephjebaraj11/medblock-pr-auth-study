import React, { useEffect, useMemo, useState } from "react";
import { DB, PERM, casesFor, scenariosFor, pct, SCENARIO_TENANT, usersFor } from "../data/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Card, Chip, Grid, Note, Btn, Avatar } from "../components/ui.jsx";
import Timeline, { Facts, Event } from "../demo/Timeline.jsx";
import ReviewPacket from "../demo/ReviewPacket.jsx";
import { Outcome, AppealLetter } from "../demo/Outcome.jsx";
import { PLAYING } from "../demo/engine.js";

const STATUS_TONE = { draft: "f", gathering: "acc", review: "hum", submitted: "ag", pended: "warn", approved: "ok", denied: "bad", appeal: "hum" };
const SCEN_META = {
  approved: ["01 · clean run", "Meridian · full Da Vinci"],
  pended: ["02 · more-info loop", "Northstar · CRD only, X12 fallback"],
  denied: ["03 · denial and appeal", "Cascade · portal and fax only"],
};
const STEPS = [
  ["Intake & eligibility", ["run"]],
  ["Evidence & criteria", ["run"]],
  ["Human review", ["review", "review2"]],
  ["Submission", ["submit", "rfiSubmit", "appealSubmit"]],
  ["Payer decision", ["result", "result2", "result3", "letter", "rfi", "appeal"]],
];
const ORDER = ["run", "review", "submit", "result", "rfi", "review2", "rfiSubmit", "result2", "appeal", "letter", "appealSubmit", "result3"];

const stageStatus = (stage, sk) =>
  ({ run: "gathering", review: "review", review2: "review", submit: "submitted", rfiSubmit: "submitted",
     appealSubmit: "appeal", rfi: "gathering", appeal: "appeal", letter: "appeal", result2: "approved", result3: "appeal",
     result: sk === "approved" ? "approved" : sk === "pended" ? "pended" : "denied" }[stage] || "draft");

function Queue({ cases, sel, onSel, filter, setFilter, liveId, liveStatus }) {
  const filters = [["all", "All"], ["draft", "New"], ["review", "Review"], ["submitted", "Sent"], ["pended", "Pended"], ["approved", "Approved"], ["denied", "Denied"]];
  const list = cases.filter((c) => filter === "all" || (c.id === liveId ? liveStatus : c.status) === filter);
  return (
    <div className="bg-surface border border-rule rounded-lg overflow-hidden sticky top-[76px]">
      <div className="p-[12px_14px] border-b border-rule flex justify-between items-center gap-2">
        <h3 className="text-[13px] font-semibold">Pre-authorisation work queue</h3>
        <Chip tone="warn">MOCK</Chip>
      </div>
      <div className="flex gap-1 p-[9px_12px] border-b border-rule-soft flex-wrap bg-sunken">
        {filters.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`font-mono text-[9px] tracking-[.08em] uppercase px-[7px] py-[3px] rounded border ${filter === k ? "bg-raise border-rule text-ink" : "border-transparent text-ink-faint hover:text-ink"}`}>
            {l}
          </button>
        ))}
      </div>
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        {list.length === 0 && <div className="p-[22px_14px] text-[11.5px] text-ink-faint">No cases with that status.</div>}
        {list.map((c) => {
          const p = DB.ptById[c.patientId], pay = DB.payById[c.payerId];
          const status = c.id === liveId ? liveStatus : c.status;
          const st = DB.STATUS[status];
          const hot = c.sla && (status === "pended" || status === "submitted");
          return (
            <button key={c.id} onClick={() => onSel(c.id)}
              className={`block w-full text-left border-b border-rule-soft p-[11px_14px] border-l-[3px] ${sel === c.id ? "bg-accent-wash border-l-accent" : "border-l-transparent hover:bg-sunken"}`}>
              <div className="flex justify-between gap-2 items-baseline">
                <span className="text-[12.8px] font-semibold leading-[1.3]">{p.name}</span>
                <Chip tone={STATUS_TONE[status]} fill>{st.label}</Chip>
              </div>
              <div className="font-mono text-[10px] text-ink-faint mt-1 leading-[1.5]">
                {c.id} · {c.service.code}<br />{c.service.desc}
              </div>
              <div className="mt-[7px] flex gap-[5px] items-center flex-wrap">
                <Chip tone="f">{pay.short}</Chip>
                {c.priority === "Expedited" && <Chip tone="bad">expedited</Chip>}
                {c.seed && <Chip tone="acc">DEMO</Chip>}
                {c.confidence != null && <span className="font-mono text-[9.5px] text-ink-faint">conf {pct(c.confidence)}</span>}
                {hot && <span className={`font-mono text-[9.5px] ${status === "pended" ? "text-bad" : "text-ink-faint"}`}>SLA {c.sla.slice(5, 10)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CaseHead({ c, right }) {
  const p = DB.ptById[c.patientId], pay = DB.payById[c.payerId];
  return (
    <div className="p-[15px_20px] border-b border-rule flex justify-between gap-4 items-start flex-wrap">
      <div>
        <h2 className="text-[15.5px] font-semibold">{p.name} <span className="text-ink-faint font-normal">· {c.service.code}</span></h2>
        <div className="font-mono text-[10.5px] text-ink-faint mt-[5px] leading-[1.6]">
          {c.id} · {c.service.desc}<br />
          MRN {p.mrn} · {p.age}{p.sex} · {pay.name} · member {p.member} · ordered by {c.ordering}
        </div>
      </div>
      <div>{right}</div>
    </div>
  );
}

function Stepper({ stage }) {
  const cur = ORDER.indexOf(stage);
  return (
    <div className="flex gap-0 mb-[18px] flex-wrap">
      {STEPS.map(([k, st], i) => {
        const idx = Math.min(...st.map((x) => ORDER.indexOf(x)));
        let cls = cur > idx ? "done" : st.includes(stage) ? "on" : "";
        if (i < 2) cls = stage === "run" ? "on" : "done";
        const color = cls === "done" ? "border-t-ok text-ok" : cls === "on" ? "border-t-accent text-accent-ink" : "border-t-rule text-ink-faint";
        return <div key={k} className={`flex-1 min-w-[110px] border-t-2 pt-[9px] px-3 font-mono text-[9.5px] tracking-[.1em] uppercase ${color}`}>{k}</div>;
      })}
    </div>
  );
}

function ActivityLog({ events }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-[22px]">
      <button onClick={() => setOpen((v) => !v)} className="kick py-2 hover:text-ink">
        {open ? "▾" : "▸"} Agent activity log — {events.length} events · this is the audit trail, rendered
      </button>
      {open && (
        <div className="mt-[14px] max-h-[340px] overflow-y-auto">
          {events.map((e, i) => <Event key={i} e={e} last={i === events.length - 1} />)}
        </div>
      )}
    </div>
  );
}

export default function LiveDemo({ engine }) {
  const { tenant, user, role, can, switchUser, signIn } = useAuth();
  const { st, speed, setSpeed, sel, setSel, start, runPhase, skip, reset } = engine;
  const [filter, setFilter] = useState("all");
  const cases = useMemo(() => casesFor(tenant.id), [tenant.id]);
  const myScenarios = scenariosFor(tenant.id);

  /* A tenant switch must not leave another tenant's case on screen. */
  useEffect(() => {
    if (sel && !cases.some((c) => c.id === sel)) { reset(); setSel(null); }
  }, [tenant.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const scen = st.sk ? DB.scenarios[st.sk] : null;
  const activeCase = st.active ? DB.caseById[st.active] : null;
  const selCase = sel ? DB.caseById[sel] : null;
  const playing = !!PLAYING[st.stage];
  const liveStatus = st.active ? stageStatus(st.stage, st.sk) : null;

  const clinician = usersFor(tenant.id).find((u) => u.role === "clinician");
  const submitReason = `${user.name} is a ${role.label.toLowerCase()}. ${role.cannot} Become a coordinator or clinician from the account menu.`;
  const signReason = `${user.name} is a ${role.label.toLowerCase()}. ${role.cannot} Become ${clinician ? clinician.name : "a clinician"} from the account menu.`;

  const log = <ActivityLog events={st.events} />;

  const scenarioCards = (
    <div className="grid gap-[10px] mt-[22px] text-left w-full max-w-[760px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))" }}>
      {Object.keys(DB.scenarios).map((k) => {
        const s = DB.scenarios[k], c = DB.caseById[s.caseId], p = DB.ptById[c.patientId];
        const ownerId = SCENARIO_TENANT[k], owner = DB.tenantById[ownerId], mine = ownerId === tenant.id;
        return (
          <button key={k}
            onClick={() => (mine ? start(k) : signIn(usersFor(ownerId)[0].id, { method: "tenant-switch" }))}
            className={`bg-raise border rounded-lg p-[14px_15px] text-left transition-all hover:-translate-y-px hover:shadow-card hover:border-accent ${mine ? "border-rule" : "border-rule opacity-70"}`}>
            <span className="block kick mb-[7px]">{SCEN_META[k][0]} · {SCEN_META[k][1]}</span>
            <span className="block text-[13px] font-semibold leading-[1.3]">{s.label}</span>
            <span className="block text-[11.8px] text-ink-soft mt-[6px] leading-[1.45]"><b>{p.name}</b> — {c.service.desc} ({c.service.code})</span>
            <span className="block text-[11.8px] text-ink-faint mt-[6px] leading-[1.45]">{s.blurb}</span>
            <span className="block mt-[9px]">
              {mine ? (
                <Chip tone="ok">this tenant</Chip>
              ) : (
                <>
                  <Chip tone="warn">{owner.short}</Chip>
                  <span className="block text-[11px] text-ink-faint mt-[5px] leading-[1.4]">
                    Another tenant&rsquo;s case — click to switch organisation.
                  </span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  let body;
  if (activeCase) {
    if (playing) {
      body = (
        <div className="grid gap-[18px]" style={{ gridTemplateColumns: "minmax(0,1.55fr) minmax(0,1fr)" }}>
          <Timeline events={st.events} playing />
          <Facts facts={st.facts} patient={DB.ptById[activeCase.patientId]} payer={DB.payById[activeCase.payerId]} />
        </div>
      );
    } else if (st.stage === "review" || st.stage === "review2") {
      body = (
        <ReviewPacket
          R={st.stage === "review" ? scen.review : scen.rfiReview}
          policy={DB.polById[activeCase.policyId]}
          btnLabel={st.stage === "review" ? "Approve & Submit" : "Approve & Resubmit"}
          onApprove={() => runPhase(st.stage === "review" ? "submit" : "rfiSubmit")}
          onReject={() => { reset(); setSel(null); }}
          allowed={can(PERM.SUBMIT)}
          reason={submitReason}
          log={log}
        />
      );
    } else if (st.stage === "letter") {
      body = (
        <AppealLetter letter={scen.letter} onSign={() => runPhase("appealSubmit")} onBack={() => { reset(); setSel(null); }}
          allowed={can(PERM.SIGN_APPEAL)} reason={signReason} log={log} />
      );
    } else {
      const O = st.stage === "result" ? scen.outcome : st.stage === "result2" ? scen.rfiOutcome : scen.appealOutcome;
      const hasNext = st.stage === "result" && O.next;
      body = (
        <Outcome O={O} nextLabel={O.next?.label} nextSub={O.next?.sub}
          onNext={hasNext ? () => runPhase(st.sk === "pended" ? "rfi" : "appeal") : null}
          onBack={() => { reset(); setSel(null); }} log={log} />
      );
    }
  } else if (selCase?.seed && myScenarios.includes(selCase.seed)) {
    const s = DB.scenarios[selCase.seed], p = DB.ptById[selCase.patientId], pay = DB.payById[selCase.payerId], pol = DB.polById[selCase.policyId];
    body = (
      <>
        <Grid min={300} className="mb-[18px]">
          <Card title="What this run shows">
            <p className="text-ink-soft text-[12.5px] m-0">{s.blurb}</p>
            <div className="flex flex-wrap gap-[5px] mt-3">{pay.channels.map((x) => <Chip key={x} tone="acc">{x}</Chip>)}</div>
          </Card>
          <Card title="Policy in force">
            <div className="font-mono text-[11.5px] text-ink-faint mb-[6px]">{pol.ref} {pol.rev}</div>
            <p className="text-ink-soft text-[12.5px] mb-2">{pol.title} — {pol.criteria.length} criteria, all required.</p>
            <div className="text-[11.5px] text-ink-faint">{pol.citation}</div>
          </Card>
        </Grid>
        <Card title="Clinical picture" className="mb-[18px]">
          <div className="text-[12.3px] text-ink-soft leading-[1.7]">
            {p.problems.map((x) => <div key={x.code}><b>{x.code}</b> {x.text} <span className="text-ink-faint">(onset {x.onset})</span></div>)}
            <div className="mt-3"><b>Medications:</b> {p.meds.join(" · ")}</div>
            <div><b>Allergies:</b> {p.allergies.join(" · ")}</div>
          </div>
        </Card>
        <div className="flex gap-[10px] items-center flex-wrap border-t border-rule pt-[15px]">
          <Btn onClick={() => start(selCase.seed)}>Run the agents &rarr;</Btn>
          <span className="text-[11.8px] text-ink-faint flex-1 min-w-[200px]">
            Seven agents, scripted. The run stops at the human review gate — it will not submit on its own.
          </span>
        </div>
      </>
    );
  } else if (selCase) {
    const pay = DB.payById[selCase.payerId], stt = DB.STATUS[selCase.status];
    body = (
      <>
        <Grid min={300}>
          <Card title="Case notes"><p className="text-ink-soft text-[12.5px] m-0">{selCase.note}</p></Card>
          <Card title="State">
            <div className="text-[12.3px] text-ink-soft leading-[1.9]">
              <div><b>Status</b> {stt.label} — {stt.desc}</div>
              <div><b>Owner</b> {selCase.owner}</div>
              <div><b>Priority</b> {selCase.priority}</div>
              <div><b>Created</b> {selCase.created.replace("T", " ")}</div>
              <div><b>Updated</b> {selCase.updated.replace("T", " ")}</div>
              {selCase.sla && <div><b>SLA</b> {selCase.sla.replace("T", " ")}</div>}
              {selCase.authNo && <div><b>Authorisation</b> <span className="font-mono">{selCase.authNo}</span></div>}
              {selCase.confidence != null && <div><b>Packet confidence</b> {pct(selCase.confidence)}</div>}
              <div><b>Payer tier</b> {pay.tier} — {pay.channels.join(", ")}</div>
            </div>
          </Card>
        </Grid>
        <Note className="mt-[18px]">
          This case is queue dressing — it exists to make the work queue look like a real morning. The cases
          marked <Chip tone="acc">DEMO</Chip> are the ones with scripted agent runs behind them.
        </Note>
        {scenarioCards}
      </>
    );
  } else {
    body = (
      <div className="grid place-items-center text-center p-[52px_20px]">
        <div>
          <div className="text-base font-semibold mb-2">Nothing selected</div>
          <p className="text-ink-soft text-[12.5px] max-w-[52ch] mx-auto">
            Choose a case from {tenant.short}&rsquo;s queue, or start one of the scripted runs below. Each plays the
            agent activity step by step, stops at the human review gate, and then simulates a payer response.
          </p>
        </div>
        {scenarioCards}
      </div>
    );
  }

  const head = activeCase
    ? <CaseHead c={activeCase} right={<Chip tone={STATUS_TONE[liveStatus]} fill>{DB.STATUS[liveStatus].label}</Chip>} />
    : selCase
      ? <CaseHead c={selCase} right={<Chip tone={STATUS_TONE[selCase.status]} fill>{DB.STATUS[selCase.status].label}</Chip>} />
      : (
        <div className="p-[15px_20px] border-b border-rule">
          <h2 className="text-[15.5px] font-semibold">Start a pre-authorisation</h2>
          <div className="font-mono text-[10.5px] text-ink-faint mt-[5px]">pick a scenario — each runs a different payer tier and a different outcome</div>
        </div>
      );

  return (
    <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "326px minmax(0,1fr)" }}>
      <Queue cases={cases} sel={sel} onSel={(id) => { if (st.active && st.active !== id) reset(); setSel(id); }}
        filter={filter} setFilter={setFilter} liveId={st.active} liveStatus={liveStatus} />
      <div className="bg-surface border border-rule rounded-lg min-h-[560px] flex flex-col overflow-hidden">
        {head}
        <div className="p-5 flex-1">
          {activeCase && <Stepper stage={st.stage} />}
          {body}
        </div>
      </div>
    </div>
  );
}

export function DemoTopRight({ engine }) {
  const { st, speed, setSpeed, skip, reset, setSel } = engine;
  if (!st.active) return <Chip tone="warn">mock queue</Chip>;
  return (
    <div className="flex gap-[3px] items-center font-mono text-[9.5px] text-ink-faint">
      speed
      {[1, 2, 4].map((x) => (
        <button key={x} onClick={() => setSpeed(x)}
          className={`border rounded px-[7px] py-[3px] font-mono text-[9.5px] ${speed === x ? "bg-accent-wash border-accent text-accent-ink" : "bg-surface border-rule text-ink-faint"}`}>
          {x}&times;
        </button>
      ))}
      <button onClick={skip} className="bg-surface border border-rule rounded px-[7px] py-[3px] ml-2 font-mono text-[9.5px]">SKIP</button>
      <button onClick={() => { reset(); setSel(null); }} className="bg-surface border border-rule rounded px-[7px] py-[3px] ml-1 font-mono text-[9.5px]">RESET</button>
    </div>
  );
}
