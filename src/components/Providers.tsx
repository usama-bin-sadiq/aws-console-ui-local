"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";

/**
 * Providers — wraps the app with AuthProvider + AuthGuard.
 * Used in layout.tsx which is a server component.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
