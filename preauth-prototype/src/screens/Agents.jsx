import React from "react";
import { DB } from "../data/index.js";
import { Card, Chip, Grid, Note, Section } from "../components/ui.jsx";
import { usePanel, Dl, Ul } from "../components/Panel.jsx";

export default function Agents() {
  const panel = usePanel();

  const open = (a) =>
    panel.open(
      <span><Chip tone="ag" fill className="mr-2">{a.ab}</Chip>{a.name}</span>,
      null,
      <Dl
        items={[
          ["Role", a.role],
          ["What starts it", a.trigger],
          ["Tools it uses", <Ul items={a.tools} />],
          ["Inputs", <Ul items={a.inputs} />],
          ["Outputs", <Ul items={a.outputs} />],
          ["When it escalates to a human", <span className="text-human">{a.escalate}</span>],
          ["Platform services it depends on", <div className="flex flex-wrap gap-[5px]">{a.platform.map((p) => <Chip key={p} tone="acc">{p}</Chip>)}</div>],
        ]}
      />
    );

  return (
    <>
      <Note className="mb-[18px]">
        One orchestrator holds the case plan; the seven specialists hold no state of their own. Click a card
        for its full tool list, inputs, outputs and escalation rule. <b>No agent submits anything.</b>{" "}
        Submission and appeal filing both sit behind a named human approval, always — not as a confidence
        threshold, as a property of the design.
      </Note>

      <Grid min={248}>
        {DB.agents.map((a) => (
          <button
            key={a.id}
            onClick={() => open(a)}
            className="card text-left flex flex-col gap-[9px] cursor-pointer transition-all hover:border-agent hover:shadow-card hover:-translate-y-px"
          >
            <div className="flex gap-[10px] items-start">
              <span className="w-7 h-7 rounded-md bg-agent-wash text-agent grid place-items-center font-mono text-[11px] font-bold flex-none">{a.ab}</span>
              <h3 className="text-[13.5px] font-semibold leading-[1.25]">{a.name}</h3>
            </div>
            <div className="text-[12.3px] text-ink-soft leading-[1.5]">{a.role}</div>
            <div className="text-[11.5px] text-human border-l-2 border-human pl-[9px] leading-[1.45]">
              <b>Escalates:</b> {a.escalate.split(".")[0]}.
            </div>
            <div className="font-mono text-[9.5px] text-ink-faint border-t border-rule-soft pt-2 mt-auto">
              {a.platform.length} platform services · {a.tools.length} tools
            </div>
          </button>
        ))}
      </Grid>

      <Section n="gate" title="Where the human sits" >
        <Grid min={300}>
          <Card tone="hum" title={<span className="text-human">Two hard gates</span>}>
            <p className="text-ink-soft text-[12.5px] m-0">
              Nothing is submitted to a payer without a named human approving the packet, and no appeal is
              filed without a clinician signing it. Neither gate is governed by a confidence threshold.
              Confidence decides how much arrives pre-filled and how loudly the gaps are flagged — never
              whether a person is involved. Sign in as an administrator and watch the submit button refuse you.
            </p>
          </Card>
          <Card title="What confidence actually controls">
            <p className="text-ink-soft text-[12.5px] m-0">
              Which criteria are surfaced first, whether a packet is queued as routine or flagged, whether the
              orchestrator recommends holding, and how a case is ordered against the SLA clock. A coordinator
              can always overrule the recommendation — and the recommendation, the override and its stated
              reason all go to the audit log, which is what protects them afterwards.
            </p>
          </Card>
        </Grid>
      </Section>
    </>
  );
}
