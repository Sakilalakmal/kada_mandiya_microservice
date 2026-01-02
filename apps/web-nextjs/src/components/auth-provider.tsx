"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api";
import {
  clearToken as clearStoredToken,
  getRolesFromToken,
  getToken,
  setToken as persistToken,
} from "@/lib/auth";

type AuthContextValue = {
  token: string | null;
  roles: string[];
  isVendor: boolean;
  setAuthToken: (token: string | null) => void;
  refreshAuth: () => Promise<string | null>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = React.useState<string | null>(null);

  const setAuthToken = React.useCallback((value: string | null) => {
    if (value) {
      persistToken(value);
      setTokenState(value);
    } else {
      clearStoredToken();
      setTokenState(null);
    }
  }, []);

  React.useEffect(() => {
    setTokenState(getToken());
  }, []);

  React.useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === "accessToken") {
        setTokenState(event.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const roles = React.useMemo(() => getRolesFromToken(token), [token]);
  const isVendor = roles.includes("vendor");

  const refreshAuth = React.useCallback(async () => {
    const current = token ?? getToken();
    if (!current) {
      throw new Error("Not authenticated");
    }

    const res = await apiFetch(
      "/auth/refresh",
      {
        method: "POST",
      },
      current
    );
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      if (res.status === 401) {
        setAuthToken(null);
      }
      const err = new Error(
        (data?.error as any)?.message ??
          (data?.message as string | undefined) ??
          "Failed to refresh session"
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const next =
      (data.accessToken as string | undefined) ??
      (data.token as string | undefined);
    if (!next) {
      throw new Error("Refresh failed: missing access token");
    }

    setAuthToken(String(next));
    return String(next);
  }, [setAuthToken, token]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      token,
      roles,
      isVendor,
      setAuthToken,
      refreshAuth,
    }),
    [token, roles, isVendor, setAuthToken, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
