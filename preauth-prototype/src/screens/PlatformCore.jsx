import React, { useState } from "react";
import { DB } from "../data/index.js";
import { Card, Chip, Note, Section, Table, WarnBox } from "../components/ui.jsx";
import { usePanel, Dl, Ul } from "../components/Panel.jsx";

const GRP_TONE = { "g-parity": "acc", "g-preauth": "hum", "g-edge": "f" };
const DECIDE_TONE = (d) =>
  d.startsWith("build") ? "acc" : d.startsWith("adopt") ? "hum" : d.startsWith("buy") ? "ok" : "warn";

/* A fenced code sketch. Deliberately not syntax-highlighted — the point is the
   shape of the thing, and colour would imply this is running code. It is not. */
const Code = ({ label, body }) => (
  <figure className="m-0 mt-[6px]">
    {label && <figcaption className="kick mb-[6px]">{label}</figcaption>}
    <pre className="bg-sunken border border-rule rounded-md p-[12px_14px] overflow-x-auto text-[11.2px] leading-[1.6] font-mono text-ink-soft whitespace-pre">
      {body}
    </pre>
  </figure>
);

export default function PlatformCore() {
  const panel = usePanel();
  const [sel, setSel] = useState(null);
  const { groups, comps } = DB.core;

  const open = (c) => {
    setSel(c.id);
    const grp = groups.find((g) => g.id === c.grp);
    panel.open(
      `${c.n} · ${c.name}`,
      c.tag,
      <Dl
        items={[
          ["Where it sits", grp.label],
          ["In plain terms", c.plain],
          ["What it is", c.purpose],
          ["What you actually write", <Ul items={c.build} />],
          ["What prior authorisation adds", <span className="text-ink">{c.preauth}</span>],
          ...(c.code ? [["Sketch", <Code label={c.code.label} body={c.code.body} />]] : []),
          [
            "Stack",
            <div className="space-y-[10px]">
              {c.stack.map(([need, use, how]) => (
                <div key={need}>
                  <div className="text-[12.2px] font-semibold text-ink leading-tight">{need}</div>
                  <div className="font-mono text-[10.5px] text-accent-ink mt-[2px]">{use}</div>
                  <div className="text-[11.6px] mt-[2px] leading-[1.45]">{how}</div>
                </div>
              ))}
            </div>,
          ],
          [
            "Build / adopt / buy",
            <>
              <Chip tone={DECIDE_TONE(c.decide)}>{c.decide}</Chip>
              <div className="mt-2">{c.why}</div>
            </>,
          ],
          ["Phase and effort", `${c.phase} · ${c.effort}`],
          ["Risk", <span className="text-bad">{c.risk}</span>],
        ]}
      />
    );
  };

  return (
    <>
      <Note className="mb-[18px]">
        This is the layer the whole argument rests on: <b>we build it ourselves</b>. Twelve components,
        grouped by whether they are parity with an off-the-shelf clinical data platform, the extra three that
        prior authorisation forces into the core, or the edge that must stay out of it. Click any card for the
        plain-language version, what you actually write, the stack, and the build/adopt/buy call.
      </Note>

      {groups.map((g) => {
        const items = comps.filter((c) => c.grp === g.id);
        return (
          <Section
            key={g.id}
            n={g.label.split(" ")[0]}
            title={g.label.replace(/^\w+ · /, "")}
            right={<Chip tone={GRP_TONE[g.id]}>{g.kick}</Chip>}
          >
            <p className="text-ink-soft text-[12.8px] max-w-[84ch] mb-[14px]">{g.desc}</p>
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(272px,1fr))" }}>
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => open(c)}
                  className={`card text-left transition-all hover:-translate-y-px hover:shadow-card hover:border-accent ${
                    sel === c.id ? "border-accent bg-accent-wash" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-[6px]">
                    <span className="font-mono text-[10px] text-accent-ink">{c.n}</span>
                    <span className="text-[13.2px] font-semibold leading-tight">{c.name}</span>
                  </div>
                  <div className="text-[11.8px] text-ink-faint leading-[1.45] mb-[10px]">{c.tag}</div>
                  <p className="text-[12.2px] text-ink-soft leading-[1.5] m-0">{c.plain}</p>
                  <div className="flex flex-wrap gap-[5px] mt-[11px] pt-[10px] border-t border-rule-soft">
                    <Chip tone={DECIDE_TONE(c.decide)}>{c.decide}</Chip>
                    <Chip tone="f">{c.phase}</Chip>
                    <Chip tone="f">{c.effort}</Chip>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        );
      })}

      <Section n="seam" title="The seam — what the workflow is allowed to know">
        <div className="grid gap-[14px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
          <Card title="The core knows nothing about prior authorisation" tone="acc">
            <p className="text-ink-soft text-[12.5px]">
              No component in group A or B contains the word <i>authorisation</i> in its data model. The store
              holds clinical resources; the terminology service expands value sets; the policy store holds
              versioned criteria that happen, today, to have come from payers. Referral management and quality
              measure abstraction read the same four services.
            </p>
          </Card>
          <Card title="The workflow knows nothing about vendors" tone="hum">
            <p className="text-ink-soft text-[12.5px]">
              No agent knows whether the evidence came from Epic, a QHIN or a fax, or whether the packet left
              by PAS, X12 or a browser script. It asks the platform a question and submits through one
              interface. That is the property that makes a second payer tier configuration rather than code.
            </p>
          </Card>
          <Card title="The test, if you are unsure" tone="f">
            <p className="text-ink-soft text-[12.5px]">
              Could you delete the entire agent layer and still have something a customer would pay for? If
              yes, you built a platform. If no, you built an agent with extra steps. And if a capability in
              the workflow turns out to be useful to a second workflow, it was misplaced.
            </p>
          </Card>
        </div>
      </Section>

      <Section n="openehr" title="The one decision that is a rewrite if you get it wrong">
        <WarnBox label="openEHR and FHIR, or FHIR alone">
          <p className="mb-2">
            openEHR buys a genuinely longitudinal, archetype-governed record. It also buys a second modelling
            discipline, a smaller hiring pool and a mapping layer between the two worlds. FHIR alone ships
            faster and is worse at longitudinal structure. This propagates into every derived model and every
            query the evidence agent writes.
          </p>
          <p className="m-0">
            <b className="text-ink">The recommendation in this build:</b> FHIR R4 as the wire format and the raw
            shape, with the derived clinical-domain-model layer modelled using openEHR archetype discipline —
            without running an openEHR CDR on day one. That keeps the modelling rigour, keeps the hiring pool,
            and leaves the CDR as a decision you can still take in month nine. Deferring it is recoverable;
            adopting it and reversing is not.
          </p>
        </WarnBox>
      </Section>

      <Section n="honest" title="The honest caveat">
        <Table head={["What people assume is hard", "What is actually hard"]} minWidth={620}>
          {[
            ["Writing the FHIR client and the pull loop", "Getting a production app registration approved by each EHR vendor — weeks to months, on their calendar, and no code shortens it."],
            ["Storing clinical data", "Deciding what the derived layer looks like, and being able to represent a negative finding as an answer rather than a missing row."],
            ["Matching a policy criterion", "Getting the policy into the store at all. It arrives as a PDF, it changes without notice, and curation is a permanent operations function."],
            ["Building the agents", "Calibrating their confidence, which needs a customer's labelled history — so the first customer is also the first training partner."],
            ["Multi-tenancy", "Nothing, if workspace_id is on every table from the first one. A retrofit is the most tedious migration you will ever run."],
          ].map(([a, b]) => (
            <tr key={a}>
              <td className="text-ink-faint">{a}</td>
              <td className="font-medium">{b}</td>
            </tr>
          ))}
        </Table>
      </Section>
    </>
  );
}
