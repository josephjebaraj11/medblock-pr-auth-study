import React from "react";
import { DB } from "../data/index.js";
import { Card, Chip, Grid, Note } from "../components/ui.jsx";
import { usePanel, Dl } from "../components/Panel.jsx";

const KIND = {
  decision: "border-dashed border-warn bg-warn-wash",
  human: "border-human bg-human-wash border-[1.5px]",
  agent: "border-rule border-l-[2.5px] border-l-agent",
  term: "border-ok bg-ok-wash",
  termbad: "border-bad bg-bad-wash",
  "": "border-rule",
};

export default function ProcessFlow() {
  const panel = usePanel();

  const open = (st) =>
    panel.open(
      st.title,
      `STEP ${st.n} · ${DB.lanes[st.lane]}`,
      <Dl
        items={[
          ["Who acts", st.d.who],
          ["What happens", st.d.what],
          ["Protocols", <div className="flex flex-wrap gap-[5px]">{st.d.proto.map((p) => <Chip key={p} tone="acc">{p}</Chip>)}</div>],
          ["How it fails", st.d.fail],
          ...(st.branches ? [["Branches", <div className="flex flex-wrap gap-[5px]">{st.branches.map((b) => <Chip key={b.t} tone={b.k.replace("c-", "")}>{b.t}</Chip>)}</div>]] : []),
        ]}
      />
    );

  const cols = "52px repeat(4,minmax(176px,1fr))";

  return (
    <>
      <Note className="mb-4">
        Time runs downward; the four lanes are who is acting. Dashed amber boxes are decision points, purple
        boxes are human gates, and a left bar marks an agent step. Click any step for detail, including how it
        fails.
      </Note>
      <div className="flex gap-4 flex-wrap mb-[14px]">
        <Chip tone="warn">decision point</Chip>
        <Chip tone="hum">human gate</Chip>
        <Chip tone="ag">agent step</Chip>
        <Chip tone="ok">terminal state</Chip>
      </div>

      <div className="border border-rule rounded-lg bg-surface overflow-x-auto">
        <div className="grid sticky top-0 bg-sunken border-b border-rule z-[5]" style={{ gridTemplateColumns: cols }}>
          {["step", ...DB.lanes].map((l, i) => (
            <div key={l} className={`p-[9px_12px] kick ${i ? "border-l border-rule-soft" : ""}`}>{l}</div>
          ))}
        </div>
        {DB.flow.map((st) => (
          <div key={st.n} className="grid border-b border-rule-soft last:border-b-0 min-h-[62px]" style={{ gridTemplateColumns: cols }}>
            <div className="pt-3 text-center font-mono text-[10px] text-ink-faint border-r border-rule-soft">{st.n}</div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`p-[9px_10px] relative ${i ? "border-l border-rule-soft" : ""}`}>
                <div
                  className="absolute left-1/2 top-0 bottom-0 w-px"
                  style={{ background: "repeating-linear-gradient(to bottom,var(--rule) 0 3px,transparent 3px 7px)" }}
                />
                {i === st.lane && (
                  <button
                    onClick={() => open(st)}
                    className={`relative z-[2] bg-raise border rounded-md p-[8px_10px] text-left w-full transition-shadow hover:shadow-card hover:border-accent ${KIND[st.kind]}`}
                  >
                    <span className="block text-[12.3px] font-semibold leading-[1.3]">{st.title}</span>
                    <span className="block font-mono text-[9.5px] text-ink-faint mt-1 leading-[1.45]">{st.sub}</span>
                    {st.branches && (
                      <span className="flex gap-[6px] flex-wrap mt-[7px]">
                        {st.branches.map((b) => <Chip key={b.t} tone={b.k.replace("c-", "")}>{b.t}</Chip>)}
                      </span>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Grid min={248} className="mt-6">
        {[
          ["The loop is the point", "Steps 12 and 14 form a cycle measured today in days per turn. An event bus collapses it: a lab landing in the repository can satisfy a pended criterion without anybody checking a portal."],
          ["Step 3 is the new part", "Everything below step 3 got faster. Step 3 did not previously exist as a machine-readable question at all — which is why CRD, not PAS, is the change that matters."],
          ["Step 10 never moves", "The human gate is not a transitional measure to be automated away in version two. It is where liability, clinical judgement and the audit trail meet."],
          ["Steps 14 and 15 are where the money is", "Pended and denied cases consume far more staff time per case than clean ones. A system that only improves the happy path improves the wrong thing."],
        ].map(([t, b]) => (
          <Card key={t} title={t}><p className="text-ink-soft text-[12.5px] m-0">{b}</p></Card>
        ))}
      </Grid>
    </>
  );
}
