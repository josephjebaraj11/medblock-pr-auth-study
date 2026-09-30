import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);
export const usePanel = () => useContext(Ctx);

export function PanelProvider({ children }) {
  const [p, setP] = useState(null);
  const close = useCallback(() => setP(null), []);
  const open = useCallback((title, sub, body) => setP({ title, sub, body }), []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <Ctx.Provider value={{ open, close, isOpen: !!p }}>
      {children}
      <aside
        className={`fixed top-0 right-0 h-screen w-[400px] max-w-[92vw] bg-surface border-l border-rule z-50 overflow-y-auto transition-transform duration-200 ${
          p ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ boxShadow: p ? "-12px 0 40px rgba(0,0,0,.14)" : "none" }}
        aria-hidden={!p}
      >
        {p && (
          <>
            <div className="sticky top-0 bg-surface border-b border-rule p-[16px_20px] flex justify-between gap-3 items-start">
              <div>
                <h3 className="text-[15px] font-semibold leading-tight">{p.title}</h3>
                {p.sub && <div className="font-mono text-[10px] text-ink-faint mt-1">{p.sub}</div>}
              </div>
              <button onClick={close} className="text-xl text-ink-faint hover:text-ink leading-none px-[2px]" aria-label="Close">
                &times;
              </button>
            </div>
            <div className="p-[18px_20px_60px]">{p.body}</div>
          </>
        )}
      </aside>
    </Ctx.Provider>
  );
}

export const Dl = ({ items }) => (
  <dl className="m-0">
    {items.map(([k, v]) => (
      <React.Fragment key={k}>
        <dt className="dt">{k}</dt>
        <dd className="dd">{v}</dd>
      </React.Fragment>
    ))}
  </dl>
);

export const Ul = ({ items }) => (
  <ul className="m-0 pl-4 space-y-1">
    {items.map((x, i) => (
      <li key={i} className="marker:text-accent">{x}</li>
    ))}
  </ul>
);
