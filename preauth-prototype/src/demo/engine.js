import { useCallback, useEffect, useRef, useState } from "react";
import { DB } from "../data/index.js";

export const PLAYING = { run: 1, submit: 1, rfi: 1, rfiSubmit: 1, appeal: 1, appealSubmit: 1 };
export const NEXT = { run: "review", submit: "result", rfi: "review2", rfiSubmit: "result2", appeal: "letter", appealSubmit: "result3" };
export const SCRIPT_OF = { run: "run", submit: "submit", rfi: "rfi", rfiSubmit: "rfiSubmit", appeal: "appeal", appealSubmit: "appealSubmit" };
export const CHAIN = {
  approved: ["run", "review", "submit", "result"],
  pended: ["run", "review", "submit", "result", "rfi", "review2", "rfiSubmit", "result2"],
  denied: ["run", "review", "submit", "result", "appeal", "letter", "appealSubmit", "result3"],
};

export const fmtClock = (ms) => {
  const t = ms / 1000;
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};

const EMPTY = { sk: null, active: null, stage: "idle", events: [], facts: [], clock: 0 };

/* Applies one scripted event: appends it to the log and upserts any case fact. */
function apply(state, e) {
  const clock = state.clock + e.t;
  const ev = { a: e.a, lvl: e.lvl, m: e.m, d: e.d, art: e.art, ts: fmtClock(clock) };
  let facts = state.facts;
  if (e.fact) {
    const i = facts.findIndex((f) => f[0] === e.fact[0]);
    facts = i >= 0 ? facts.map((f, j) => (j === i ? e.fact : f)) : [...facts, e.fact];
  }
  return { ...state, clock, events: [...state.events, ev], facts };
}

export function useDemoEngine() {
  const [st, setSt] = useState(EMPTY);
  const [speed, setSpeed] = useState(1);
  const [sel, setSel] = useState(null);
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!PLAYING[st.stage] || !st.sk) return;
    const script = DB.scenarios[st.sk][SCRIPT_OF[st.stage]] || [];
    if (idx.current >= script.length) {
      idx.current = 0;
      setSt((s) => ({ ...s, stage: NEXT[s.stage] || s.stage }));
      return;
    }
    const e = script[idx.current];
    timer.current = setTimeout(() => {
      idx.current += 1;
      setSt((s) => apply(s, e));
    }, Math.max(90, e.t / speed));
    return () => clearTimeout(timer.current);
  }, [st, speed]);

  const start = useCallback((sk) => {
    clearTimeout(timer.current);
    idx.current = 0;
    const caseId = DB.scenarios[sk].caseId;
    setSel(caseId);
    setSt({ ...EMPTY, sk, active: caseId, stage: "run" });
  }, []);

  const runPhase = useCallback((stage) => {
    clearTimeout(timer.current);
    idx.current = 0;
    setSt((s) => ({ ...s, stage }));
  }, []);

  const skip = useCallback(() => {
    clearTimeout(timer.current);
    setSt((s) => {
      const script = DB.scenarios[s.sk]?.[SCRIPT_OF[s.stage]] || [];
      let next = s;
      for (let i = idx.current; i < script.length; i++) next = apply(next, script[i]);
      idx.current = 0;
      return { ...next, stage: NEXT[s.stage] || s.stage };
    });
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    idx.current = 0;
    setSt(EMPTY);
  }, []);

  /* Deep link support: replay every earlier phase instantly, then land on `stage`. */
  const jump = useCallback((sk, stage) => {
    const chain = CHAIN[sk];
    if (!chain || chain.indexOf(stage) < 0) return false;
    clearTimeout(timer.current);
    idx.current = 0;
    let s = { ...EMPTY, sk, active: DB.scenarios[sk].caseId };
    for (const phase of chain) {
      if (phase === stage) break;
      (DB.scenarios[sk][SCRIPT_OF[phase]] || []).forEach((e) => (s = apply(s, e)));
    }
    setSel(s.active);
    setSt({ ...s, stage });
    return true;
  }, []);

  return { st, speed, setSpeed, sel, setSel, start, runPhase, skip, reset, jump };
}
