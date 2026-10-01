/**
 * Persona switcher.
 *
 * Not an authentication screen — there is no password and no token. Picking
 * a persona sets the active demo user so the rest of the app can render from
 * that persona's scopes.
 *
 * The statement above the cards is the one thing worth reading here: all
 * three of these land in the *same* application. Nothing below forks the
 * build, the deployment or the URL.
 */

import { ArrowRight, Building2, Layers, Moon, ShieldCheck, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui";
import { useSession } from "@/lib/session";
import { demoUserByRole, roles, store, tenants } from "@/mocks";
import type { RoleId } from "@/types";

const SIDE_LABEL: Record<string, string> = {
  operations: "Operations",
  clinical: "Licensed clinical",
  admin: "Admin · tenant + platform",
};

const SIDE_TONE = {
  operations: "brand",
  clinical: "accent",
  admin: "neutral",
} as const;

export default function Login() {
  const { signIn, theme, toggleTheme } = useSession();
  const navigate = useNavigate();

  const choose = (id: RoleId) => {
    signIn(id);
    navigate(roles.find((r) => r.id === id)!.landingPath);
  };

  return (
    <div className="min-h-screen bg-surface-subtle">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white"
                aria-hidden
              >
                NA
              </span>
              <span className="type-display text-xl font-semibold text-content">NexAuthAI</span>
            </div>
            <h1 className="type-display max-w-xl text-3xl font-semibold leading-tight text-content sm:text-4xl">
              AI-assisted prior authorization, from order to decision
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-content-secondary">
              A clickable prototype. Choose a persona to see the product through
              that person's scopes — there is no sign-in, and every record is
              synthetic.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-line bg-surface-raised p-2 text-content-secondary hover:bg-surface-inset"
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {/* The claim this whole design rests on. */}
        <div className="mb-8 rounded-xl border border-brand-300 bg-tint-brand px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-tint-brand-on">
            <Layers size={16} aria-hidden />
            One portal — every tenant, every persona
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-tint-brand-on/90">
            There is a <strong>single application</strong>. All{" "}
            {tenants.length} practices below and all three personas sign into
            the same portal at the same address — no separate build per
            customer, no separate app per role, no separate operator console.
            A token carries a tenant and a set of scopes:{" "}
            <strong>the tenant decides whose data you see</strong>, the{" "}
            <strong>scopes decide what you may do with it</strong>, and both are
            checked again server-side on every request.
          </p>
          <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-tint-brand-on/80">
            <Building2 size={13} aria-hidden />
            {tenants.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-surface-raised/60 px-2 py-0.5 font-medium"
              >
                {t.name}
                {t.deploymentMode !== "multi-tenant" && ` · ${t.deploymentMode}`}
              </span>
            ))}
          </p>
        </div>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
          Choose a persona
        </h2>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const user = store.users.find((u) => u.id === demoUserByRole[role.id]);
            return (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => choose(role.id)}
                  className="group flex h-full w-full flex-col rounded-xl border border-line bg-surface-raised p-4 text-left shadow-soft transition-colors hover:border-brand-400 hover:bg-tint-brand/40"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-content">{role.label}</span>
                    <Badge tone={SIDE_TONE[role.side]}>{SIDE_LABEL[role.side]}</Badge>
                  </div>

                  <p className="flex-1 text-xs leading-relaxed text-content-secondary">
                    {role.description}
                  </p>

                  {role.canMakeClinicalDetermination && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-tint-accent-on">
                      <ShieldCheck size={13} />
                      Licensed — the only persona that makes medical calls
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-subtle pt-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-aqua-600 text-[10px] font-semibold text-white"
                        aria-hidden
                      >
                        {user?.initials}
                      </span>
                      <span className="truncate text-xs text-content-muted">
                        {user?.name} · {user?.title}
                      </span>
                    </span>
                    <ArrowRight
                      size={15}
                      className="shrink-0 text-content-muted transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 rounded-xl border border-line bg-surface-inset px-4 py-3.5">
          <p className="text-xs leading-relaxed text-content-secondary">
            <span className="font-semibold text-content">No real patient data.</span>{" "}
            Every patient, member ID, NPI, payer policy and clinical note in this
            prototype is invented. Payers are counterparties reached through
            connectors, not tenants — so there is no payer seat here. See{" "}
            <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
              docs/00-source-analysis.md
            </code>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
