import React from "react";

const TEXT = {
  ok: "text-ok", warn: "text-warn", bad: "text-bad", acc: "text-accent-ink",
  hum: "text-human", ag: "text-agent", f: "text-ink-faint",
};
const FILL = {
  ok: "bg-ok-wash text-ok", warn: "bg-warn-wash text-warn", bad: "bg-bad-wash text-bad",
  acc: "bg-accent-wash text-accent-ink", hum: "bg-human-wash text-human",
  ag: "bg-agent-wash text-agent", f: "bg-sunken text-ink-faint",
};
const BARC = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", acc: "bg-accent" };
export const BORDER = {
  ok: "border-ok", warn: "border-warn", bad: "border-bad", acc: "border-accent",
  hum: "border-human", ag: "border-agent", f: "border-rule",
};

export const Chip = ({ tone = "f", fill = false, children, className = "" }) => (
  <span className={`${fill ? "chip-fill " + FILL[tone] : "chip " + TEXT[tone]} ${className}`}>{children}</span>
);

export const Card = ({ title, tone, children, className = "", as: As = "div", ...rest }) => (
  <As className={`card ${tone ? BORDER[tone] : ""} ${className}`} {...rest}>
    {title && <h3 className="card-h">{title}</h3>}
    {children}
  </As>
);

export const Section = ({ n, title, right, children }) => (
  <section className="mb-9">
    <div className="sech">
      {n && <span className="sn">{n}</span>}
      <h2>{title}</h2>
      <div className="flex-1" />
      {right}
    </div>
    {children}
  </section>
);

export const Note = ({ children, className = "" }) => <div className={`note ${className}`}>{children}</div>;

export const WarnBox = ({ label, children, className = "" }) => (
  <div className={`warnbox ${className}`}>
    {label && <b className="t">{label}</b>}
    {children}
  </div>
);

export const Bar = ({ value, tone = "acc" }) => (
  <div className="bar">
    <i className={BARC[tone]} style={{ width: `${Math.round(value * 100)}%` }} />
  </div>
);

export const Kpi = ({ label, value, arrow, detail, bar }) => (
  <div className="card">
    <div className="kick mb-[9px] leading-[1.5]">{label}</div>
    <div className="text-[27px] font-bold tracking-[-.035em] leading-none tabular-nums">{value}</div>
    {arrow && <div className="font-mono text-[12.5px] text-ink-faint mt-[7px]">{arrow}</div>}
    {bar != null && <Bar value={bar} tone="ok" />}
    {detail && <div className="text-xs text-ink-soft mt-2 leading-[1.45]">{detail}</div>}
  </div>
);

export const Table = ({ head, children, minWidth = 640 }) => (
  <div className="overflow-x-auto border border-rule rounded-lg bg-surface">
    <table className="tbl" style={{ minWidth }}>
      <thead>
        <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Avatar = ({ initials, tone = "acc", size = 28 }) => (
  <span
    className={`grid place-items-center rounded-md font-mono font-bold flex-none ${FILL[tone]}`}
    style={{ width: size, height: size, fontSize: size * 0.39 }}
  >
    {initials}
  </span>
);

export const Btn = ({ variant = "primary", size, className = "", ...rest }) => (
  <button
    className={`btn ${variant === "ghost" ? "btn-ghost" : ""} ${size === "sm" ? "btn-sm" : ""} ${className}`}
    {...rest}
  />
);

export const Grid = ({ min = 248, className = "", children }) => (
  <div className={`grid gap-[14px] ${className}`} style={{ gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))` }}>
    {children}
  </div>
);

/* A permission-aware action. Renders the button disabled with the reason
   attached when the signed-in role is not allowed to take it — the gate is
   visible rather than hidden, which is the whole point of showing roles. */
export const GatedBtn = ({ allowed, reason, children, ...rest }) => (
  <div className="flex items-center gap-3 flex-wrap">
    <Btn disabled={!allowed} title={allowed ? undefined : reason} {...rest}>
      {children}
    </Btn>
    {!allowed && (
      <span className="text-[11.8px] text-bad max-w-[46ch] leading-[1.45]">
        <b className="font-mono text-[9.5px] tracking-[.12em] uppercase">Blocked · </b>
        {reason}
      </span>
    )}
  </div>
);
