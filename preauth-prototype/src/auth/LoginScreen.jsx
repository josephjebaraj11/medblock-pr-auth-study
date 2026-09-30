import React, { useState } from "react";
import { DB, ROLES, usersFor } from "../data/index.js";
import { useAuth } from "./AuthContext.jsx";
import { Chip, Avatar, Btn } from "../components/ui.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

const TONE = { coordinator: "acc", clinician: "hum", admin: "ag", observer: "f", operator: "ag" };

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [tenantId, setTenantId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [pw, setPw] = useState("");
  const tenant = tenantId ? DB.tenantById[tenantId] : null;
  const platform = DB.platformOrg;
  const users = tenantId ? usersFor(tenantId) : [];

  const submit = (e) => {
    e.preventDefault();
    if (userId) signIn(userId, { method: "password" });
  };

  /* SMART on FHIR launch: the EHR hands you the user and the patient. There is
     no tenant picker in this path, because the launching system is the tenant. */
  const smartLaunch = () => {
    signIn("u-halvorsen", {
      method: "smart-launch",
      launchContext: {
        iss: "https://fhir.springfieldhp.example/r4",
        patientId: "pt-1",
        encounterId: "enc-4471",
        caseId: "PA-2026-0458",
        scopes: "launch patient/*.rs user/Practitioner.r openid fhirUser",
      },
    });
  };

  return (
    <div className="min-h-full grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      {/* ---- left: what this is ---- */}
      <div className="bg-surface border-r border-rule p-8 lg:p-12 flex flex-col">
        <div className="flex-1 flex flex-col justify-center max-w-[62ch]">
          <div className="text-[19px] font-bold tracking-[-.025em]">Agentic Prior Authorization</div>
          <div className="kick mt-[6px]">on a Medblocks-style clinical data platform</div>

          <div className="mt-9 max-w-[56ch]">
            <h1 className="text-[26px] font-bold tracking-[-.03em] leading-[1.15] mb-4">
              Prior authorisation is the first workflow. The platform underneath it is the product.
            </h1>
            <p className="text-ink-soft mb-3">
              Sign in as one of three provider organisations. Each is a separate tenant with its own
              connections, payer contracts, policy pack, case queue and agent memory. Nothing crosses
              between them.
            </p>
            <p className="text-ink-soft">
              Your <b>role</b> decides what you can do once inside. A coordinator can approve a packet for
              submission; only a clinician can sign an appeal; an administrator can do neither. Those gates
              are the design, not a permissions afterthought — and you can watch them block you.
            </p>
          </div>

          <div className="warnbox mt-8 max-w-[62ch]">
            <b className="t">Mock authentication</b>
            No credentials are checked, no password is sent anywhere, there is no token and no backend.
            Any password works, or leave it blank. In production this is OIDC against each tenant&rsquo;s own
            identity provider, or a SMART on FHIR launch from the EHR, with SMART scopes gating every read.
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 mt-10 flex-wrap flex-none">
          <div className="font-mono text-[10px] text-ink-faint leading-[1.7]">
            PROTOTYPE · MOCK DATA
            <br />
            No real patient, provider or payer data. All figures illustrative.
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- right: the form ---- */}
      <div className="p-8 lg:p-10 flex items-center">
        <form onSubmit={submit} className="w-full max-w-[440px] mx-auto">
          {!tenantId ? (
            <>
              <div className="kick mb-3">Step 1 of 2 · choose an organisation</div>
              <div className="grid gap-[10px]">
                {DB.tenants.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTenantId(t.id)}
                    className="card text-left hover:border-accent hover:shadow-card transition-all hover:-translate-y-px"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar initials={t.initials} size={34} />
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold leading-tight">{t.name}</div>
                        <div className="font-mono text-[9.5px] text-ink-faint mt-[5px]">
                          {t.type} · {t.ehr} · {t.caseIds.length} open cases
                        </div>
                        <div className="text-[11.8px] text-ink-soft mt-2 leading-[1.45]">{t.blurb}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px bg-rule flex-1" />
                <span className="kick">or</span>
                <div className="h-px bg-rule flex-1" />
              </div>

              <button type="button" onClick={smartLaunch} className="card w-full text-left hover:border-accent hover:shadow-card transition-all">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="text-[13px] font-semibold">Launch from the EHR</span>
                  <Chip tone="acc">SMART ON FHIR</Chip>
                </div>
                <div className="text-[11.8px] text-ink-soft mt-2 leading-[1.45]">
                  Simulates a clinician opening the app from inside the chart. The EHR supplies the user, the
                  patient and the encounter — there is no tenant picker, because the launching system is the
                  tenant.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTenantId(platform.id)}
                className="card w-full text-left mt-[10px] hover:border-accent hover:shadow-card transition-all"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="text-[13px] font-semibold">Sign in as the platform operator</span>
                  <Chip tone="ag">VENDOR</Chip>
                </div>
                <div className="text-[11.8px] text-ink-soft mt-2 leading-[1.45]">
                  Not a customer. The organisation that builds and runs the platform underneath all three
                  tenants — connector registry, connection health and pull telemetry across every one of them,
                  and no clinical content in any of them.
                </div>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setTenantId(null); setUserId(null); }} className="font-mono text-[10px] text-ink-faint hover:text-ink mb-3">
                &larr; change organisation
              </button>
              <div className="flex items-center gap-3 mb-5">
                <Avatar initials={tenant.initials} size={34} />
                <div>
                  <div className="text-[14px] font-semibold leading-tight">{tenant.name}</div>
                  <div className="font-mono text-[9.5px] text-ink-faint mt-1">{tenant.type}</div>
                </div>
              </div>

              <div className="kick mb-3">Step 2 of 2 · sign in as</div>
              <div className="grid gap-[6px] mb-5">
                {users.map((u) => {
                  const r = ROLES[u.role];
                  const on = userId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUserId(u.id)}
                      className={`flex items-center gap-3 text-left rounded-md border p-[10px_12px] transition-colors ${
                        on ? "border-accent bg-accent-wash" : "border-rule bg-surface hover:bg-sunken"
                      }`}
                    >
                      <Avatar initials={u.initials} tone={TONE[u.role]} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.8px] font-semibold leading-tight">{u.name}</div>
                        <div className="font-mono text-[9.5px] text-ink-faint mt-[3px]">{u.title}</div>
                      </div>
                      <Chip tone={TONE[u.role]}>{r.label}</Chip>
                    </button>
                  );
                })}
              </div>

              <label className="kick block mb-[6px]">Password</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="anything at all — nothing is checked"
                className="field mb-4"
              />
              <Btn type="submit" disabled={!userId} className="w-full">
                Sign in
              </Btn>
              <div className="text-[11px] text-ink-faint mt-3 leading-[1.5]">
                You can switch user at any time from the account menu without signing out — the gates are
                easier to demonstrate that way.
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
