import React from "react";
import { DB } from "../data/index.js";
import { Card, Chip, Grid, Note, Section, Table, WarnBox } from "../components/ui.jsx";

const TOTAL = 40;
const BAND = {
  platform: { tone: "acc", bar: "bg-accent", label: "Platform" },
  workflow: { tone: "hum", bar: "bg-human", label: "Pre-auth workflow" },
};
const CALL = { build: "acc", adopt: "hum", buy: "ok", defer: "warn", decide: "warn" };
const SEV = { high: "bad", medium: "warn", low: "f" };

/* A phase bar positioned on a 40-week track. Week 0 means "starts immediately
   and never finishes", which is the paperwork phase and is drawn full width. */
function Track({ p }) {
  const [a, b] = p.weeks;
  const left = (Math.max(a, 0) / TOTAL) * 100;
  const width = Math.max(((b - Math.max(a, 0)) / TOTAL) * 100, 3);
  return (
    <div className="relative h-[22px] bg-sunken rounded-[3px] overflow-hidden">
      <div
        className={`absolute top-0 bottom-0 ${BAND[p.band].bar} ${a === 0 ? "opacity-40" : ""} rounded-[3px]`}
        style={{ left: `${left}%`, width: `${width}%` }}
      />
      <span className="absolute inset-0 flex items-center px-[8px] font-mono text-[9.5px] tracking-[.08em] text-ink mix-blend-normal">
        {p.when}
      </span>
    </div>
  );
}

export default function BuildPlan() {
  const { phases, decisions, risks } = DB.buildplan;

  return (
    <>
      <Note className="mb-[18px]">
        Forty weeks, in two bands. The <b className="text-accent-ink">platform</b> phases build the layer we
        would otherwise be buying; the <b className="text-human">workflow</b> phases build prior authorisation
        on top of it. They overlap on purpose — the vertical slice starts before normalisation finishes,
        because the workflow is what tells you which parts of the derived layer actually matter.
      </Note>

      <Section n="01" title="Phasing">
        <div className="border border-rule rounded-lg bg-surface overflow-hidden">
          {phases.map((p, i) => (
            <div
              key={p.id}
              className={`grid gap-[16px] p-[14px_16px] items-start ${i ? "border-t border-rule-soft" : ""}`}
              style={{ gridTemplateColumns: "minmax(200px,1.1fr) minmax(220px,1.4fr) minmax(240px,1.5fr)" }}
            >
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10.5px] text-accent-ink">{p.id}</span>
                  <span className="text-[13.4px] font-semibold leading-tight">{p.name}</span>
                </div>
                <div className="mt-[7px]"><Chip tone={BAND[p.band].tone}>{BAND[p.band].label}</Chip></div>
                <div className="text-[12.2px] text-ink-soft mt-[8px] leading-[1.45]">{p.goal}</div>
              </div>

              <div>
                <Track p={p} />
                <ul className="m-0 mt-[10px] pl-4 space-y-[3px] text-[11.8px] text-ink-soft leading-[1.45]">
                  {p.work.map((w) => <li key={w} className="marker:text-accent">{w}</li>)}
                </ul>
              </div>

              <div>
                <div className="kick mb-[5px]">Exit criterion</div>
                <div className="text-[12.2px] font-medium leading-[1.45]">{p.exit}</div>
                <div className="text-[11.6px] text-ink-faint mt-[9px] leading-[1.5] border-l-2 border-rule pl-[10px]">{p.note}</div>
              </div>
            </div>
          ))}
        </div>
        <Note className="mt-4">
          P0 is drawn faded across the whole track because it never exits — it only has to have started. If
          the vendor registrations begin in week thirteen rather than week one, phase P4 is where the schedule
          discovers it, and there is nothing engineering can do about it by then.
        </Note>
      </Section>

      <Section n="02" title="Build, adopt or buy">
        <Table head={["Capability", "Call", "What", "Why"]} minWidth={860}>
          {decisions.map((d) => (
            <tr key={d.item}>
              <td className="font-semibold">{d.item}</td>
              <td><Chip tone={CALL[d.call] || "f"}>{d.call}</Chip></td>
              <td className="font-mono text-[11.3px] text-accent-ink">{d.pick}</td>
              <td className="text-[11.9px] text-ink-soft">{d.why}</td>
            </tr>
          ))}
        </Table>
        <Note className="mt-4">
          The five rows marked <b>build</b> — source catalog, connection state, retrieval, derived models and
          the policy store — are the product. Everything else on this table is plumbing that is cheaper to
          rent than to own, and renting it is what makes the forty weeks plausible at all.
        </Note>
      </Section>

      <Section n="03" title="What actually threatens the date">
        <Grid min={290}>
          {risks.map((r) => (
            <Card key={r.r} tone={SEV[r.sev]}>
              <div className="flex justify-between gap-2 items-baseline mb-[6px]">
                <h3 className="card-h m-0 text-[13.2px]">{r.r}</h3>
                <Chip tone={SEV[r.sev]}>{r.sev}</Chip>
              </div>
              <p className="text-ink-soft text-[12.2px] m-0">{r.note}</p>
              <div className="mt-[10px] pt-[9px] border-t border-rule-soft font-mono text-[9.5px] text-ink-faint">
                {r.who}
              </div>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section n="04" title="What this plan deliberately does not contain">
        <WarnBox label="Out of scope for the first forty weeks">
          <ul className="m-0 pl-4 space-y-[5px]">
            <li className="marker:text-warn">
              <b className="text-ink">TEFCA / QHIN network access.</b> Legal and organisational membership, not
              engineering. The prototype's scenario-2 network find is scripted; in a real v1 it is a gap the
              coordinator works by hand.
            </li>
            <li className="marker:text-warn">
              <b className="text-ink">An openEHR CDR.</b> Deferred, not rejected — see the note on the Platform
              Core screen.
            </li>
            <li className="marker:text-warn">
              <b className="text-ink">Auto-submit below a confidence threshold.</b> Every buyer will ask for it.
              The human gate in this build is categorical, and whether that ships as configuration, as a
              refusal, or as a configuration with a floor is open question 6.
            </li>
            <li className="marker:text-warn">
              <b className="text-ink">A second workflow.</b> The platform-first argument only pays off if one
              exists. Naming it — referral management, quality abstraction, risk adjustment — is a strategy
              decision, and the plan above is the same either way.
            </li>
            <li className="marker:text-warn">
              <b className="text-ink">A payer-side product.</b> The same core could be sold to plans as a
              CRD/DTR/PAS facade against the January 2027 deadline. Different company, different sales motion.
              Building both at once is how this goes wrong.
            </li>
          </ul>
        </WarnBox>
      </Section>
    </>
  );
}
