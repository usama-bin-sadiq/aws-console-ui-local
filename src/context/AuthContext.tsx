"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  username: string;
  email?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  permissions: string[];
  isSuperAdmin: boolean;
  loginMethod: "sqlite" | "credentials" | "root";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithCredentials: (accessKeyId: string, secretAccessKey: string, sessionToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setupMFA: () => Promise<string>;
  verifyMFA: (code: string) => Promise<void>;
  isRootUser: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  getCredentials: () => { accessKeyId: string; secretAccessKey: string; sessionToken?: string } | null;
  getRegion: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "us-east-1";
const DEFAULT_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "test";
const DEFAULT_SECRET_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "test";
const DEFAULT_SESSION_TOKEN = process.env.NEXT_PUBLIC_AWS_SESSION_TOKEN;
const ROOT_USERNAME = process.env.NEXT_PUBLIC_ROOT_USERNAME || "root";
const ROOT_PASSWORD = process.env.NEXT_PUBLIC_ROOT_PASSWORD || "root123";

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check root session
      const rootSession = localStorage.getItem("aws_console_root_session");
      if (rootSession) {
        try {
          const session = JSON.parse(rootSession);
          setUser({
            username: "root",
            email: "root@localhost",
            credentials: session.credentials,
            permissions: ["*"],
            isSuperAdmin: true,
            loginMethod: "root",
          });
          return;
        } catch {
          localStorage.removeItem("aws_console_root_session");
        }
      }

      // Check current user session (from SQLite-backed auth)
      const currentUser = localStorage.getItem("aws_console_current_user");
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser);
          setUser({
            username: userData.username,
            email: userData.email,
            credentials: {
              accessKeyId: userData.accessKeyId || DEFAULT_ACCESS_KEY,
              secretAccessKey: userData.secretAccessKey || DEFAULT_SECRET_KEY,
            },
            permissions: userData.permissions || ["*"],
            isSuperAdmin: userData.isRoot || false,
            loginMethod: "sqlite",
          });
          return;
        } catch {
          localStorage.removeItem("aws_console_current_user");
        }
      }

      // Check credentials session
      const credsSession = localStorage.getItem("aws_console_credentials_session");
      if (credsSession) {
        try {
          const session = JSON.parse(credsSession);
          const isRoot = session.credentials?.accessKeyId === DEFAULT_ACCESS_KEY;
          setUser({
            username: isRoot ? "root" : "custom",
            email: isRoot ? "root@localhost" : "custom@localhost",
            credentials: session.credentials,
            permissions: ["*"],
            isSuperAdmin: isRoot,
            loginMethod: "credentials",
          });
          return;
        } catch {
          localStorage.removeItem("aws_console_credentials_session");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign in via /api/auth (SQLite backend)
  const signIn = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signin", username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Sign in failed");

    localStorage.setItem("aws_console_current_user", JSON.stringify(data.user));
    setUser({
      username: data.user.username,
      email: data.user.email,
      credentials: {
        accessKeyId: data.user.accessKeyId || DEFAULT_ACCESS_KEY,
        secretAccessKey: data.user.secretAccessKey || DEFAULT_SECRET_KEY,
      },
      permissions: data.user.permissions || ["*"],
      isSuperAdmin: data.user.isRoot || false,
      loginMethod: "sqlite",
    });
  }, []);

  // Sign in with raw AWS credentials
  const signInWithCredentials = useCallback(async (accessKeyId: string, secretAccessKey: string, sessionToken?: string) => {
    try {
      const { STSClient, GetCallerIdentityCommand } = await import("@aws-sdk/client-sts");
      const client = new STSClient({
        region: REGION,
        credentials: { accessKeyId, secretAccessKey, sessionToken },
      });
      await client.send(new GetCallerIdentityCommand({}));

      const credentials = { accessKeyId, secretAccessKey, sessionToken };
      const isRoot = accessKeyId === DEFAULT_ACCESS_KEY;
      localStorage.setItem("aws_console_credentials_session", JSON.stringify({ credentials }));
      setUser({
        username: isRoot ? "root" : "custom",
        email: isRoot ? "root@localhost" : "custom@localhost",
        credentials,
        permissions: ["*"],
        isSuperAdmin: isRoot,
        loginMethod: "credentials",
      });
    } catch (err: any) {
      throw new Error(err.message || "Invalid AWS credentials");
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem("aws_console_root_session");
    localStorage.removeItem("aws_console_current_user");
    localStorage.removeItem("aws_console_credentials_session");
    setUser(null);
  }, []);

  const setupMFA = useCallback(async () => {
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0, value = 0, output = "";
    for (const byte of array) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) { output += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
    return output;
  }, []);

  const verifyMFA = useCallback(async (code: string) => {
    setUser((prev) => (prev ? { ...prev } : null));
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.permissions.includes("*")) return true;
      return (
        user.permissions.includes(permission) ||
        user.permissions.some((p) => {
          if (p.endsWith(":*")) return permission.startsWith(p.replace(":*", ":"));
          return false;
        })
      );
    },
    [user]
  );

  const getCredentials = useCallback(() => {
    if (!user?.credentials) return null;
    return user.credentials;
  }, [user]);

  const getRegion = useCallback(() => REGION, []);

  return (
    <AuthContext.Provider
      value={{
        user, loading, signIn, signInWithCredentials,
        signOut, setupMFA, verifyMFA,
        isRootUser: user?.username === ROOT_USERNAME,
        isSuperAdmin: user?.isSuperAdmin === true,
        hasPermission, getCredentials, getRegion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
