import React from "react";
import { DB, payersFor } from "../data/index.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Card, Chip, Grid, Note, Section, Table } from "../components/ui.jsx";

const DIR = { inbound: "ok", outbound: "acc", bidirectional: "hum", internal: "f" };

/* A row can be switched off for a tenant. Showing that is more honest than a
   feature table that implies everyone gets everything. */
function tenantState(row, tenant) {
  if (row.proto === "Browser automation") return tenant.flags.portalAutomation ? null : "not enabled for this tenant";
  if (row.proto === "TEFCA exchange") return tenant.flags.networkExchange ? null : "not connected for this tenant";
  if (row.proto === "Document ingestion") return tenant.flags.ocrIngestion ? null : "not enabled for this tenant";
  return null;
}

export default function Integrations() {
  const { tenant } = useAuth();
  const groups = [...new Set(DB.integrations.map((r) => r.grp))];
  const mine = new Set((tenant.payerIds || []).map((id) => DB.payById[id]?.short));

  return (
    <>
      <Note className="mb-[18px]">
        Every connection the system would make, and what it speaks. The last column is the honest one: in this
        prototype, every single row is simulated from local JSON. Nothing here opens a socket. Rows disabled
        for <b>{tenant.short}</b> are marked — tenants do not all get the same capabilities.
      </Note>

      {groups.map((g) => (
        <Section key={g} n={g} title="">
          <Table head={["Connection", "Direction", "Protocol", "Standard / shape", "Notes", "In this prototype"]} minWidth={900}>
            {DB.integrations.filter((r) => r.grp === g).map((r) => {
              const off = tenantState(r, tenant);
              return (
                <tr key={r.conn} className={off ? "opacity-55" : ""}>
                  <td className="font-semibold">
                    {r.conn}
                    {off && <div className="mt-1"><Chip tone="bad">{off}</Chip></div>}
                  </td>
                  <td><Chip tone={DIR[r.dir]}>{r.dir}</Chip></td>
                  <td className="font-mono text-[11.5px]">{r.proto}</td>
                  <td className="text-[11.8px] text-ink-soft">{r.std}</td>
                  <td className="text-[11.8px] text-ink-soft">{r.notes}</td>
                  <td className="text-[11.8px] text-ink-faint">{r.mock}</td>
                </tr>
              );
            })}
          </Table>
        </Section>
      ))}

      <Section n="tiers" title="Three payer tiers, one interface upward">
        <Grid min={248}>
          {DB.payers.map((p) => {
            const contracted = mine.has(p.short);
            return (
              <Card key={p.id} tone={p.color === "ok" ? "ok" : p.color === "warn" ? "warn" : "bad"} className={contracted ? "" : "opacity-60"}>
                <div className="flex justify-between gap-[10px] items-baseline mb-2">
                  <h3 className="card-h m-0">{p.short}</h3>
                  <Chip tone={p.color === "ok" ? "ok" : p.color === "warn" ? "warn" : "bad"}>{p.tier}</Chip>
                </div>
                <p className="text-ink-soft text-[12.5px]">{p.tierNote}</p>
                <div className="flex flex-wrap gap-[5px] mb-[10px]">
                  {p.channels.map((c) => <Chip key={c} tone="acc">{c}</Chip>)}
                </div>
                <div className="font-mono text-[11px] text-ink-faint">expedited {p.slaExpedited} · standard {p.slaStandard}</div>
                <div className="text-[12px] text-ink-soft mt-2">{p.autoAdjudicate}</div>
                <div className="mt-3 pt-3 border-t border-rule-soft">
                  <Chip tone={contracted ? "ok" : "f"}>{contracted ? `contracted with ${tenant.short}` : "no contract with this tenant"}</Chip>
                </div>
              </Card>
            );
          })}
        </Grid>
        <Note className="mt-4">
          The agents are identical across all three tiers. Only the connector changes. That is the whole
          argument for putting the integration layer in the platform rather than inside the workflow — when
          Cascade eventually publishes a PAS endpoint, nothing in the agent layer is touched.
        </Note>
      </Section>
    </>
  );
}
