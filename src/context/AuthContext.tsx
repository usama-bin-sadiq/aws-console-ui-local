"use client";

import { apiFetch } from "@/lib/api-client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

interface User {
  username: string;
  email?: string;
  accountName?: string;
  accountId?: string | null;
  credentials?: {
    accessKeyId: string;
  };
  permissions: string[];
  isSuperAdmin: boolean;
  loginMethod: "sqlite";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    username: string,
    password: string,
    options?: { email?: string; accountId?: string },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isRootUser: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  getRegion: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1";
const ROOT_USERNAME = process.env.NEXT_PUBLIC_ROOT_USERNAME || "root";

function toUser(data: Record<string, unknown>): User {
  return {
    username: String(data.username || ""),
    email: data.email ? String(data.email) : undefined,
    accountName: data.accountName ? String(data.accountName) : undefined,
    accountId: data.accountId ? String(data.accountId) : null,
    credentials: data.accessKeyId ? { accessKeyId: String(data.accessKeyId) } : undefined,
    permissions: Array.isArray(data.permissions) ? data.permissions.map(String) : ["*"],
    isSuperAdmin: data.isRoot === true,
    loginMethod: "sqlite",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthState = useCallback(async () => {
    try {
      const response = await apiFetch("/api/auth", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (data.user) setUser(toUser(data.user));
    } catch {
      // An unavailable auth service is treated as signed out.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuthState();
  }, [checkAuthState]);

  const signIn = useCallback(
    async (
      username: string,
      password: string,
      options?: { email?: string; accountId?: string },
    ) => {
      const response = await apiFetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signin",
          username,
          password,
          ...(options?.email ? { email: options.email } : {}),
          ...(options?.accountId ? { accountId: options.accountId } : {}),
        }),
      });
      const data = await response.json();

      if (data.mfaRequired && !data.user) {
        const error = new Error(data.error || "MFA required") as Error & {
          mfaRequired?: boolean;
          sessionToken?: string;
          username?: string;
        };
        error.mfaRequired = true;
        error.sessionToken = data.sessionToken;
        error.username = data.username;
        throw error;
      }

      if (!response.ok) throw new Error(data.error || "Sign in failed");
      setUser(toUser(data.user));
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout" }),
      });
    } finally {
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.permissions.includes("*")) return true;
      return user.permissions.some((granted) => {
        if (granted === permission) return true;
        return granted.endsWith(":*") && permission.startsWith(granted.replace(":*", ":"));
      });
    },
    [user],
  );

  const getRegion = useCallback(() => REGION, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signOut,
    isRootUser: user?.username === ROOT_USERNAME,
    isSuperAdmin: user?.isSuperAdmin === true,
    hasPermission,
    getRegion,
  }), [user, loading, signIn, signOut, hasPermission, getRegion]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
