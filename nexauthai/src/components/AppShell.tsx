/**
 * The application shell.
 *
 * There is one of these for the whole platform. Every tenant and every
 * persona renders this same shell; the navigation below is filtered by the
 * active token's scopes, not chosen from a per-role list, so a user holding
 * several personas sees the union and nobody is sent to a different app.
 *
 * The tenant chip in the header is there for the same reason: it makes the
 * "whose data am I looking at" half of the model visible, next to the
 * persona chip that answers "what may I do with it".
 */

import clsx from "clsx";
import {
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FileSearch,
  Inbox,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Plug,
  ScrollText,
  Stethoscope,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { tenants } from "@/mocks";
import { useSession } from "@/lib/session";
import { notificationService } from "@/services/adminService";
import type { Scope } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  scope: Scope;
  end?: boolean;
}

/**
 * One list, for everyone.
 *
 * Each entry names the scope that reveals it. Staff/Operations, the Clinical
 * Reviewer and Admin are reading the same array — they simply hold different
 * scopes, so different rows survive the filter.
 */
const NAV: NavItem[] = [
  // Staff / Operations
  { to: "/ops", label: "Dashboard", icon: <LayoutDashboard size={17} />, scope: "request:create", end: true },
  { to: "/ops/requests", label: "Requests", icon: <ClipboardList size={17} />, scope: "request:read" },
  { to: "/ops/new", label: "New request", icon: <FileSearch size={17} />, scope: "request:create" },
  { to: "/ops/worklist", label: "Exception queue", icon: <Inbox size={17} />, scope: "queue:work" },

  // Clinical reviewer (licensed)
  { to: "/clinical", label: "Clinical review", icon: <Stethoscope size={17} />, scope: "clinical:attest", end: true },
  { to: "/clinical/cases", label: "All cases", icon: <ListChecks size={17} />, scope: "clinical:decide" },

  // Admin — tenant reach and platform reach, same screens
  { to: "/admin", label: "Overview", icon: <LayoutDashboard size={17} />, scope: "connector:write", end: true },
  { to: "/admin/tenants", label: "Tenants", icon: <Building2 size={17} />, scope: "tenant:manage" },
  { to: "/admin/connectors", label: "Connectors", icon: <Plug size={17} />, scope: "connector:read" },
  { to: "/admin/payers", label: "Payers & rules", icon: <Building2 size={17} />, scope: "policy:write" },
  { to: "/admin/users", label: "Users & roles", icon: <UserRound size={17} />, scope: "user:manage" },
  { to: "/admin/billing", label: "Billing", icon: <CreditCard size={17} />, scope: "billing:manage" },
  { to: "/admin/audit", label: "Audit log", icon: <ScrollText size={17} />, scope: "audit:read" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, signOut, can, theme, toggleTheme } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    notificationService.list(user.id).then((rows) => {
      if (active) setUnread(rows.filter((n) => !n.readAt).length);
    });
    return () => {
      active = false;
    };
  }, [user, location.pathname]);

  if (!user || !role) return null;

  const items = NAV.filter((item) => can(item.scope));
  const tenant = tenants.find((t) => t.id === user.tenantId);
  const isPlatformAdmin = user.adminScope === "platform";

  const nav = (
    <nav aria-label="Main" className="space-y-0.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-tint-brand text-tint-brand-on"
                : "text-content-secondary hover:bg-surface-inset hover:text-content",
            )
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}

      {/* Reachable from every persona: the statement that all of the above
          is one application serving every tenant and every role. */}
      <NavLink
        to="/portal"
        className={({ isActive }) =>
          clsx(
            "mt-3 flex items-center gap-2.5 rounded-lg border-t border-line-subtle px-3 pb-2 pt-4 text-sm font-medium transition-colors",
            isActive
              ? "text-content-brand"
              : "text-content-muted hover:bg-surface-inset hover:text-content",
          )
        }
      >
        <Layers size={17} />
        How this portal works
      </NavLink>
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface-subtle">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-surface-raised/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg p-2 text-content-secondary hover:bg-surface-inset lg:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link to={role.landingPath} className="flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white"
              aria-hidden
            >
              NA
            </span>
            <span className="type-display text-base font-semibold text-content">NexAuthAI</span>
          </Link>

          {/* Whose data (tenant) and what you may do with it (persona) —
              the two halves of the single-portal model, always on screen. */}
          <span className="hidden items-center gap-1.5 md:flex">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-inset px-2.5 py-1 text-xs font-medium text-content-secondary"
              title={
                isPlatformAdmin
                  ? "Signed in with platform reach — every tenant"
                  : `Tenant ${user.tenantId}`
              }
            >
              <Building2 size={12} aria-hidden />
              {isPlatformAdmin ? "All tenants" : (tenant?.name ?? user.tenantId)}
            </span>
            <span className="rounded-full bg-surface-inset px-2.5 py-1 text-xs font-medium text-content-muted">
              {role.label}
            </span>
          </span>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/notifications"
              className="relative rounded-lg p-2 text-content-secondary hover:bg-surface-inset"
              aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-content-secondary hover:bg-surface-inset"
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <span className="mx-1 hidden items-center gap-2 sm:flex">
              <span
                className="grid h-7 w-7 place-items-center rounded-full bg-aqua-600 text-xs font-semibold text-white"
                aria-hidden
              >
                {user.initials}
              </span>
              <span className="hidden text-xs font-medium text-content-secondary md:inline">
                {user.name}
              </span>
            </span>

            <button
              type="button"
              onClick={signOut}
              className="rounded-lg p-2 text-content-secondary hover:bg-surface-inset"
              aria-label="Switch persona"
              title="Switch persona"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">{nav}</div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-x-0 top-14 z-20 border-b border-line bg-surface-raised p-4 shadow-lift lg:hidden">
            {nav}
          </div>
        )}

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
