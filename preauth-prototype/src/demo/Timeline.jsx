import React, { useEffect, useRef } from "react";

const DOT = { ok: "bg-ok shadow-[0_0_0_1px_var(--ok)]", warn: "bg-warn shadow-[0_0_0_1px_var(--warn)]", err: "bg-bad shadow-[0_0_0_1px_var(--bad)]", human: "bg-human shadow-[0_0_0_1px_var(--human)]", info: "bg-accent shadow-[0_0_0_1px_var(--accent)]" };

export function Event({ e, last }) {
  const tone = DOT[e.lvl] || DOT.info;
  return (
    <div className="grid grid-cols-[62px_20px_minmax(0,1fr)] gap-x-[10px] pb-[14px] animate-[pop_.28s_ease-out]">
      <div className="font-mono text-[9.5px] text-ink-faint pt-[3px] text-right">{e.ts}</div>
      <div className="relative">
        {!last && <div className="absolute left-1/2 top-3 -bottom-[14px] w-px bg-rule -translate-x-1/2" />}
        <span className={`absolute left-1/2 top-1 w-2 h-2 rounded-full -translate-x-1/2 border-2 border-surface ${tone}`} />
      </div>
      <div>
        <div className={`font-mono text-[9.5px] tracking-[.06em] uppercase ${e.lvl === "human" ? "text-human" : "text-agent"}`}>{e.a}</div>
        <div className="text-[12.6px] leading-[1.5] mt-[2px]">{e.m}</div>
        {e.d && <div className="text-[11.5px] text-ink-faint mt-1 leading-[1.5]">{e.d}</div>}
        {e.art && (
          <pre className="font-mono text-[10.5px] bg-sunken border border-rule-soft rounded p-[7px_9px] mt-[7px] text-ink-soft whitespace-pre-wrap overflow-x-auto leading-[1.55] m-0">
            {e.art}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function Timeline({ events, playing }) {
  const box = useRef(null);
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [events.length]);

  return (
    <div ref={box} className="max-h-[520px] overflow-y-auto pr-[6px]">
      {events.map((e, i) => (
        <Event key={i} e={e} last={i === events.length - 1 && !playing} />
      ))}
      {playing && (
        <div className="grid grid-cols-[62px_20px_minmax(0,1fr)] gap-x-[10px] text-[11.5px] text-ink-faint">
          <div />
          <div />
          <div className="flex items-center gap-[6px]">
            <span className="inline-block w-[9px] h-[9px] border-[1.5px] border-accent border-t-transparent rounded-full animate-spin" />
            working…
          </div>
        </div>
      )}
    </div>
  );
}

export function Facts({ facts, patient, payer }) {
  const base = [["Patient", `${patient.name} · ${patient.age}${patient.sex}`], ["MRN", patient.mrn], ["Payer", payer.short]];
  return (
    <div className="bg-sunken border border-rule-soft rounded-lg p-[14px_16px] self-start sticky top-0">
      <h4 className="kick m-0 mb-[11px]">Case facts, as the agents establish them</h4>
      {[...base, ...facts].map((f) => (
        <div key={f[0]} className="grid grid-cols-[90px_minmax(0,1fr)] gap-2 py-[6px] border-b border-rule-soft last:border-b-0 text-xs leading-[1.45]">
          <div className="font-mono text-[9.5px] text-ink-faint pt-[2px]">{f[0]}</div>
          <div className="text-ink">{f[1]}</div>
        </div>
      ))}
      {facts.length === 0 && (
        <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-2 py-[6px] text-xs">
          <div className="font-mono text-[9.5px] text-ink-faint">…</div>
          <div className="text-ink-faint italic">nothing established yet</div>
        </div>
      )}
      <div className="text-[11px] text-ink-faint mt-3 leading-[1.5]">
        Each row was written by an agent step and is traceable back to it in the activity log.
      </div>
    </div>
  );
}
