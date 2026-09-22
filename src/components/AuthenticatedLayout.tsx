"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

/**
 * AuthenticatedLayout — wraps children in AppShell only when authenticated.
 * Login page renders without AppShell.
 */
export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Don't show AppShell while loading or on login page
  if (loading) return null;
  if (!user) return <>{children}</>;

  return <AppShell>{children}</AppShell>;
}
