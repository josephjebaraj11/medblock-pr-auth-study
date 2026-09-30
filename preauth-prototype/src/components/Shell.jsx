import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { DB, ROLES, usersFor, casesFor, isPlatformOrg } from "../data/index.js";
import { Avatar, Chip } from "./ui.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const TONE = { coordinator: "acc", clinician: "hum", admin: "ag", observer: "f", operator: "ag" };

/* Nav groups are declared by route id rather than by slice index, because the
   route list is now role-dependent — an operator does not get the case screens. */
const GROUPS = [
  ["The case", ["overview", "arch", "agents", "flow", "journey"]],
  ["The system, working", ["demo", "integr", "tenant"]],
  ["The platform we build", ["core", "plan", "ops"]],
];

function AccountMenu() {
  const { user, tenant, role, signOut, switchUser, signIn, launchContext } = useAuth();
  const [open, setOpen] = useState(false);
  const mates = usersFor(tenant.id).filter((u) => u.id !== user.id);
  const others = DB.orgs.filter((t) => t.id !== tenant.id);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-[10px] bg-surface border border-rule rounded-md pl-2 pr-3 py-[6px] hover:border-accent"
      >
        <Avatar initials={user.initials} tone={TONE[user.role]} size={24} />
        <span className="text-left leading-tight">
          <span className="block text-[12.3px] font-semibold">{user.name}</span>
          <span className="block font-mono text-[9px] text-ink-faint">{role.label}</span>
        </span>
        <span className="text-ink-faint text-[10px]">&#9662;</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+6px)] w-[340px] bg-surface border border-rule rounded-lg shadow-card z-50 overflow-hidden">
            <div className="p-[14px_16px] border-b border-rule">
              <div className="text-[13px] font-semibold">{user.name}</div>
              <div className="font-mono text-[9.5px] text-ink-faint mt-1">{user.email}</div>
              <div className="mt-[10px] flex gap-[6px] flex-wrap">
                <Chip tone={TONE[user.role]}>{role.label}</Chip>
                <Chip tone="f">{tenant.short}</Chip>
                {launchContext && <Chip tone="acc">SMART LAUNCH</Chip>}
              </div>
              <div className="text-[11.5px] text-ink-soft mt-[10px] leading-[1.5]">
                <b className="text-ok">Can:</b> {role.can}
              </div>
              <div className="text-[11.5px] text-ink-soft mt-[6px] leading-[1.5]">
                <b className="text-bad">Cannot:</b> {role.cannot}
              </div>
            </div>

            <div className="p-[10px_10px_6px]">
              <div className="kick px-[6px] pb-[6px]">Switch user · same tenant</div>
              {mates.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { switchUser(u.id); setOpen(false); }}
                  className="w-full flex items-center gap-[10px] text-left rounded px-[6px] py-[7px] hover:bg-sunken"
                >
                  <Avatar initials={u.initials} tone={TONE[u.role]} size={22} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.2px] font-medium leading-tight">{u.name}</span>
                    <span className="block font-mono text-[9px] text-ink-faint mt-[2px]">{ROLES[u.role].label}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="p-[6px_10px_10px] border-t border-rule-soft">
              <div className="kick px-[6px] py-[6px]">Switch organisation</div>
              {others.map((t) => {
                const first = usersFor(t.id)[0];
                return (
                  <button
                    key={t.id}
                    onClick={() => { signIn(first.id, { method: "tenant-switch" }); setOpen(false); }}
                    className="w-full flex items-center gap-[10px] text-left rounded px-[6px] py-[7px] hover:bg-sunken"
                  >
                    <Avatar initials={t.initials} size={22} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.2px] font-medium leading-tight">{t.name}</span>
                      <span className="block font-mono text-[9px] text-ink-faint mt-[2px]">
                        {isPlatformOrg(t) ? "vendor · no cases, no PHI" : `${casesFor(t.id).length} cases`} · signs you in as {first.name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full text-left px-4 py-[11px] border-t border-rule text-[12.5px] font-medium text-bad hover:bg-sunken"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Shell({ routes, route, onRoute, title, sub, topRight, children }) {
  const { tenant } = useAuth();
  const groups = GROUPS
    .map(([label, ids]) => [label, ids.map((id) => routes.find((r) => r.id === id)).filter(Boolean)])
    .filter(([, items]) => items.length);

  return (
    <div className="grid grid-cols-[238px_minmax(0,1fr)] h-screen overflow-hidden">
      <aside className="bg-surface border-r border-rule flex flex-col overflow-y-auto">
        <div className="p-[18px_18px_16px] border-b border-rule">
          <div className="text-[15px] font-bold tracking-[-.025em] leading-tight">Agentic Prior Authorization</div>
          <div className="kick mt-[6px]">on a Medblocks-style platform</div>
        </div>

        <div className="p-[14px_16px] border-b border-rule flex items-center gap-[10px]">
          <Avatar initials={tenant.initials} size={30} />
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold leading-tight truncate">{tenant.short}</div>
            <div className="font-mono text-[9px] text-ink-faint mt-[3px]">
              {isPlatformOrg(tenant) ? "vendor · platform operations" : `${tenant.ehr} · ${casesFor(tenant.id).length} cases`}
            </div>
          </div>
        </div>

        <nav className="p-[10px] flex-1">
          {groups.map(([label, items]) => (
            <div key={label}>
              <div className="kick px-[10px] pt-[14px] pb-[6px]">{label}</div>
              {items.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onRoute(r.id)}
                  className={`flex gap-[11px] items-baseline w-full text-left px-[10px] py-2 rounded-md leading-tight ${
                    route === r.id ? "bg-accent-wash text-accent-ink font-semibold" : "text-ink-soft hover:bg-sunken hover:text-ink"
                  }`}
                >
                  <span className={`font-mono text-[10px] w-[14px] flex-none ${route === r.id ? "text-accent-ink" : "text-ink-faint"}`}>{r.n}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-[14px_16px] border-t border-rule font-mono text-[10px] leading-[1.7] text-ink-faint">
          <span className="inline-block border border-warn text-warn px-[6px] py-[2px] tracking-[.1em] mb-2">PROTOTYPE · MOCK DATA</span>
          <br />
          No real patient, provider or payer data. All figures illustrative.
          <br />
          <span className="inline-block mt-2"><ThemeToggle /></span>
        </div>
      </aside>

      <main className="overflow-y-auto" id="main">
        <div className="sticky top-0 z-20 bg-paper border-b border-rule px-[30px] pt-4 pb-[13px] flex items-end gap-5 justify-between">
          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold">{title}</h1>
            <div className="text-ink-faint text-[12.5px] mt-[3px] max-w-[78ch]">{sub}</div>
          </div>
          <div className="flex items-center gap-3 flex-none">
            {topRight}
            <AccountMenu />
          </div>
        </div>
        <div className="p-[26px_30px_70px] max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
