"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@cloudscape-design/components/spinner";

/**
 * Paths reachable without a session.
 *
 * `/signup` must be here. Accounts are only seeded when
 * `NEXT_PUBLIC_ROOT_PASSWORD` is set, so on a fresh install the database has no
 * users at all — without this, an unauthenticated visitor is bounced from
 * signup to a login page they cannot use, and the app cannot be entered.
 */
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  // Part of the sign-in journey: a locked-out visitor must be able to reach the
  // recovery form and the session-expired notice without already having a
  // session. Without these, both redirect to /login and the user is stuck.
  "/forgot-password",
  "/session-expired",
  "/api/health",
];

/**
 * AuthGuard — wraps the app shell and redirects to /login if not authenticated.
 * Public paths (login, health) are accessible without auth.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!loading && !user && !isPublicPath) {
      router.push("/login");
    }
  }, [loading, user, isPublicPath, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", color: "#545b64", marginBottom: "12px" }}>Loading...</div>
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!user && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
