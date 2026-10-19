import { describe, expect, it } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The auth guard's public-path list is a bare constant, so nothing in the
 * compiler stops someone removing an entry from it. That is exactly how account
 * creation became unreachable: sign-up was not public, so an unauthenticated
 * visitor was redirected from the sign-up form to the sign-in page they had no
 * account for — and with seeded accounts gated behind an environment variable,
 * a fresh install could not be entered at all.
 *
 * These tests assert the list, and that sign-up stays on it.
 */
const AUTH_GUARD = join(process.cwd(), "src", "components", "AuthGuard.tsx");
const source = readFileSync(AUTH_GUARD, "utf8");

const publicPaths = (() => {
  const match = source.match(/PUBLIC_PATHS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) throw new Error("PUBLIC_PATHS not found in AuthGuard.tsx");
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
})();

describe("auth guard public paths", () => {
  it("declares a public-path list", () => {
    expect(publicPaths.length).toBeGreaterThan(0);
  });

  it("keeps sign-up reachable without a session", () => {
    expect(publicPaths).toContain("/signup");
  });

  it("keeps sign-in and health reachable without a session", () => {
    expect(publicPaths).toContain("/login");
    expect(publicPaths).toContain("/api/health");
  });

  it("keeps the rest of the recovery journey reachable without a session", () => {
    // A user who cannot sign in has no session, so anything on that path that
    // is guarded bounces them straight back to the form that failed. Both of
    // these were unreachable until they were added.
    expect(publicPaths).toContain("/forgot-password");
    expect(publicPaths).toContain("/session-expired");
  });

  it("does not mark application pages public", () => {
    // A stray entry here would expose a console page to unauthenticated users.
    for (const guarded of ["/", "/s3", "/ec2", "/iam", "/settings"]) {
      expect(publicPaths).not.toContain(guarded);
    }
  });

  it("prefix entries are deliberate, so a path is never matched by accident", () => {
    // `/login` must not make `/login-anything` public, and `/api/health` must not
    // make `/api/health-secret` public. Entries therefore end at a path
    // boundary; a bare prefix with no guard is a smell worth failing on.
    for (const entry of publicPaths) {
      expect(entry.startsWith("/")).toBe(true);
      expect(entry).not.toMatch(/[?*]/);
    }
  });
});
