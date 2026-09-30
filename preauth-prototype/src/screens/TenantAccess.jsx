import React from "react";
import { DB, ROLES, PERM, usersFor, casesFor, payersFor } from "../data/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Card, Chip, Grid, Note, Section, Table, Avatar, GatedBtn, Bar } from "../components/ui.jsx";

const TONE = { coordinator: "acc", clinician: "hum", admin: "ag", observer: "f", operator: "ag" };

/* This screen belongs to a provider tenant. The vendor's platform-operator role
   is deliberately absent from the matrix: it is not a role inside a customer
   organisation, and its permissions are not tenant permissions. */
const TENANT_ROLES = Object.values(ROLES).filter((r) => r.id !== "operator");
const TENANT_PERMS = [PERM.VIEW, PERM.WORK, PERM.SUBMIT, PERM.SIGN_APPEAL, PERM.ANSWER_CLINICAL, PERM.MANAGE, PERM.AUDIT];
const STATE = { live: "ok", degraded: "warn", "not connected": "bad" };
const PERM_LABEL = {
  [PERM.VIEW]: "View cases",
  [PERM.WORK]: "Work a case",
  [PERM.SUBMIT]: "Approve & submit a packet",
  [PERM.SIGN_APPEAL]: "Sign an appeal",
  [PERM.ANSWER_CLINICAL]: "Answer clinical questionnaire items",
  [PERM.MANAGE]: "Manage tenant & connections",
  [PERM.AUDIT]: "Read the full audit log",
};

