import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DB, ROLES, can as hasPerm } from "../data/index.js";

/* ---------------------------------------------------------------------------
   MOCK AUTHENTICATION.  No credentials are checked, nothing is sent anywhere,
   there is no token and no backend. The session is a user id in localStorage.
   In production this is OIDC against the tenant's identity provider, or a
   SMART on FHIR EHR launch, with SMART scopes gating every platform read.
   --------------------------------------------------------------------------- */

const KEY = "preauth.session.v1";
const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (DB.userById[s.userId]) setSession(s);
      }
    } catch {
      /* private browsing, cleared storage — start signed out */
    }
    setReady(true);
  }, []);

  const persist = (s) => {
    setSession(s);
    try {
      s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY);
    } catch {
      /* session simply will not survive a reload */
    }
  };

  const value = useMemo(() => {
    const user = session ? DB.userById[session.userId] : null;
    const tenant = user ? DB.tenantById[user.tenantId] : null;
    return {
      ready,
      session,
      user,
      tenant,
      role: user ? ROLES[user.role] : null,
      launchContext: session?.launchContext || null,
      can: (perm) => hasPerm(user, perm),
      signIn: (userId, opts = {}) =>
        persist({ userId, at: new Date().toISOString(), method: opts.method || "password", launchContext: opts.launchContext || null }),
      switchUser: (userId) =>
        persist({ userId, at: new Date().toISOString(), method: "demo-switch", launchContext: null }),
      signOut: () => persist(null),
    };
  }, [session, ready]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
