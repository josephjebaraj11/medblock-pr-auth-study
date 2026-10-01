/**
 * Session and role context.
 *
 * There is no real authentication. Choosing a role on the login screen sets
 * the active user, and the app renders from that user's scopes — the same
 * shape the production app would take from a Keycloak token, so the
 * components never learn a different habit.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoUserByRole, roles, store } from "@/mocks";
import type { Role, RoleId, Scope, User } from "@/types";

interface SessionValue {
  user: User | null;
  role: Role | null;
  signIn: (roleId: RoleId) => void;
  signOut: () => void;
  /** Scope check. Mirrors the API-side check the real app would do. */
  can: (scope: Scope) => boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

const STORAGE_KEY = "nexauthai.session.role";
const THEME_KEY = "nexauthai.theme";

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* Private browsing or blocked storage — the app works without it. */
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState<RoleId | null>(
    () => (readStored(STORAGE_KEY) as RoleId | null) ?? null,
  );
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (readStored(THEME_KEY) as "light" | "dark") ?? "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    writeStored(THEME_KEY, theme);
  }, [theme]);

  const signIn = useCallback((id: RoleId) => {
    setRoleId(id);
    writeStored(STORAGE_KEY, id);
  }, []);

  const signOut = useCallback(() => {
    setRoleId(null);
    writeStored(STORAGE_KEY, null);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    [],
  );

  const value = useMemo<SessionValue>(() => {
    const role = roleId ? (roles.find((r) => r.id === roleId) ?? null) : null;
    const userId = roleId ? demoUserByRole[roleId] : null;
    const user = userId ? (store.users.find((u) => u.id === userId) ?? null) : null;

    return {
      user,
      role,
      signIn,
      signOut,
      can: (scope: Scope) => Boolean(role?.scopes.includes(scope)),
      theme,
      toggleTheme,
    };
  }, [roleId, signIn, signOut, theme, toggleTheme]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside a SessionProvider");
  return ctx;
}
