import React, { useState } from "react";
import { DB } from "../data/index.js";
import { Btn, Chip, Note, Section } from "../components/ui.jsx";
import { usePanel, Dl, Ul } from "../components/Panel.jsx";

const LINKS = ["SMART launch · CDS Hooks · HTTPS", "tool calls · event bus", "platform APIs only — every read audited", "FHIR · X12 · portal automation"];
const TONE = { "tone-platform": "bg-accent-wash border-accent", "tone-agent": "bg-agent-wash border-agent", "": "bg-surface border-rule" };

/* Layer 3 and 4 components map onto the build sheet on the Platform Core
   screen. Keeping the mapping here rather than in arch.json means the two
   screens can be read independently and still agree on what is being built. */
const BUILDS = {
  "c-cdr": "cc-store", "c-term": "cc-term", "c-forms": "cc-forms", "c-rules": "cc-rules",
  "c-identity": "cc-shell", "c-audit": "cc-shell", "c-bus": "cc-out",
  "c-fhirgw": "cc-out", "c-ehrconn": "cc-catalog", "c-payerconn": "cc-payeredge", "c-ocr": "cc-writeback",
};

export default function Architecture({ onRoute }) {
  const panel = usePanel();
  const [sel, setSel] = useState(null);

  const openComp = (c, layer) => {
    setSel(c.id);
    const built = BUILDS[c.id] && DB.coreById[BUILDS[c.id]];
    panel.open(
      c.name,
      c.sub,
      <Dl
        items={[
          ["Layer", `${layer.n} · ${layer.name}`],
          ...(built
            ? [[
                "We build this",
                <>
                  <div className="text-ink">
                    Component <b>{built.n} · {built.name}</b> on the build sheet — {built.decide}, {built.phase}, {built.effort}.
                  </div>
                  {onRoute && (
                    <Btn variant="ghost" size="sm" className="mt-[10px]" onClick={() => { panel.close(); onRoute("core"); }}>
                      Open the build sheet &rarr;
                    </Btn>
                  )}
                </>,
              ]]
            : []),
          ["Purpose", c.purpose],
          ["Inputs", <Ul items={c.inputs} />],
          ["Outputs", <Ul items={c.outputs} />],
          ["Protocols & standards", <div className="flex flex-wrap gap-[5px]">{c.protocols.map((p) => <Chip key={p} tone="acc">{p}</Chip>)}</div>],
          ["In production", c.prod],
          ["In this prototype", <><Chip tone="warn">MOCKED</Chip> <span className="ml-2">No network call is made. Behaviour is scripted from local JSON.</span></>],
        ]}
      />
    );
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-[18px]">
        <Note className="flex-1 min-w-[38ch]">
        Click any component. The panel gives its purpose, what goes in and out, the protocols it speaks, and
        what is mocked in this prototype versus what would be real. Components with a{" "}
        <b className="text-accent-ink">left bar</b> are platform or orchestration primitives — build those
        before the workflow. A dot marks everything simulated here, which is all of it. Components in bands
        03 and 04 name the build-sheet component they correspond to.
        </Note>
        {onRoute && (
          <Btn variant="ghost" size="sm" className="flex-none" onClick={() => onRoute("core")}>
            What we build ourselves &rarr;
          </Btn>
        )}
      </div>

      <div className="flex flex-col">
        {DB.arch.map((L, i) => (
          <React.Fragment key={L.id}>
            {i > 0 && (
              <div className="h-[26px] relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-rule -translate-x-1/2" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper px-[10px] font-mono text-[9.5px] tracking-[.1em] text-ink-faint whitespace-nowrap">
                  {LINKS[i - 1]}
                </span>
              </div>
            )}
            <div className={`border rounded-lg p-[14px_16px] ${TONE[L.tone || ""]}`}>
              <div className="flex items-baseline gap-[10px] mb-[11px] flex-wrap">
                <span className="kick">{L.n}</span>
                <h3 className="text-[13.5px] font-semibold">{L.name}</h3>
                <span className="text-[11.5px] text-ink-faint">{L.desc}</span>
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: L.tone === "tone-platform" ? "repeat(auto-fit,minmax(200px,1fr))" : "repeat(auto-fit,minmax(168px,1fr))" }}
              >
                {L.comps.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openComp(c, L)}
                    className={`bg-raise border rounded-md p-[10px_12px] text-left min-h-[60px] transition-all hover:-translate-y-px hover:shadow-card ${
                      sel === c.id ? "border-accent bg-accent-wash" : "border-rule hover:border-accent"
                    } ${c.core ? "border-l-[2.5px] border-l-accent" : ""}`}
                  >
                    <span className="block text-[12.5px] font-semibold leading-[1.28]">
                      {c.name}
                      <span className="inline-block w-[5px] h-[5px] rounded-full bg-warn ml-[6px] align-middle" />
                    </span>
                    <span className="block font-mono text-[9.5px] text-ink-faint mt-[5px] leading-[1.45]">{c.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <Section n="note" title="The line that matters" >
        <p className="text-ink-soft">
          Layer 3 is the platform. It is not specific to prior authorisation, and nothing in it should be.
          Layer 2 is this workflow. If a capability in layer 2 turns out to be useful to a second workflow —
          referral management, say, or quality measure abstraction — that is the signal it was misplaced and
          belongs in layer 3.
        </p>
        <p className="text-ink-soft">
          The practical test: could you delete the entire agent layer and still have something a customer
          would pay for? If yes, you built a platform. If no, you built an agent with extra steps.
        </p>
        <p className="text-ink-soft">
          Layer 3 is labelled &ldquo;the Medblocks-equivalent layer&rdquo; because that is the shape of the
          thing, not because it is bought. <b className="text-ink">It is built in-house</b> — twelve
          components, a build/adopt/buy call on each, and a forty-week plan. Those are the{" "}
          {onRoute ? (
            <button onClick={() => onRoute("core")} className="text-accent-ink underline underline-offset-2">
              Platform Core
            </button>
          ) : "Platform Core"}{" "}
          and{" "}
          {onRoute ? (
            <button onClick={() => onRoute("plan")} className="text-accent-ink underline underline-offset-2">
              Build Plan
            </button>
          ) : "Build Plan"}{" "}
          screens.
        </p>
      </Section>
    </>
  );
}
