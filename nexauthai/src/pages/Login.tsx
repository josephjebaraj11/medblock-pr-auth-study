/**
 * Role switcher.
 *
 * Not an authentication screen — there is no password and no token. Picking
 * a role sets the active demo user so the rest of the app can render from
 * that role's scopes.
 */

import { ArrowRight, Moon, ShieldCheck, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui";
import { useSession } from "@/lib/session";
import { demoUserByRole, roles, store } from "@/mocks";
import type { RoleId } from "@/types";

const SIDE_LABEL: Record<string, string> = {
  provider: "Provider side",
  payer: "Payer side",
  patient: "Patient",
  platform: "Platform",
};

const SIDE_TONE = {
  provider: "brand",
  payer: "aqua",
  patient: "accent",
  platform: "neutral",
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
        <div className="mb-10 flex items-start justify-between gap-4">
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
              A clickable prototype. Choose a role to see the product from that
              person's side of the transaction — there is no sign-in, and every
              record is synthetic.
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

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
          Choose a role
        </h2>

        <ul className="grid gap-3 sm:grid-cols-2">
          {roles.map((role) => {
            const user = store.users.find((u) => u.id === demoUserByRole[role.id]);
            return (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => choose(role.id)}
                  className="group flex h-full w-full flex-col rounded-xl border border-line bg-surface-raised p-4 text-left shadow-soft transition-colors hover:border-brand-400 hover:bg-tint-brand/40"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-content">{role.label}</span>
                    <Badge tone={SIDE_TONE[role.side]}>{SIDE_LABEL[role.side]}</Badge>
                  </div>

                  <p className="flex-1 text-xs leading-relaxed text-content-secondary">
                    {role.description}
                  </p>

                  {role.canMakeClinicalDetermination && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-tint-accent-on">
                      <ShieldCheck size={13} />
                      Licensed — may issue a determination
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-line-subtle pt-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="grid h-6 w-6 place-items-center rounded-full bg-aqua-600 text-[10px] font-semibold text-white"
                        aria-hidden
                      >
                        {user?.initials}
                      </span>
                      <span className="text-xs text-content-muted">
                        {user?.name} · {user?.title}
                      </span>
                    </span>
                    <ArrowRight
                      size={15}
                      className="text-content-muted transition-transform group-hover:translate-x-0.5"
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
            prototype is invented. The payer-side roles are an assumption — the
            source material this was built from is entirely provider-side. See{" "}
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
