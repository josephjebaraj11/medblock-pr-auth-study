/**
 * The application shell.
 *
 * Navigation is derived from the active role's scopes, not from a hard-coded
 * list per role — the same way the production app would render from token
 * scopes. A user holding several roles would see the union.
 */

import clsx from "clsx";
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  FileSearch,
  Inbox,
  LayoutDashboard,
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

const NAV: NavItem[] = [
  // Provider / clinic staff
  { to: "/provider", label: "Dashboard", icon: <LayoutDashboard size={17} />, scope: "request:create", end: true },
  { to: "/provider/requests", label: "Requests", icon: <ClipboardList size={17} />, scope: "request:read" },
  { to: "/provider/new", label: "New request", icon: <FileSearch size={17} />, scope: "request:create" },
  { to: "/provider/worklist", label: "Worklist", icon: <Inbox size={17} />, scope: "queue:work" },

  // Ordering physician
  { to: "/physician", label: "My orders", icon: <LayoutDashboard size={17} />, scope: "request:read:own", end: true },
  { to: "/physician/review", label: "Clinical review", icon: <Stethoscope size={17} />, scope: "clinical:attest" },

  // Payer
  { to: "/payer/queue", label: "Intake queue", icon: <Inbox size={17} />, scope: "queue:assign" },
  { to: "/payer/clinical", label: "Clinical review", icon: <Stethoscope size={17} />, scope: "clinical:decide" },

  // Patient
  { to: "/patient", label: "My authorizations", icon: <Activity size={17} />, scope: "patient:read:self", end: true },

  // Admin
  { to: "/admin", label: "Overview", icon: <LayoutDashboard size={17} />, scope: "connector:write", end: true },
  { to: "/admin/connectors", label: "Connectors", icon: <Plug size={17} />, scope: "connector:read" },
  { to: "/admin/payers", label: "Payers & rules", icon: <Building2 size={17} />, scope: "policy:write" },
  { to: "/admin/users", label: "Users & roles", icon: <UserRound size={17} />, scope: "user:manage" },
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

          <span className="hidden rounded-full bg-surface-inset px-2.5 py-1 text-xs font-medium text-content-muted sm:inline">
            {role.label}
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
              aria-label="Switch role"
              title="Switch role"
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
