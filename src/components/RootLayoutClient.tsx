"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

/**
 * RootLayoutClient — conditionally wraps pages in AppShell.
 * Login page renders without AppShell wrapper.
 */
export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  // Login page is standalone
  if (isLoginPage) {
    return <>{children}</>;
  }

  // While loading, show nothing (AuthGuard handles loading state)
  if (loading) return null;

  // Not authenticated — AuthGuard will redirect
  if (!user) return <>{children}</>;

  // Authenticated — wrap in AppShell
  return <AppShell>{children}</AppShell>;
}
