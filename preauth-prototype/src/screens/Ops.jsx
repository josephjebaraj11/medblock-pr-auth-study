import React, { useState } from "react";
import { DB, PERM, casesFor } from "../data/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Card, Chip, Grid, Note, Section, Table, GatedBtn, WarnBox, Avatar } from "../components/ui.jsx";

const KIND = { ehr: "acc", payer: "hum", clearinghouse: "hum", network: "ag", document: "f" };
const STATE = { live: "ok", beta: "warn", degraded: "warn", planned: "f", active: "ok", refresh_failed: "bad", disconnected: "bad" };

export default function Ops() {
  const { user, can } = useAuth();
  const { registry, connections, runs, phi, visible } = DB.ops;
  const [peek, setPeek] = useState(null);

  const operator = can(PERM.OPS);
  const tenantName = (id) => DB.tenantById[id]?.short || id;

  return (
    <>
      <Note className="mb-[18px]">
        The vendor's own console, and the third tier of the admin model: a <b>master admin</b> who onboards
        tenants and runs the shared connector registry, a <b>tenant admin</b> inside each customer, and
        <b> end users</b> who see only their own role's queue. Everything on this screen is cross-tenant.
        Nothing on it is clinical — and the block below is not a filter over PHI, it is the absence of the
        permission that would return any.
      </Note>

      <Section n="01" title="The boundary, stated before the data">
        <Grid min={300}>
          <Card title="What the platform operator can see" tone="ok">
            <ul className="m-0 pl-4 space-y-[5px] text-[12.3px] text-ink-soft">
              {visible.map((v) => <li key={v} className="marker:text-ok">{v}</li>)}
            </ul>
          </Card>
          <Card title="What the platform operator cannot see" tone="bad">
            <ul className="m-0 pl-4 space-y-[5px] text-[12.3px] text-ink-soft">
              {phi.map((v) => <li key={v} className="marker:text-bad">{v}</li>)}
            </ul>
            <div className="mt-[12px] pt-[10px] border-t border-rule-soft">
              <GatedBtn
                allowed={can(PERM.VIEW)}
                reason={`${user.name} holds the ${user.role} role, whose permission set does not include case.view. There is no tenant to select and no queue to filter — the read is refused before a tenant is chosen.`}
                onClick={() => setPeek("Springfield Health Partners")}
              >
                Open Springfield&rsquo;s case queue
              </GatedBtn>
              {peek && (
                <div className="mt-3 text-[12px] text-ink-soft">
                  {casesFor("springfield").length} cases would be listed here. You are seeing this because you
                  are signed in with a role that holds <code className="font-mono text-[11px]">case.view</code>.
                </div>
              )}
            </div>
          </Card>
          <Card title="Why this is a separate organisation" tone="ag">
            <p className="text-ink-soft text-[12.3px]">
              Platform operations is not a fourth tenant. It has no patients, no cases, no payer contracts and
              no agent memory. Modelling it as a customer with extra rights is the mistake that eventually
              produces a cross-tenant read nobody intended.
            </p>
            <p className="text-ink-soft text-[12.3px] m-0">
              In production the separation is a different credential set and a different database role — not a
              flag on a user row, and certainly not a check in React.
            </p>
          </Card>
        </Grid>
      </Section>

      <Section
        n="02"
        title="Connector registry"
        right={<Chip tone="warn">{registry.length} connectors · shared across tenants</Chip>}
      >
        <Table head={["Connector", "Kind", "Version", "Auth / transport pattern", "State", "Tenants using it", "Last discovery"]} minWidth={980}>
          {registry.map((r) => (
            <tr key={r.id}>
              <td className="font-semibold">
                {r.name}
                <div className="text-[11.3px] text-ink-faint font-normal mt-[3px] leading-[1.4] max-w-[34ch]">{r.note}</div>
              </td>
              <td><Chip tone={KIND[r.kind]}>{r.kind}</Chip></td>
              <td className="font-mono text-[11.3px]">{r.ver}</td>
              <td className="font-mono text-[11.3px] text-ink-soft">{r.pattern}</td>
              <td><Chip tone={STATE[r.state]}>{r.state}</Chip></td>
              <td>
                {r.tenants.length === 0 ? (
                  <span className="text-ink-faint">—</span>
                ) : (
                  <div className="flex flex-wrap gap-[4px]">
                    {r.tenants.map((t) => <Chip key={t} tone="f">{tenantName(t)}</Chip>)}
                  </div>
                )}
              </td>
              <td className="font-mono text-[11.3px] text-ink-faint">{r.discovered || "not yet"}</td>
            </tr>
          ))}
        </Table>
        <div className="mt-4">
          <GatedBtn
            allowed={operator}
            reason="Only a platform operator manages the shared connector registry. A tenant administrator configures their own connections; they do not version the connector everybody runs."
            onClick={() => {}}
          >
            Re-run endpoint discovery
          </GatedBtn>
        </div>
        <Note className="mt-4">
          A connector is built once and joins the registry for every client after that. The Raintree row is the
          shape that matters commercially: built for one tenant, promoted to the registry, and the second
          customer who needs it pays nothing for the original development. That is where the margin is.
        </Note>
      </Section>

      <Section n="03" title="Connection health, across every tenant">
        <Table head={["Tenant", "Source", "State", "Token last refreshed", "Pulls 24h", "Failures 24h"]} minWidth={760}>
          {connections.map((c) => (
            <tr key={c.tenant + c.source} className={c.state !== "active" ? "bg-bad-wash" : ""}>
              <td className="font-semibold">{tenantName(c.tenant)}</td>
              <td>{c.source}</td>
              <td><Chip tone={STATE[c.state]}>{c.state}</Chip></td>
              <td className="font-mono text-[11.3px] text-ink-faint">{c.refreshed}</td>
              <td className="font-mono tabular-nums">{c.pulls24h}</td>
              <td className={`font-mono tabular-nums ${c.fail24h > 5 ? "text-bad font-semibold" : ""}`}>{c.fail24h}</td>
            </tr>
          ))}
        </Table>
        <Note className="mt-4">
          Cascade Valley's health-coaching source sits in <b>refresh_failed</b>, not <i>disconnected</i>, and the
          distinction is the whole reason the state machine has six states rather than two. Its records are not
          absent — they are unreachable, and the evidence agent has to say so rather than reporting a clean
          negative. That is what lowers the confidence score on the denial scenario, and it is the single most
          useful thing this console tells a support engineer.
        </Note>
      </Section>

      <Section n="04" title="Pull runs — this morning" right={<Chip tone="f">counts and error classes only, never payloads</Chip>}>
        <Table head={["Time", "Tenant", "Source", "Resource", "Pages", "Saved", "Duration", "Outcome"]} minWidth={880}>
          {runs.map((r, i) => (
            <tr key={i}>
              <td className="font-mono text-[11.3px]">{r.t}</td>
              <td>{tenantName(r.tenant)}</td>
              <td className="text-[11.9px]">{r.source}</td>
              <td className="font-mono text-[11.3px]">{r.type}</td>
              <td className="font-mono tabular-nums">{r.pages}</td>
              <td className="font-mono tabular-nums">{r.saved}</td>
              <td className="font-mono tabular-nums text-ink-faint">{(r.ms / 1000).toFixed(1)}s</td>
              <td>
                <Chip tone={r.ok ? "ok" : "bad"}>{r.ok ? "ok" : "failed"}</Chip>
                {r.err && <div className="text-[11.2px] text-ink-soft mt-[4px] leading-[1.4] max-w-[40ch]">{r.err}</div>}
              </td>
            </tr>
          ))}
        </Table>
        <Note className="mt-4">
          The 07:14 row is the pull engine working as designed: two 429s, Retry-After honoured, the same URL
          retried rather than the next page, and the run completed. Without that branch it would have looked
          like a successful run that quietly collected eleven documents out of a longer list.
        </Note>
      </Section>

      <Section n="05" title="Tenants under management">
        <Grid min={260}>
          {DB.tenants.map((t) => {
            const conns = connections.filter((c) => c.tenant === t.id);
            const bad = conns.filter((c) => c.state !== "active").length;
            return (
              <Card key={t.id} tone={bad ? "warn" : "f"}>
                <div className="flex items-start gap-3 mb-[10px]">
                  <Avatar initials={t.initials} size={30} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight">{t.short}</div>
                    <div className="font-mono text-[9.5px] text-ink-faint mt-[3px]">{t.ehr} · {t.seats} seats</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-[5px]">
                  <Chip tone={bad ? "bad" : "ok"}>{conns.length - bad}/{conns.length} connections healthy</Chip>
                  <Chip tone="f">{registry.filter((r) => r.tenants.includes(t.id)).length} connectors</Chip>
                </div>
                <div className="text-[11.6px] text-ink-faint mt-[10px] leading-[1.45]">
                  Case volume, first-pass rate and agent memory are tenant-scoped metrics. They appear on that
                  tenant&rsquo;s own screen, read by that tenant&rsquo;s own administrator — not here.
                </div>
              </Card>
            );
          })}
        </Grid>
      </Section>

      <Section n="06" title="The governance line this console must not cross">
        <WarnBox label="Agent memory, aggregated">
          Cross-case learning inside one tenant is the compounding asset. Across tenants it is the sharpest
          governance risk in the product — and this console is exactly where it would be tempting to build.
          &ldquo;These three payers accept this phrasing&rdquo; is enormously valuable and is derived from
          customers&rsquo; outcomes. Whether there is a consented, aggregated tier, and who owns the uplift it
          produces, is open question 28. It is a contract question first and an engineering question second,
          and the default answer until that contract exists is <b className="text-ink">no aggregation at all</b>.
        </WarnBox>
      </Section>
    </>
  );
}
