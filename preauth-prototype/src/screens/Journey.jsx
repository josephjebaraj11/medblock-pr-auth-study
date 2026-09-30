import React, { useState } from "react";
import { DB } from "../data/index.js";
import { Card, Chip, Grid } from "../components/ui.jsx";

export default function Journey() {
  const [tab, setTab] = useState(0);
  const p = DB.journey[tab];

  return (
    <>
      <div className="flex gap-1 border-b border-rule mb-[18px] flex-wrap">
        {DB.journey.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setTab(i)}
            className={`bg-transparent border-0 border-b-2 px-[14px] py-[9px] text-[13px] font-medium -mb-px ${
              i === tab ? "text-accent-ink border-accent" : "text-ink-faint border-transparent hover:text-ink"
            }`}
          >
            {x.name}
          </button>
        ))}
      </div>

      <Card className="mb-[18px]">
        <div className="flex gap-[18px] flex-wrap items-baseline">
          <div>
            <h3 className="text-[14.5px] font-semibold m-0">{p.name}</h3>
            <div className="font-mono text-[9.5px] text-ink-faint mt-1">{p.who}</div>
          </div>
          <div className="flex-1" />
          <Chip tone="acc">{p.tag}</Chip>
        </div>
      </Card>

      <div className="card p-[0_20px]">
        {p.stages.map((s) => (
          <div key={s.s} className="grid grid-cols-[150px_minmax(0,1fr)] border-b border-rule-soft last:border-b-0">
            <div className="p-[15px_16px_15px_0] border-r border-rule-soft">
              <div className="text-[13px] font-semibold leading-[1.3]">{s.s}</div>
              <div className="font-mono text-[9.5px] text-ink-faint mt-[6px] leading-[1.6]">{s.touch}</div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
              {[["Does today", s.act, "text-ink-soft"], ["What hurts", s.pain, "text-bad"], ["With the agentic system", s.after, "text-ok"]].map(
                ([h, body, cls], i) => (
                  <div key={h} className={`p-[15px_16px] ${i ? "border-l border-rule-soft" : ""}`}>
                    <h5 className="kick m-0 mb-[7px]">{h}</h5>
                    <p className={`m-0 text-[12.3px] leading-[1.5] max-w-none ${cls}`}>{body}</p>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <Grid min={248} className="mt-6">
        {[
          ["Read the middle column first", "The pain column is the product requirement. The right-hand column is a claim, and every one of those claims is a thing the demo either shows or does not."],
          ["The patient column is the one that gets cut", "In most review decks the patient journey is decoration. It is the only column where the benefit is clinical rather than operational, and the only one a regulator will ask about."],
          ["Nothing here removes a person", "The coordinator role does not disappear. It moves from retrieval and transcription — which software is good at — to judgement and exception handling, which it is not."],
        ].map(([t, b]) => (
          <Card key={t} title={t}><p className="text-ink-soft text-[12.5px] m-0">{b}</p></Card>
        ))}
      </Grid>
    </>
  );
}
