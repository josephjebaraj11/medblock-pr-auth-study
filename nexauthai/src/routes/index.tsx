/**
 * Routes.
 *
 * Grouped by role. `RequireRole` is not security — there is no auth here —
 * it exists so a role cannot land on a screen its scopes would not grant in
 * production, which keeps the prototype honest about what each role sees.
 */

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useSession } from "@/lib/session";
import Login from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import AdminAudit from "@/pages/admin/Audit";
import AdminConnectors, { ConnectorDetail } from "@/pages/admin/Connectors";
import AdminOverview from "@/pages/admin/Overview";
import AdminPayers from "@/pages/admin/Payers";
import AdminUsers from "@/pages/admin/Users";
import PatientPortal from "@/pages/patient/Portal";
import PayerClinicalQueue from "@/pages/payer/ClinicalQueue";
import PayerQueue from "@/pages/payer/Queue";
import PayerReviewDetail from "@/pages/payer/ReviewDetail";
import ClinicalReviewQueue from "@/pages/physician/ClinicalReview";
import MyOrders from "@/pages/physician/MyOrders";
import ProviderDashboard from "@/pages/provider/Dashboard";
import NewRequest from "@/pages/provider/NewRequest";
import ProviderRequests from "@/pages/provider/Requests";
import Worklist from "@/pages/provider/Worklist";
import RequestDetailPage from "@/pages/shared/RequestDetail";
import type { Scope } from "@/types";

function RequireRole({ scope, children }: { scope: Scope; children: React.ReactNode }) {
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
        <Route path="/notifications" element={<Notifications />} />

        {/* ---------------- Provider / clinic staff ---------------- */}
        <Route
          path="/provider"
          element={
            <RequireRole scope="request:create">
              <ProviderDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/provider/requests"
          element={
            <RequireRole scope="request:read">
              <ProviderRequests />
            </RequireRole>
          }
        />
        <Route
          path="/provider/requests/:id"
          element={
            <RequireRole scope="request:read">
              <RequestDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/provider/new"
          element={
            <RequireRole scope="request:create">
              <NewRequest />
            </RequireRole>
          }
        />
        <Route
          path="/provider/worklist"
          element={
            <RequireRole scope="queue:work">
              <Worklist />
            </RequireRole>
          }
        />

        {/* ---------------- Ordering physician ---------------- */}
        <Route
          path="/physician"
          element={
            <RequireRole scope="request:read:own">
              <MyOrders />
            </RequireRole>
          }
        />
        <Route
          path="/physician/review"
          element={
            <RequireRole scope="clinical:attest">
              <ClinicalReviewQueue />
            </RequireRole>
          }
        />
        <Route
          path="/physician/review/:id"
          element={
            <RequireRole scope="clinical:attest">
              <RequestDetailPage backTo="/physician/review" backLabel="Clinical review" />
            </RequireRole>
          }
        />
        <Route
          path="/physician/orders/:id"
          element={
            <RequireRole scope="request:read:own">
              <RequestDetailPage backTo="/physician" backLabel="My orders" />
            </RequireRole>
          }
        />

        {/* ---------------- Payer ---------------- */}
        <Route
          path="/payer/queue"
          element={
            <RequireRole scope="queue:assign">
              <PayerQueue />
            </RequireRole>
          }
        />
        <Route
          path="/payer/clinical"
          element={
            <RequireRole scope="clinical:decide">
              <PayerClinicalQueue />
            </RequireRole>
          }
        />
        <Route
          path="/payer/review/:id"
          element={
            <RequireRole scope="queue:work">
              <PayerReviewDetail />
            </RequireRole>
          }
        />
        <Route
          path="/payer/clinical/:id"
          element={
            <RequireRole scope="clinical:decide">
              <PayerReviewDetail />
            </RequireRole>
          }
        />

        {/* ---------------- Patient ---------------- */}
        <Route
          path="/patient"
          element={
            <RequireRole scope="patient:read:self">
              <PatientPortal />
            </RequireRole>
          }
        />

        {/* ---------------- Admin ---------------- */}
        <Route
          path="/admin"
          element={
            <RequireRole scope="connector:write">
              <AdminOverview />
            </RequireRole>
          }
        />
        <Route
          path="/admin/connectors"
          element={
            <RequireRole scope="connector:read">
              <AdminConnectors />
            </RequireRole>
          }
        />
        <Route
          path="/admin/connectors/:id"
          element={
            <RequireRole scope="connector:read">
              <ConnectorDetail />
            </RequireRole>
          }
        />
        <Route
          path="/admin/payers"
          element={
            <RequireRole scope="policy:write">
              <AdminPayers />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole scope="user:manage">
              <AdminUsers />
            </RequireRole>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RequireRole scope="audit:read">
              <AdminAudit />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to={role.landingPath} replace />} />
      </Routes>
    </AppShell>
  );
}
