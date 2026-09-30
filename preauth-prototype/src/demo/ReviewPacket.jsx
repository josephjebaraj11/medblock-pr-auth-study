import React, { useState } from "react";
import { DB, pct, confTone } from "../data/index.js";
import { Card, Chip, Bar, Btn, GatedBtn } from "../components/ui.jsx";

const VERDICT = { met: ["MET", "ok"], partial: ["PARTIAL", "warn"], gap: ["GAP", "bad"] };
const SRC = { auto: ["AUTOFILLED", "ok"], gap: ["NO EVIDENCE", "bad"], blank: ["LEFT BLANK", "warn"] };

function Criterion({ cr, policyCriterion }) {
  const [open, setOpen] = useState(cr.verdict !== "met");
  const [label, tone] = VERDICT[cr.verdict];
  return (
    <div className="border border-rule rounded-[7px] mb-[10px] bg-raise overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex gap-3 items-start p-[12px_14px] w-full text-left hover:bg-sunken">
        <span className="font-mono text-[9.5px] text-ink-faint flex-none pt-[3px]">{cr.id}</span>
        <span className="text-[12.8px] font-semibold leading-[1.4] flex-1">{policyCriterion?.text}</span>
        <span className="flex-none text-right min-w-[104px]">
          <Chip tone={tone}>{label}</Chip>
          <div className="font-mono text-[9.5px] text-ink-faint mt-[5px]">conf {pct(cr.conf)}</div>
        </span>
      </button>
      {open && (
        <div className="px-[14px] pb-[13px] border-t border-rule-soft">
          <div className="font-mono text-[9.5px] text-ink-faint pt-[11px] pb-1">
            evidence the policy asks for: {policyCriterion?.need}
          </div>
          {cr.ev.map((id) => {
            const e = DB.evById[id];
            if (!e) return null;
            return (
              <div key={id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-[10px] py-[9px] border-b border-rule-soft last:border-b-0 text-xs leading-[1.5]">
                <div className="font-mono text-[9px] tracking-[.08em] uppercase text-accent-ink pt-[3px] whitespace-nowrap">{e.type}</div>
                <div>
                  <b className="block font-semibold text-[12.2px]">{e.title}</b>
                  <span className="text-[11.5px] text-ink-faint"> · {e.date} · {e.author}</span>
                  <div className="text-ink-soft mt-[3px] border-l-2 border-rule pl-[9px]">{e.snippet}</div>
                  <div className="font-mono text-[9.5px] text-ink-faint mt-1">
                    {e.source} · {e.ref}
                    {e.lateArrival && <span className="text-warn"> · arrived after the original submission</span>}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="text-xs text-ink-soft bg-sunken rounded-[5px] p-[9px_11px] mt-[10px] leading-[1.5]">
            <b className="block font-mono text-[9px] tracking-[.12em] uppercase text-ink-faint mb-1 font-normal">Why the agent scored it this way</b>
            {cr.rationale}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPacket({ R, policy, btnLabel, onApprove, onReject, allowed, reason, log }) {
  return (
    <>
      <div className="grid gap-[14px] mb-[18px]" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
        <Card title="Packet ready for review">
          <p className="text-ink-soft text-[12.5px] mb-3">
            Assembled by the agents against <b>{policy.ref} {policy.rev}</b> — {policy.title}. Nothing has been
            sent. Expand any criterion to see the exact evidence behind the verdict.
          </p>
          <div className="kick">Packet confidence</div>
          <div className="flex gap-3 items-baseline">
            <div className="text-[26px] font-bold tracking-[-.03em]">{pct(R.conf)}</div>
            <div className="text-[12px] text-ink-soft">{R.confLabel}</div>
          </div>
          <Bar value={R.conf} tone={confTone(R.conf)} />
        </Card>
        <Card title="Submission channel">
          <p className="text-ink-soft text-[12.5px] mb-[10px]">{R.channel}</p>
          <div className="text-[11.5px] text-ink-faint leading-[1.6]">
            Chosen by the connector from the payer&rsquo;s capability tier. The agents behave identically on all three.
          </div>
        </Card>
      </div>

      {R.gaps?.length > 0 && (
        <div className="bg-warn-wash border border-warn rounded-[7px] p-[13px_15px] mb-[14px]">
          <h4 className="kick text-warn m-0 mb-[9px] font-semibold">Flagged before you approve</h4>
          <ul className="m-0 pl-[17px] text-[12.3px] text-ink-soft leading-[1.55] space-y-1 marker:text-warn">
            {R.gaps.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </div>
      )}

      <div className="kick mb-2">Medical-necessity criteria, with the evidence behind each</div>
      {R.criteria.map((cr) => (
        <Criterion key={cr.id} cr={cr} policyCriterion={policy.criteria.find((x) => x.id === cr.id)} />
      ))}

      <div className="kick mt-[22px] mb-2">Payer questionnaire — autofilled by the platform</div>
      <div className="card p-[6px_18px_12px]">
        {R.qs.map((q, i) => {
          const [tag, tone] = SRC[q.src] || SRC.blank;
          return (
            <div key={i} className="grid gap-[10px] py-[9px] border-b border-rule-soft last:border-b-0 text-[12.2px] leading-[1.5]" style={{ gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)" }}>
              <div className="text-ink-soft">{q.q}</div>
              <div className="font-semibold flex gap-[7px] items-baseline flex-wrap">
                {q.a || <span className="text-ink-faint font-normal">— not answered —</span>}
                <Chip tone={tone}>{tag}</Chip>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-[10px] items-center flex-wrap border-t border-rule pt-[15px] mt-[18px]">
        <GatedBtn allowed={allowed} reason={reason} onClick={onApprove}>{btnLabel}</GatedBtn>
        <Btn variant="ghost" onClick={onReject}>Reject &amp; return to queue</Btn>
        {allowed && (
          <span className="text-[11.8px] text-ink-faint flex-1 min-w-[200px]">
            {R.hint || "Approving records your identity, the timestamp and a hash of this exact packet in the audit log. This gate does not move."}
          </span>
        )}
      </div>
      {log}
    </>
  );
}
