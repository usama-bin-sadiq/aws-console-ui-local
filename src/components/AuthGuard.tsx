"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = ["/login", "/api/health"];

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", color: "#545b64", marginBottom: "12px" }}>Loading...</div>
          <div style={{ width: "40px", height: "40px", border: "4px solid #e9ebed", borderTop: "4px solid #0073bb", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
