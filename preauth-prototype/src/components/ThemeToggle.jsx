import React, { useEffect, useState } from "react";

const KEY = "preauth.theme";
const NEXT = { "": "dark", dark: "light", light: "" };
const LABEL = { "": "THEME · SYSTEM", dark: "THEME · DARK", light: "THEME · LIGHT" };

export default function ThemeToggle() {
  const [theme, setTheme] = useState("");

  useEffect(() => {
    let t = "";
    try { t = localStorage.getItem(KEY) || ""; } catch { /* storage blocked */ }
    setTheme(t);
    apply(t);
  }, []);

  const apply = (t) => {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  };

  const cycle = () => {
    const t = NEXT[theme];
    setTheme(t);
    apply(t);
    try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  };

  return (
    <button
      onClick={cycle}
      className="bg-transparent border border-rule text-ink-faint font-mono text-[9.5px] tracking-[.1em] px-2 py-1 rounded cursor-pointer hover:border-accent hover:text-accent-ink"
    >
      {LABEL[theme]}
    </button>
  );
}