export default function TenantAccess() {
  const { tenant, user, can, switchUser } = useAuth();
  const users = usersFor(tenant.id);
  const cases = casesFor(tenant.id);
  const m = tenant.memory;

  return (
    <>
      <Note className="mb-[18px]">
        Everything on this screen is scoped to <b>{tenant.name}</b>. Switch organisation from the account menu
        and every number, connection and case below changes. Nothing is shared between tenants — not the
        queue, not the policy pack, and above all not the agent memory.
      </Note>

      <Section n="01" title="This tenant">
        <Grid min={248}>
          <Card title={tenant.name}>
            <div className="flex items-start gap-3 mb-3">
              <Avatar initials={tenant.initials} size={38} />
              <div className="font-mono text-[10px] text-ink-faint leading-[1.7]">
                {tenant.type}<br />{tenant.ehr}<br />{tenant.seats} seats · {users.length} users configured
              </div>
            </div>
            <p className="text-ink-soft text-[12.5px] m-0">{tenant.blurb}</p>
          </Card>
          <Card title="Agent memory">
            <div className="text-[27px] font-bold tracking-[-.035em] leading-none tabular-nums">{m.cases.toLocaleString()}</div>
            <div className="font-mono text-[10px] text-ink-faint mt-[7px]">determinations in memory · {m.policies} policy packs</div>
            <div className="mt-3 kick">First-pass approval rate</div>
            <div className="flex items-baseline gap-2">
              <div className="text-[19px] font-bold tabular-nums">{Math.round(m.firstPass * 100)}%</div>
            </div>
            <Bar value={m.firstPass} tone={m.firstPass > 0.8 ? "ok" : m.firstPass > 0.65 ? "warn" : "bad"} />
            <p className="text-ink-soft text-[12px] mt-2 m-0">{m.note}</p>
          </Card>
          <Card title="Capabilities" tone="f">
            <div className="space-y-2">
              {[
                ["Network exchange (TEFCA/QHIN)", tenant.flags.networkExchange, "Finds records at organisations this tenant has no direct connection to."],
                ["Portal automation", tenant.flags.portalAutomation, "Drives a legacy payer's provider portal under supervision."],
                ["Document & OCR ingestion", tenant.flags.ocrIngestion, "Reads faxed and scanned outside records."],
                ["Auto-submit below threshold", tenant.flags.autoSubmit, "Deliberately off everywhere. The human gate is not configurable in this build."],
              ].map(([label, on, why]) => (
                <div key={label} className="flex gap-[10px] items-start">
                  <Chip tone={on ? "ok" : "bad"}>{on ? "on" : "off"}</Chip>
                  <div className="min-w-0">
                    <div className="text-[12.3px] font-medium leading-tight">{label}</div>
                    <div className="text-[11.3px] text-ink-faint leading-[1.4] mt-[2px]">{why}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Grid>
      </Section>

      <Section n="02" title="Connected sources" right={<Chip tone="warn">MOCKED — nothing is connected</Chip>}>
        <Table head={["Source", "Vendor", "Protocol", "State", "Connected since"]} minWidth={700}>
          {tenant.sources.map((s) => (
            <tr key={s.name}>
              <td className="font-semibold">{s.name}</td>
              <td className="text-[11.8px] text-ink-soft">{s.vendor}</td>
              <td className="font-mono text-[11.5px]">{s.proto}</td>
              <td><Chip tone={STATE[s.state]}>{s.state}</Chip></td>
              <td className="font-mono text-[11.5px] text-ink-faint">{s.since || "—"}</td>
            </tr>
          ))}
        </Table>
        <div className="mt-4">
          <GatedBtn
            allowed={can(PERM.MANAGE)}
            reason={`${user.name} is a ${user.role}. Only a platform administrator can add or re-authorise a connection.`}
            onClick={() => {}}
          >
            Add a connection
          </GatedBtn>
        </div>
        <Note className="mt-4">
          A connection has a lifecycle: it is authorised once and then needs refreshing forever. The degraded
          row above is the realistic case — a scope-limited connection that returns some resource types and
          not others, which the evidence agent has to reason about rather than treat as absent.
        </Note>
      </Section>

      <Section n="03" title="Users and roles">
        <Table head={["User", "Role", "Can", "Cannot", ""]} minWidth={900}>
          {users.map((u) => {
            const r = ROLES[u.role];
            return (
              <tr key={u.id} className={u.id === user.id ? "bg-accent-wash" : ""}>
                <td>
                  <div className="flex items-center gap-[10px]">
                    <Avatar initials={u.initials} tone={TONE[u.role]} size={24} />
                    <div>
                      <div className="font-semibold text-[12.5px] leading-tight">{u.name}</div>
                      <div className="font-mono text-[9.5px] text-ink-faint mt-[3px]">{u.title}</div>
                    </div>
                  </div>
                </td>
                <td><Chip tone={TONE[u.role]}>{r.label}</Chip></td>
                <td className="text-[11.8px] text-ink-soft">{r.can}</td>
                <td className="text-[11.8px] text-bad">{r.cannot}</td>
                <td>
                  {u.id === user.id ? (
                    <span className="font-mono text-[9.5px] text-accent-ink">you</span>
                  ) : (
                    <button onClick={() => switchUser(u.id)} className="btn btn-ghost btn-sm">Become</button>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
        <Note className="mt-4">
          Use <b>Become</b> to switch role without signing out, then go to the Live Demo and try to approve a
          packet. The administrator is blocked by design: the person who configures the confidence thresholds
          is not the person who clears the packet.
        </Note>
      </Section>

      <Section n="04" title="Permission matrix">
        <Table head={["Action", ...TENANT_ROLES.map((r) => r.label)]} minWidth={760}>
          {TENANT_PERMS.map((p) => (
            <tr key={p}>
              <td className="font-semibold">{PERM_LABEL[p]}<div className="font-mono text-[9.5px] text-ink-faint font-normal mt-1">{p}</div></td>
              {TENANT_ROLES.map((r) => (
                <td key={r.id} className="text-center">
                  {r.perms.includes(p) ? <Chip tone="ok">yes</Chip> : <span className="text-ink-faint">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </Table>
        <Note className="mt-4">
          Four roles, and a fifth that is not here. The vendor&rsquo;s <b>platform operator</b> is not a role
          inside this organisation — it belongs to the company that runs the platform, holds no{" "}
          <code className="font-mono text-[11px]">case.view</code> permission anywhere, and appears on the
          Operator Console rather than in this matrix. Sign in as the platform operator from the login screen
          to see what that separation actually looks like.
        </Note>
      </Section>

      <Section n="05" title="Isolation — what does not cross">
        <Grid min={248}>
          {[
            ["Case queue", `${cases.length} cases belong to ${tenant.short}. Cases from another tenant are not filtered out of a shared list — they are not reachable at all.`],
            ["Agent memory", "The compounding asset and the sharpest governance risk. One organisation's outcomes must never inform another's without an explicit agreement. This is open question 23."],
            ["Policy packs", `${m.policies} payer policies, versioned per tenant. A case is judged against the policy in force on its date of service, for that tenant's contract.`],
            ["Connections and tokens", "Each connection is authorised by and for one tenant. An EHR token stays inside the trust boundary that issued it, which is also why tokens are never forwarded onward."],
            ["Payer contracts", `${payersFor(tenant.id).length} of ${DB.payers.length} payers are contracted here. A tenant sees the tiers it actually deals with.`],
            ["Audit", "Append-only and tenant-scoped. An administrator reads their own organisation's trail and nobody else's."],
          ].map(([t, b]) => (
            <Card key={t} title={t}><p className="text-ink-soft text-[12.5px] m-0">{b}</p></Card>
          ))}
        </Grid>
      </Section>
    </>
  );
}
