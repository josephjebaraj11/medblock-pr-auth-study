import React, { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import LoginScreen from "./auth/LoginScreen.jsx";
import { PanelProvider } from "./components/Panel.jsx";
import Shell from "./components/Shell.jsx";
import Overview from "./screens/Overview.jsx";
import Architecture from "./screens/Architecture.jsx";
import Agents from "./screens/Agents.jsx";
import ProcessFlow from "./screens/ProcessFlow.jsx";
import Journey from "./screens/Journey.jsx";
import LiveDemo, { DemoTopRight } from "./screens/LiveDemo.jsx";
import Integrations from "./screens/Integrations.jsx";
import TenantAccess from "./screens/TenantAccess.jsx";
import PlatformCore from "./screens/PlatformCore.jsx";
import BuildPlan from "./screens/BuildPlan.jsx";
import Ops from "./screens/Ops.jsx";
import { useDemoEngine, CHAIN } from "./demo/engine.js";
import { SCENARIO_TENANT, PERM } from "./data/index.js";

export const ROUTES = [
  { id: "overview", n: "01", label: "Overview", t: "Prior authorisation, and why it is a platform problem",
    s: "The delay, the manual work, and the argument for building the data platform before the workflow that runs on it." },
  { id: "arch", n: "02", label: "Architecture", t: "Solution architecture",
    s: "Five layers. Click any component for its purpose, inputs and outputs, protocols, and what is mocked here versus real in production." },
  { id: "agents", n: "03", label: "Agents", t: "Seven specialist agents under one orchestrator",
    s: "Each has one job, one set of platform tools, and one rule about when it stops and asks a human." },
  { id: "flow", n: "04", label: "Process Flow", t: "Lifecycle, with swimlanes",
    s: "Order to decision, including the more-info loop and the appeal path. Decision points and human gates are marked." },
  { id: "journey", n: "05", label: "Customer Journey", t: "Three people, three experiences",
    s: "The coordinator, the ordering physician and the patient — what each does today, what hurts, and what changes." },
  { id: "demo", n: "06", label: "Live Demo", t: "Live demo — the work queue",
    s: "Mock cases, scripted agent runs, a human approval gate, and three payer outcomes. This is the centrepiece." },
  { id: "integr", n: "07", label: "Integrations", t: "Integrations and protocols",
    s: "Every connection, its direction, the standard it speaks, and what is simulated in this prototype." },
  { id: "tenant", n: "08", label: "Tenant & Access", t: "Tenant, connections, users and roles",
    s: "What this organisation is allowed to do, who can do it, and what does not cross between tenants." },
  { id: "core", n: "09", label: "Platform Core", t: "The platform core — what we build ourselves",
    s: "Twelve components, the build/adopt/buy call on each, and the seam between the core and the workflow that runs on it." },
  { id: "plan", n: "10", label: "Build Plan", t: "Build plan — forty weeks, two bands",
    s: "Platform phases and workflow phases, the exit criterion for each, and what actually threatens the date." },
  { id: "ops", n: "11", label: "Operator Console", t: "Platform operations — across every tenant",
    s: "The vendor's own console: connector registry, connection health and pull telemetry. Cross-tenant, and deliberately free of any clinical content.",
    perm: PERM.OPS },
];

/* A platform operator is not a customer. They get the platform screens and
   nothing that reads a case — the queue is not filtered for them, it is absent. */
const OPERATOR_ROUTES = ["arch", "core", "plan", "ops", "integr"];

export function routesFor(user) {
  if (user?.role === "operator") {
    return OPERATOR_ROUTES.map((id) => ROUTES.find((r) => r.id === id)).filter(Boolean);
  }
  return ROUTES.filter((r) => !r.perm);
}

function Authed() {
  const { tenant, user, launchContext } = useAuth();
  const engine = useDemoEngine();
  const routes = routesFor(user);
  const home = routes[0].id;
  const [route, setRoute] = useState(home);
  const launched = useRef(false);

  /* Switching user can remove the current screen from under you — an operator
     has no Live Demo. Fall back to their first screen rather than blank. */
  useEffect(() => {
    if (!routes.some((r) => r.id === route)) setRoute(home);
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Hash routing: #screen, or #demo/<scenario>/<stage> to land mid-run. */
  useEffect(() => {
    const applyHash = () => {
      const parts = (location.hash.slice(1) || "").split("/");
      if (parts[0] === "demo" && parts.length === 3 && CHAIN[parts[1]]) {
        if (SCENARIO_TENANT[parts[1]] !== tenant.id) return; // another tenant's case: not reachable
        if (!routes.some((r) => r.id === "demo")) return;    // and not reachable by role either
        if (engine.jump(parts[1], parts[2])) setRoute("demo");
        return;
      }
      if (routes.some((r) => r.id === parts[0])) setRoute(parts[0]);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [tenant.id, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A SMART launch arrives with a patient already in context. Land on that case. */
  useEffect(() => {
    if (launchContext?.caseId && !launched.current) {
      launched.current = true;
      setRoute("demo");
      engine.setSel(launchContext.caseId);
    }
  }, [launchContext]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (id) => {
    setRoute(id);
    try { if (location.hash.slice(1) !== id) history.replaceState(null, "", "#" + id); } catch { /* file:// */ }
    document.getElementById("main")?.scrollTo(0, 0);
  };

  const r = routes.find((x) => x.id === route) || routes[0];
  const screens = {
    overview: <Overview onRoute={go} />,
    arch: <Architecture onRoute={go} />,
    agents: <Agents />,
    flow: <ProcessFlow />,
    journey: <Journey />,
    demo: <LiveDemo engine={engine} />,
    integr: <Integrations />,
    tenant: <TenantAccess />,
    core: <PlatformCore />,
    plan: <BuildPlan />,
    ops: <Ops />,
  };

  return (
    <Shell routes={routes} route={route} onRoute={go} title={r.t} sub={r.s}
      topRight={route === "demo" ? <DemoTopRight engine={engine} /> : null}>
      {screens[route]}
    </Shell>
  );
}

function Gate() {
  const { ready, user } = useAuth();
  if (!ready) return null;
  if (!user) return <LoginScreen />;
  return (
    <PanelProvider>
      <Authed />
    </PanelProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
