import React from "react";
import { Btn, Chip, GatedBtn, WarnBox, Card } from "../components/ui.jsx";

const TONE = { approved: "bg-ok-wash border-ok", pended: "bg-warn-wash border-warn", denied: "bg-bad-wash border-bad" };

export function Outcome({ O, nextLabel, nextSub, onNext, onBack, log }) {
  return (
    <>
      <div className={`rounded-lg p-[20px_22px] border mb-4 ${TONE[O.kind]}`}>
        <div className="flex gap-3 items-baseline flex-wrap">
          <h3 className="text-base font-bold">{O.title}</h3>
          {O.auth && <Chip tone={O.kind === "approved" ? "ok" : "warn"}>{O.auth}</Chip>}
        </div>
        <p className="text-ink-soft text-[12.5px] mt-[10px] mb-0 max-w-[76ch]">{O.body}</p>
        <div className="font-mono text-[11px] text-ink-soft leading-[1.8] mt-3">
          {O.meta.map((m) => <div key={m}>{m}</div>)}
        </div>
      </div>
      <WarnBox label="Simulated" className="mb-4">{O.note}</WarnBox>
      <div className="flex gap-[10px] items-center flex-wrap border-t border-rule pt-[15px]">
        {onNext ? (
          <>
            <Btn onClick={onNext}>{nextLabel} &rarr;</Btn>
            <span className="text-[11.8px] text-ink-faint flex-1 min-w-[200px]">{nextSub}</span>
          </>
        ) : (
          <>
            <Btn variant="ghost" onClick={onBack}>Back to the queue</Btn>
            <span className="text-[11.8px] text-ink-faint flex-1 min-w-[200px]">
              Run another scenario to see a different payer tier — switch organisation from the account menu.
            </span>
          </>
        )}
      </div>
      {log}
    </>
  );
}

export function AppealLetter({ letter, onSign, onBack, allowed, reason, log }) {
  return (
    <>
      <div className="grid gap-[14px] mb-4" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
        <Card title="What the agent could answer">
          <p className="text-ink-soft text-[12.5px] m-0">
            Two of the four criteria are now answerable with evidence that exists — one produced after
            submission, one that was always there but sat in a system the surgical practice is not connected to.
          </p>
        </Card>
        <Card tone="warn" title="What it would not argue">
          <p className="text-ink-soft text-[12.5px] m-0">
            C1 is genuinely short: fourteen weeks of documented conservative care against a six-month
            requirement. The letter concedes it and argues the policy&rsquo;s own exception clause instead, because a
            letter that overclaims is worse than one that concedes.
          </p>
        </Card>
      </div>
      <div className="kick mb-2">Draft appeal letter — generated from the record, for a clinician to edit and sign</div>
      <div className="bg-raise border border-rule rounded-[7px] p-[22px_26px] text-[12.6px] leading-[1.72] whitespace-pre-wrap max-h-[400px] overflow-y-auto max-w-[82ch] font-serif">
        {letter}
      </div>
      <div className="flex gap-[10px] items-center flex-wrap border-t border-rule pt-[15px] mt-[18px]">
        <GatedBtn allowed={allowed} reason={reason} onClick={onSign}>Sign &amp; file appeal</GatedBtn>
        <Btn variant="ghost" onClick={onBack}>Return to queue</Btn>
        {allowed && (
          <span className="text-[11.8px] text-ink-faint flex-1 min-w-[200px]">
            A clinical assertion over a physician&rsquo;s name. No confidence score changes this gate.
          </span>
        )}
      </div>
      {log}
    </>
  );
}
