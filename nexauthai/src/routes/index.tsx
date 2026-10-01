/**
 * Routes.
 *
 * One route table for one portal. Every persona and every tenant signs into
 * the same application; `RequireScope` decides which of these routes resolve
 * for the signed-in token rather than shipping a different build per role.
 *
 * It is not security — there is no auth here — it exists so a persona cannot
 * land on a screen its scopes would not grant in production, which keeps the
 * prototype honest about what each one actually sees.
 */

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import Login from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import OnePortal from "@/pages/OnePortal";
import AdminAudit from "@/pages/admin/Audit";
import AdminBilling from "@/pages/admin/Billing";
import AdminConnectors, { ConnectorDetail } from "@/pages/admin/Connectors";
import AdminOverview from "@/pages/admin/Overview";
import AdminPayers from "@/pages/admin/Payers";
import AdminTenants from "@/pages/admin/Tenants";
import AdminUsers from "@/pages/admin/Users";
import ClinicalQueue from "@/pages/clinical/Queue";
import OpsDashboard from "@/pages/ops/Dashboard";
import NewRequest from "@/pages/ops/NewRequest";
import OpsRequests from "@/pages/ops/Requests";
import Worklist from "@/pages/ops/Worklist";
import RequestDetailPage from "@/pages/shared/RequestDetail";
import type { Scope } from "@/types";

function RequireScope({ scope, children }: { scope: Scope; children: React.ReactNode }) {
  const { can, role } = useSession();
  if (!can(scope)) {
    return <Navigate to={role?.landingPath ?? "/"} replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  const { user, role } = useSession();
  const location = useLocation();

  if (!user || !role) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to={role.landingPath} replace />} />
        <Route path="/login" element={<Navigate to={role.landingPath} replace />} />

        {/* Open to every persona: the notification centre and the statement
            that there is only one portal behind all of this. */}
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/portal" element={<OnePortal />} />

        {/* ---------------- Staff / Operations ---------------- */}
        <Route
          path="/ops"
          element={
            <RequireScope scope="request:create">
              <OpsDashboard />
            </RequireScope>
          }
        />
        <Route
          path="/ops/requests"
          element={
            <RequireScope scope="request:read">
              <OpsRequests />
            </RequireScope>
          }
        />
        <Route
          path="/ops/requests/:id"
          element={
            <RequireScope scope="request:read">
              <RequestDetailPage />
            </RequireScope>
          }
        />
        <Route
          path="/ops/new"
          element={
            <RequireScope scope="request:create">
              <NewRequest />
            </RequireScope>
          }
        />
        <Route
          path="/ops/worklist"
          element={
            <RequireScope scope="queue:work">
              <Worklist />
            </RequireScope>
          }
        />

        {/* ---------------- Clinical reviewer (licensed) ---------------- */}
        <Route
          path="/clinical"
          element={
            <RequireScope scope="clinical:attest">
              <ClinicalQueue />
            </RequireScope>
          }
        />
        <Route
          path="/clinical/cases"
          element={
            <RequireScope scope="clinical:attest">
              <OpsRequests linkBase="/clinical" />
            </RequireScope>
          }
        />
        <Route
          path="/clinical/:id"
          element={
            <RequireScope scope="clinical:attest">
              <RequestDetailPage backTo="/clinical" backLabel="Clinical review" />
            </RequireScope>
          }
        />

        {/* ---------------- Admin (tenant and platform reach) ---------------- */}
        <Route
          path="/admin"
          element={
            <RequireScope scope="connector:write">
              <AdminOverview />
            </RequireScope>
          }
        />
        <Route
          path="/admin/tenants"
          element={
            <RequireScope scope="tenant:manage">
              <AdminTenants />
            </RequireScope>
          }
        />
        <Route
          path="/admin/connectors"
          element={
            <RequireScope scope="connector:read">
              <AdminConnectors />
            </RequireScope>
          }
        />
        <Route
          path="/admin/connectors/:id"
          element={
            <RequireScope scope="connector:read">
              <ConnectorDetail />
            </RequireScope>
          }
        />
        <Route
          path="/admin/payers"
          element={
            <RequireScope scope="policy:write">
              <AdminPayers />
            </RequireScope>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireScope scope="user:manage">
              <AdminUsers />
            </RequireScope>
          }
        />
        <Route
          path="/admin/billing"
          element={
            <RequireScope scope="billing:manage">
              <AdminBilling />
            </RequireScope>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RequireScope scope="audit:read">
              <AdminAudit />
            </RequireScope>
          }
        />

        <Route path="*" element={<Navigate to={role.landingPath} replace />} />
      </Routes>
    </AppShell>
  );
}
